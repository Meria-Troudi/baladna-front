import { Component, OnInit, OnDestroy, Input, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ChatStateService } from '../../services/chat-state.service';
import { ChatWebSocketService } from '../../services/chat-websocket.service';
import { ChatState, ChatMessageState } from '../../models/chat.model';

/**
 * Chat Container Component
 * Main component that manages the chat interface and coordinates all sub-components
 */
@Component({
  selector: 'app-chat-container',
  templateUrl: './chat-container.component.html',
  styleUrls: ['./chat-container.component.css']
})
export class ChatContainerComponent implements OnInit, OnDestroy {
  @Input() itineraryId: string = '';
  @Input() currentUserId: number = 0;
  @Input() currentUserName: string = '';
  @ViewChild('confirmationModal') confirmationModal: any;

  // State (initialized in ngOnInit after constructor runs)
  chatState$!: Observable<ChatState>;
  isLoading$!: Observable<boolean>;
  error$!: Observable<string | null>;
  messages$!: Observable<ChatMessageState[]>;
  connectionStatus$!: Observable<boolean>;
  typingUsers$!: Observable<Set<number>>;

  showScrollButton = false;
  private destroy$ = new Subject<void>();
  private deleteMessageCallback: (() => void) | null = null;

  constructor(
    private chatStateService: ChatStateService,
    private webSocketService: ChatWebSocketService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Initialize observables after constructor
    this.chatState$ = this.chatStateService.getState$();
    this.isLoading$ = this.chatStateService.getIsLoading$();
    this.error$ = this.chatStateService.getError$();
    this.messages$ = this.chatStateService.getMessages$();
    this.connectionStatus$ = this.chatStateService.getConnectionStatus$();
    this.typingUsers$ = this.chatStateService.getTypingUsers$();
    // Get itinerary ID from route if not provided as input
    if (!this.itineraryId) {
      this.route.params.pipe(
        takeUntil(this.destroy$)
      ).subscribe(params => {
        this.itineraryId = params['id'];
        this.initializeChat();
      });
    } else {
      this.initializeChat();
    }
  }

  /**
   * Initialize chat: load history and connect WebSocket
   */
  private initializeChat(): void {
    if (!this.itineraryId || !this.currentUserId) {
      console.error('Missing itineraryId or currentUserId');
      return;
    }

    // Load initial chat history
    this.chatStateService.loadChatHistory(this.itineraryId);

    // Connect WebSocket
    this.webSocketService
      .connect(this.itineraryId, this.currentUserId)
      .catch(error => {
        console.error('Failed to connect to chat WebSocket:', error);
      });

    // Subscribe to system notifications
    this.chatStateService.onSystemNotification$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(notification => {
        console.log('System notification:', notification);
        // Could show toast notification here
      });
  }

  /**
   * Handle sending a message
   */
  onMessageSend(content: string): void {
    if (!content || !content.trim()) {
      return;
    }

    this.chatStateService.sendMessage(this.itineraryId, content.trim());
  }

  /**
   * Handle editing a message
   */
  onMessageEdit(messageId: string, content: string): void {
    if (!content || !content.trim()) {
      return;
    }

    this.chatStateService.editMessage(this.itineraryId, messageId, content.trim());
  }

  /**
   * Handle deleting a message
   */
  onMessageDelete(messageId: string): void {
    if (!this.confirmationModal) {
      console.error('Confirmation modal not initialized');
      return;
    }

    this.deleteMessageCallback = () => {
      this.chatStateService.deleteMessage(this.itineraryId, messageId);
    };

    this.confirmationModal.show({
      title: 'Delete Message',
      message: 'Are you sure you want to delete this message? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isDangerous: true
    });
  }

  /**
   * Handle confirmation modal confirmed
   */
  onConfirmationConfirmed(): void {
    if (this.deleteMessageCallback) {
      this.deleteMessageCallback();
      this.deleteMessageCallback = null;
    }
  }

  /**
   * Handle confirmation modal cancelled
   */
  onConfirmationCancelled(): void {
    this.deleteMessageCallback = null;
  }

  /**
   * Handle loading more messages (infinite scroll)
   */
  onLoadMore(): void {
    this.chatStateService.loadMoreMessages(this.itineraryId);
  }

  /**
   * Handle typing indicator
   */
  onUserTyping(): void {
    this.webSocketService.sendTypingIndicator(this.currentUserName);
  }

  /**
   * Handle scroll to bottom
   */
  onScrollToBottom(): void {
    this.showScrollButton = false;
  }

  /**
   * Show scroll button when user scrolls up
   */
  onUserScrolledUp(): void {
    this.showScrollButton = true;
  }

  /**
   * Handle message selection
   */
  onMessageSelect(messageId: string): void {
    this.chatStateService.selectMessage(messageId);
  }

  /**
   * Retry connection
   */
  retryConnection(): void {
    this.webSocketService
      .connect(this.itineraryId, this.currentUserId)
      .catch(error => {
        console.error('Retry connection failed:', error);
      });
  }

  /**
   * Clear error message
   */
  clearError(): void {
    this.chatStateService.clearError();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.chatStateService.resetState();
    this.webSocketService.disconnect();
  }
}
