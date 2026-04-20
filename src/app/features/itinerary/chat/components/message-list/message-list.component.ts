import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  OnChanges,
  SimpleChanges,
  SimpleChange,
  AfterViewChecked
} from '@angular/core';
import { ChatMessageState } from '../../models/chat.model';

interface MessageAction {
  messageId: string;
  content?: string;
}

/**
 * Message List Component
 * Displays paginated chat messages with support for infinite scroll
 * Uses change detection strategy OnPush for performance
 */
@Component({
  selector: 'app-message-list',
  templateUrl: './message-list.component.html',
  styleUrls: ['./message-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MessageListComponent implements OnChanges, AfterViewChecked {
  @Input() messages: ChatMessageState[] | null = [];
  @Input() currentUserId: number = 0;
  @Input() typingUsers: Set<number> | null = new Set();

  @Output() messageEdit = new EventEmitter<MessageAction>();
  @Output() messageDelete = new EventEmitter<string>();
  @Output() messageSelect = new EventEmitter<string>();
  @Output() userScrolledUp = new EventEmitter<void>();
  @Output() scrolledToBottom = new EventEmitter<void>();

  @ViewChild('messagesList', { static: false }) messagesList: ElementRef | null = null;

  editingMessageId: string | null = null;
  editingContent: string = '';
  private shouldScroll = true;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['messages'] && this.shouldScroll) {
      this.scrollToBottom();
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  /**
   * Check if message is from current user
   */
  isOwnMessage(message: ChatMessageState): boolean {
    return message.senderId === this.currentUserId;
  }

  /**
   * Start editing a message
   */
  startEdit(message: ChatMessageState): void {
    if (this.isOwnMessage(message) && !message.isDeleted) {
      this.editingMessageId = message.id;
      this.editingContent = message.content;
    }
  }

  /**
   * Cancel editing
   */
  cancelEdit(): void {
    this.editingMessageId = null;
    this.editingContent = '';
  }

  /**
   * Save edited message
   */
  saveEdit(messageId: string): void {
    if (this.editingContent.trim()) {
      this.messageEdit.emit({
        messageId,
        content: this.editingContent.trim()
      });
      this.editingMessageId = null;
      this.editingContent = '';
    }
  }

  /**
   * Handle delete message
   */
  onDeleteMessage(messageId: string): void {
    this.messageDelete.emit(messageId);
  }

  /**
   * Handle message selection
   */
  onSelectMessage(messageId: string): void {
    this.messageSelect.emit(messageId);
  }

  /**
   * Handle scroll events
   */
  onScroll(event: Event): void {
    const element = event.target as HTMLElement;

    // Check if scrolled near top
    if (element.scrollTop < 100) {
      this.userScrolledUp.emit();
    }

    // Check if scrolled to bottom
    const isAtBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight < 50;

    if (isAtBottom) {
      this.scrolledToBottom.emit();
      this.shouldScroll = true;
    } else {
      this.shouldScroll = false;
    }
  }

  /**
   * Scroll to bottom of message list
   */
  private scrollToBottom(): void {
    if (this.messagesList) {
      setTimeout(() => {
        const element = this.messagesList!.nativeElement;
        element.scrollTop = element.scrollHeight;
      }, 0);
    }
  }

  /**
   * Format timestamp for display
   */
  formatTime(dateString: string): string {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diff = now.getTime() - date.getTime();

      // Less than a minute
      if (diff < 60000) {
        return 'just now';
      }

      // Less than an hour
      if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
      }

      // Less than a day
      if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
      }

      // Full date
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'unknown time';
    }
  }

  /**
   * Get initials from sender name
   */
  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  /**
   * Generate avatar color based on sender ID
   */
  getAvatarColor(senderId: number): string {
    const colors = [
      '#FF6B6B',
      '#4ECDC4',
      '#45B7D1',
      '#FFA07A',
      '#98D8C8',
      '#F7DC6F',
      '#BB8FCE',
      '#85C1E2'
    ];
    return colors[senderId % colors.length];
  }

  /**
   * Track by function for ngFor optimization
   */
  trackByMessageId(index: number, message: ChatMessageState): string {
    return message.id;
  }
}
