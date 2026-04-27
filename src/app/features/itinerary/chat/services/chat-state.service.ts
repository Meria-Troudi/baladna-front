import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject, Observable, throwError } from 'rxjs';
import { tap, catchError, finalize } from 'rxjs/operators';
import { ChatApiService } from './chat-api.service';
import { ChatWebSocketService } from './chat-websocket.service';
import {
  ChatState,
  ChatMessageState,
  ChatMessage,
  WebSocketReceivedPayload
} from '../models/chat.model';

/**
 * Chat State Management Service
 * Manages all chat state and coordinates between REST API and WebSocket
 */
@Injectable({
  providedIn: 'root'
})
export class ChatStateService {
  private readonly initialState: ChatState = {
    messages: [],
    totalMessages: 0,
    currentPage: 0,
    pageSize: 20,
    isLoading: false,
    error: null,
    wsConnected: false,
    wsConnecting: false,
    typingUsers: new Set(),
    editingMessageId: null,
    selectedMessageId: null,
    connectionError: null,
    lastSyncTime: null
  };

  private state$ = new BehaviorSubject<ChatState>(this.initialState);
  private messageAdded$ = new Subject<ChatMessageState>();
  private messageUpdated$ = new Subject<ChatMessageState>();
  private messageDeleted$ = new Subject<string>();
  private systemNotification$ = new Subject<string>();

  constructor(
    private chatApi: ChatApiService,
    private webSocket: ChatWebSocketService
  ) {
    this.initializeWebSocketListeners();
  }

  // Selectors
  getState$(): Observable<ChatState> {
    return this.state$.asObservable();
  }

  getMessage$(id: string): Observable<ChatMessageState | undefined> {
    return new Observable(observer => {
      const subscription = this.state$.subscribe(state => {
        observer.next(state.messages.find(m => m.id === id));
      });
      return () => subscription.unsubscribe();
    });
  }

  getMessages$(): Observable<ChatMessageState[]> {
    return new Observable(observer => {
      const subscription = this.state$.subscribe(state => {
        observer.next(state.messages);
      });
      return () => subscription.unsubscribe();
    });
  }

  getConnectionStatus$(): Observable<boolean> {
    return new Observable(observer => {
      const subscription = this.state$.subscribe(state => {
        observer.next(state.wsConnected);
      });
      return () => subscription.unsubscribe();
    });
  }

  getIsLoading$(): Observable<boolean> {
    return new Observable(observer => {
      const subscription = this.state$.subscribe(state => {
        observer.next(state.isLoading);
      });
      return () => subscription.unsubscribe();
    });
  }

  getError$(): Observable<string | null> {
    return new Observable(observer => {
      const subscription = this.state$.subscribe(state => {
        observer.next(state.error);
      });
      return () => subscription.unsubscribe();
    });
  }

  getTypingUsers$(): Observable<Set<number>> {
    return new Observable(observer => {
      const subscription = this.state$.subscribe(state => {
        observer.next(new Set(state.typingUsers));
      });
      return () => subscription.unsubscribe();
    });
  }

  onMessageAdded$(): Observable<ChatMessageState> {
    return this.messageAdded$.asObservable();
  }

  onMessageUpdated$(): Observable<ChatMessageState> {
    return this.messageUpdated$.asObservable();
  }

  onMessageDeleted$(): Observable<string> {
    return this.messageDeleted$.asObservable();
  }

  onSystemNotification$(): Observable<string> {
    return this.systemNotification$.asObservable();
  }

  /**
   * Load initial chat history
   */
  loadChatHistory(itineraryId: string, page: number = 0, size: number = 20): void {
    this.setState({ isLoading: true, error: null });

    this.chatApi
      .getChatHistory(itineraryId, { page, size })
      .pipe(
        tap(response => {
          const messages: ChatMessageState[] = response.messages.map(msg => ({
            ...msg,
            isPending: false,
            hasError: false
          }));

          this.setState({
            messages,
            totalMessages: response.totalMessages,
            currentPage: response.page,
            pageSize: response.size,
            isLoading: false,
            lastSyncTime: new Date().toISOString()
          });
        }),
        catchError(error => {
          console.error('Failed to load chat history:', error);
          const errorMessage = error?.error?.message || error?.message || 'Failed to load chat history';
          this.setState({ isLoading: false, error: errorMessage });
          return throwError(() => error);
        })
      )
      .subscribe();
  }

  /**
   * Load more messages (pagination)
   */
  loadMoreMessages(itineraryId: string): void {
    const currentState = this.state$.value;
    const nextPage = currentState.currentPage + 1;

    if (nextPage * currentState.pageSize >= currentState.totalMessages) {
      console.log('Already loaded all messages');
      return;
    }

    this.setState({ isLoading: true });

    this.chatApi
      .getChatHistory(itineraryId, { page: nextPage, size: currentState.pageSize })
      .pipe(
        tap(response => {
          const newMessages: ChatMessageState[] = response.messages.map(msg => ({
            ...msg,
            isPending: false,
            hasError: false
          }));

          // Prepend to existing messages (older messages go to top)
          const updatedMessages = [...newMessages, ...currentState.messages];

          this.setState({
            messages: updatedMessages,
            currentPage: response.page,
            isLoading: false
          });
        }),
        catchError(error => {
          this.setState({ isLoading: false, error: 'Failed to load more messages' });
          return throwError(() => error);
        })
      )
      .subscribe();
  }

  /**
   * Send a new message
   */
  sendMessage(itineraryId: string, content: string): void {
    // Create optimistic message
    const optimisticMessage: ChatMessageState = {
      id: `temp-${Date.now()}`,
      itineraryId,
      senderId: 0, // Will be set by backend
      senderName: 'You', // Will be set by backend
      content,
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPending: true,
      hasError: false
    };

    // Add optimistic message
    const currentState = this.state$.value;
    this.setState({
      messages: [...currentState.messages, optimisticMessage]
    });

    // Send via WebSocket
    this.webSocket.sendMessage(content);
  }

  /**
   * Edit an existing message
   */
  editMessage(itineraryId: string, messageId: string, content: string): void {
    this.setState({ editingMessageId: messageId });

    // Send via WebSocket
    this.webSocket.editMessage(messageId, content);
  }

  /**
   * Delete a message
   */
  deleteMessage(itineraryId: string, messageId: string): void {
    // Send via WebSocket
    this.webSocket.deleteMessage(messageId);
  }

  /**
   * Select a message
   */
  selectMessage(messageId: string | null): void {
    this.setState({ selectedMessageId: messageId });
  }

  /**
   * Set typing status
   */
  setEditingMessage(messageId: string | null): void {
    this.setState({ editingMessageId: messageId });
  }

  /**
   * Add a typing user
   */
  addTypingUser(userId: number): void {
    const currentState = this.state$.value;
    const updatedTypingUsers = new Set(currentState.typingUsers);
    updatedTypingUsers.add(userId);
    this.setState({ typingUsers: updatedTypingUsers });
  }

  /**
   * Remove a typing user
   */
  removeTypingUser(userId: number): void {
    const currentState = this.state$.value;
    const updatedTypingUsers = new Set(currentState.typingUsers);
    updatedTypingUsers.delete(userId);
    this.setState({ typingUsers: updatedTypingUsers });
  }

  /**
   * Clear typing users
   */
  clearTypingUsers(): void {
    this.setState({ typingUsers: new Set() });
  }

  /**
   * Initialize WebSocket listeners and handlers
   */
  private initializeWebSocketListeners(): void {
    // Listen for WebSocket connection status
    this.webSocket.getConnectionStatus$().subscribe(connected => {
      this.setState({ wsConnected: connected });
    });

    // Listen for WebSocket errors
    this.webSocket.getConnectionError$().subscribe(error => {
      if (error) {
        this.setState({ connectionError: error });
      }
    });

    // Listen for incoming messages
    this.webSocket.onMessageReceived$().subscribe((payload: WebSocketReceivedPayload) => {
      this.handleWebSocketMessage(payload);
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleWebSocketMessage(payload: WebSocketReceivedPayload): void {
    switch (payload.type) {
      case 'SEND':
        this.handleIncomingMessage(payload);
        break;

      case 'EDIT':
        this.handleMessageEdit(payload);
        break;

      case 'DELETE':
        this.handleMessageDelete(payload);
        break;

      case 'TYPING':
        this.handleTypingIndicator(payload);
        break;

      case 'USER_JOINED':
        this.handleUserJoined(payload);
        break;

      case 'USER_LEFT':
        this.handleUserLeft(payload);
        break;

      case 'ERROR':
        this.setState({ connectionError: payload.error || 'An error occurred' });
        break;

      default:
        console.warn('Unknown message type:', payload);
    }
  }

  /**
   * Handle incoming message
   */
  private handleIncomingMessage(payload: any): void {
    const currentState = this.state$.value;

    // Find and replace optimistic message or add new message
    const messageIndex = currentState.messages.findIndex(
      m => m.id === payload.id || (m.isPending && m.content === payload.content && m.id.startsWith('temp-'))
    );

    const newMessage: ChatMessageState = {
      ...payload,
      isPending: false,
      hasError: false
    };

    let updatedMessages = [...currentState.messages];

    if (messageIndex >= 0) {
      updatedMessages[messageIndex] = newMessage;
    } else {
      updatedMessages.push(newMessage);
    }

    this.setState({ messages: updatedMessages });
    this.messageAdded$.next(newMessage);
  }

  /**
   * Handle message edit
   */
  private handleMessageEdit(payload: any): void {
    const currentState = this.state$.value;

    const messageIndex = currentState.messages.findIndex(m => m.id === payload.id);

    if (messageIndex >= 0) {
      const updatedMessage: ChatMessageState = {
        ...currentState.messages[messageIndex],
        content: payload.content,
        updatedAt: payload.timestamp,
        isEdited: true,
        isPending: false,
        hasError: false
      };

      const updatedMessages = [...currentState.messages];
      updatedMessages[messageIndex] = updatedMessage;

      this.setState({
        messages: updatedMessages,
        editingMessageId: null
      });

      this.messageUpdated$.next(updatedMessage);
    }
  }

  /**
   * Handle message delete
   */
  private handleMessageDelete(payload: any): void {
    const currentState = this.state$.value;

    const messageIndex = currentState.messages.findIndex(m => m.id === payload.id);

    if (messageIndex >= 0) {
      const updatedMessage: ChatMessageState = {
        ...currentState.messages[messageIndex],
        isDeleted: true,
        content: 'This message was deleted'
      };

      const updatedMessages = [...currentState.messages];
      updatedMessages[messageIndex] = updatedMessage;

      this.setState({ messages: updatedMessages });
      this.messageDeleted$.next(payload.id);
    }
  }

  /**
   * Handle typing indicator
   */
  private handleTypingIndicator(payload: any): void {
    this.addTypingUser(payload.senderId);

    // Auto-remove after timeout
    setTimeout(() => {
      this.removeTypingUser(payload.senderId);
    }, 3000);
  }

  /**
   * Handle user joined notification
   */
  private handleUserJoined(payload: any): void {
    this.systemNotification$.next(`${payload.senderName} joined the chat`);
  }

  /**
   * Handle user left notification
   */
  private handleUserLeft(payload: any): void {
    this.systemNotification$.next(`A user left the chat`);
  }

  /**
   * Update state
   */
  private setState(partialState: Partial<ChatState>): void {
    const currentState = this.state$.value;
    this.state$.next({ ...currentState, ...partialState });
  }

  /**
   * Clear error message
   */
  clearError(): void {
    const currentState = this.state$.value;
    this.state$.next({
      ...currentState,
      error: null
    });
  }

  /**
   * Reset state
   */
  resetState(): void {
    this.state$.next(this.initialState);
  }
}
