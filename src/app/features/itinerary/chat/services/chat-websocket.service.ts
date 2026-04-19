import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject, Observable } from 'rxjs';
import SockJS from 'sockjs-client';
import { Client, Stomp, IFrame, IMessage } from '@stomp/stompjs';
import {
  WebSocketReceivedPayload,
  WebSocketMessagePayload,
  WebSocketSendMessage,
  WebSocketEditMessage,
  WebSocketDeleteMessage,
  WebSocketTypingMessage,
  ChatMessage
} from '../models/chat.model';
import { AuthService } from '../../../auth/services/auth.service';

/**
 * WebSocket Service using STOMP over SockJS for real-time chat
 * Handles connection, message subscription, and broadcasting
 */
@Injectable({
  providedIn: 'root'
})
export class ChatWebSocketService implements OnDestroy {
  private stompClient: Client | null = null;
  private socket: WebSocket | null = null;

  // Observable streams for different message types
  private messageReceived$ = new Subject<WebSocketReceivedPayload>();
  private connectionStatus$ = new BehaviorSubject<boolean>(false);
  private connectionError$ = new Subject<string>();
  private isConnecting$ = new BehaviorSubject<boolean>(false);

  // Connection management
  private currentItineraryId: string | null = null;
  private currentUserId: number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000; // ms
  private reconnectIntervalId: any = null;

  // Typing indicator management
  private typingTimeout: Map<number, any> = new Map();
  private typingTimeoutDuration = 3000; // ms

  // Configuration
  private readonly WS_URL = '/api/chat';
  private readonly MESSAGES_TOPIC = '/topic/itineraries';
  private readonly TYPING_TOPIC = '/topic/itineraries';
  private readonly SEND_DESTINATION = '/app/chat/itineraries';

  constructor(private authService: AuthService) {}

  /**
   * Expose public observables for components
   */
  onMessageReceived$(): Observable<WebSocketReceivedPayload> {
    return this.messageReceived$.asObservable();
  }

  getConnectionStatus$(): Observable<boolean> {
    return this.connectionStatus$.asObservable();
  }

  getConnectionError$(): Observable<string> {
    return this.connectionError$.asObservable();
  }

  getIsConnecting$(): Observable<boolean> {
    return this.isConnecting$.asObservable();
  }

  /**
   * Check if currently connected
   */
  isConnected(): boolean {
    return this.connectionStatus$.value;
  }

  /**
   * Connect to WebSocket and establish STOMP connection
   * @param itineraryId The itinerary ID to connect to
   * @param userId The current user's ID
   */
  connect(itineraryId: string, userId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnected() && this.currentItineraryId === itineraryId) {
        resolve();
        return;
      }

      this.isConnecting$.next(true);
      this.currentItineraryId = itineraryId;
      this.currentUserId = userId;

      try {
        // Get JWT token from auth service for WebSocket connection
        const token = this.authService.getAccessToken();
        
        // Create WebSocket URL with SockJS fallback - include userId, token, and itineraryId
        let wsUrl = `${window.location.origin}${this.WS_URL}?userId=${userId}&itineraryId=${itineraryId}`;
        if (token) {
          wsUrl += `&token=${encodeURIComponent(token)}`;
        }

        // Create STOMP client with SockJS for cross-browser compatibility
        const connectHeaders: any = {};
        if (token) {
          connectHeaders['Authorization'] = `Bearer ${token}`;
        }

        const client = new Client({
          webSocketFactory: () => new SockJS(wsUrl),
          connectHeaders: connectHeaders,
          debug: (str: string) => {
            if (str.includes('[ERROR]')) {
              console.error('[Chat WS]', str);
            } else {
              console.log('[Chat WS]', str);
            }
          },
          reconnectDelay: 200, // Exponential backoff handled by onWebSocketError
          heartbeatIncoming: 4000,
          heartbeatOutgoing: 4000,
          onConnect: (frame: IFrame) => {
            console.log('[Chat WS] Connected to STOMP broker');
            this.reconnectAttempts = 0;
            this.connectionStatus$.next(true);
            this.connectionError$.next('');
            this.isConnecting$.next(false);

            // Subscribe to message topic
            this.subscribeToMessages();

            resolve();
          },
          onStompError: (frame: IFrame) => {
            console.error('[Chat WS] STOMP error:', frame);
            this.isConnecting$.next(false);
            this.handleConnectionError('WebSocket connection failed');
            reject(frame);
          },
          onWebSocketError: (event: Event) => {
            console.error('[Chat WS] WebSocket error:', event);
            this.handleConnectionError('WebSocket error occurred');
          },
          onWebSocketClose: () => {
            console.warn('[Chat WS] WebSocket closed');
            this.connectionStatus$.next(false);
            this.attemptReconnect();
          }
        });

        this.stompClient = client;
        client.activate();
      } catch (error) {
        console.error('[Chat WS] Connection setup failed:', error);
        this.isConnecting$.next(false);
        this.handleConnectionError('Failed to initialize WebSocket');
        reject(error);
      }
    });
  }

  /**
   * Subscribe to incoming messages on the STOMP topics
   */
  private subscribeToMessages(): void {
    if (!this.stompClient || !this.stompClient.active) {
      console.error('[Chat WS] Cannot subscribe - not connected');
      return;
    }

    // Subscribe to messages topic
    const messagesDestination = `${this.MESSAGES_TOPIC}/${this.currentItineraryId}/messages`;
    this.stompClient.subscribe(messagesDestination, (message: IMessage) => {
      try {
        const payload: WebSocketReceivedPayload = JSON.parse(message.body);
        console.log('[Chat WS] Message received:', payload);

        // Emit to subscribers
        this.messageReceived$.next(payload);
      } catch (error) {
        console.error('[Chat WS] Failed to parse message:', error, message.body);
      }
    });

    // Subscribe to typing topic
    const typingDestination = `${this.TYPING_TOPIC}/${this.currentItineraryId}/typing`;
    this.stompClient.subscribe(typingDestination, (message: IMessage) => {
      try {
        const payload: WebSocketReceivedPayload = JSON.parse(message.body);
        console.log('[Chat WS] Typing indicator received:', payload);

        // Handle typing messages with timeout
        if (payload.type === 'TYPING') {
          this.handleTypingIndicator(payload);
        }

        // Emit to subscribers
        this.messageReceived$.next(payload);
      } catch (error) {
        console.error('[Chat WS] Failed to parse typing message:', error, message.body);
      }
    });

    console.log(`[Chat WS] Subscribed to ${messagesDestination} and ${typingDestination}`);
  }

  /**
   * Send a new message via WebSocket
   * @param content The message content
   */
  sendMessage(content: string): void {
    if (!this.isConnected()) {
      console.warn('[Chat WS] Cannot send - not connected');
      this.connectionError$.next('Connection lost. Please try again.');
      return;
    }

    const message = {
      content
    };

    const destination = `${this.SEND_DESTINATION}/${this.currentItineraryId}/send`;
    this.sendToServer(destination, message);
  }

  /**
   * Send edit message via WebSocket
   * @param messageId The ID of the message to edit
   * @param content The new message content
   */
  editMessage(messageId: string, content: string): void {
    if (!this.isConnected()) {
      console.warn('[Chat WS] Cannot edit - not connected');
      this.connectionError$.next('Connection lost. Please try again.');
      return;
    }

    const message = {
      id: messageId,
      content
    };

    const destination = `${this.SEND_DESTINATION}/${this.currentItineraryId}/edit`;
    this.sendToServer(destination, message);
  }

  /**
   * Send delete message via WebSocket
   * @param messageId The ID of the message to delete
   */
  deleteMessage(messageId: string): void {
    if (!this.isConnected()) {
      console.warn('[Chat WS] Cannot delete - not connected');
      this.connectionError$.next('Connection lost. Please try again.');
      return;
    }

    const message = {
      id: messageId
    };

    const destination = `${this.SEND_DESTINATION}/${this.currentItineraryId}/delete`;
    this.sendToServer(destination, message);
  }

  /**
   * Send typing indicator
   * @param senderName The name of the user typing
   */
  sendTypingIndicator(senderName: string): void {
    if (!this.isConnected()) {
      return;
    }

    const message = {
      senderName
    };

    const destination = `${this.SEND_DESTINATION}/${this.currentItineraryId}/typing`;
    this.sendToServer(destination, message);
  }

  /**
   * Handle typing indicator with auto-dismiss timeout
   */
  private handleTypingIndicator(payload: any): void {
    if (payload.type !== 'TYPING' || !payload.senderId) {
      return;
    }

    // Clear existing timeout for this user
    if (this.typingTimeout.has(payload.senderId)) {
      clearTimeout(this.typingTimeout.get(payload.senderId));
    }

    // Set new timeout to remove typing indicator
    const timeoutId = setTimeout(() => {
      this.typingTimeout.delete(payload.senderId);
      // Emit a removal event (optional - handle in component)
    }, this.typingTimeoutDuration);

    this.typingTimeout.set(payload.senderId, timeoutId);
  }

  /**
   * Send message to server via STOMP
   * @param destination The STOMP destination (type determined by endpoint)
   * @param message The message payload (without type field - determined by destination)
   */
  private sendToServer(destination: string, message: any): void {
    if (!this.stompClient || !this.stompClient.active) {
      console.error('[Chat WS] STOMP not connected');
      return;
    }

    try {
      this.stompClient.publish({
        destination: destination,
        body: JSON.stringify(message)
      });
      console.log('[Chat WS] Message sent:', message);
    } catch (error) {
      console.error('[Chat WS] Failed to send message:', error);
      this.connectionError$.next('Failed to send message');
    }
  }

  /**
   * Handle connection errors and attempt reconnection
   */
  private handleConnectionError(error: string): void {
    this.connectionError$.next(error);
    this.connectionStatus$.next(false);
    this.attemptReconnect();
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[Chat WS] Max reconnection attempts reached');
      this.connectionError$.next('Connection failed. Max reconnection attempts reached.');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`[Chat WS] Reconnecting attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

    if (this.reconnectIntervalId) {
      clearTimeout(this.reconnectIntervalId);
    }

    this.reconnectIntervalId = setTimeout(() => {
      if (this.currentItineraryId && this.currentUserId) {
        this.connect(this.currentItineraryId, this.currentUserId)
          .catch(error => {
            console.error('[Chat WS] Reconnection failed:', error);
          });
      }
    }, delay);
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    console.log('[Chat WS] Disconnecting');

    // Clear typing timeouts
    this.typingTimeout.forEach(timeoutId => clearTimeout(timeoutId));
    this.typingTimeout.clear();

    // Clear reconnection interval
    if (this.reconnectIntervalId) {
      clearTimeout(this.reconnectIntervalId);
    }

    // Disconnect STOMP client
    if (this.stompClient && this.stompClient.active) {
      this.stompClient.deactivate().then(() => {
        console.log('[Chat WS] Disconnected from broker');
      });
    }

    // Clear socket reference
    if (this.socket) {
      this.socket = null;
    }

    this.connectionStatus$.next(false);
    this.currentItineraryId = null;
    this.currentUserId = null;
    this.reconnectAttempts = 0;
  }

  /**
   * Cleanup on service destruction
   */
  ngOnDestroy(): void {
    this.disconnect();
  }
}
