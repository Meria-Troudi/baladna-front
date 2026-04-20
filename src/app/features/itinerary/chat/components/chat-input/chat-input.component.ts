import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  OnInit
} from '@angular/core';

/**
 * Chat Input Component
 * Handles message composition and sending
 * Features: auto-grow textarea, keyboard shortcuts, character counter
 */
@Component({
  selector: 'app-chat-input',
  templateUrl: './chat-input.component.html',
  styleUrls: ['./chat-input.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatInputComponent implements OnInit {
  @Input() isConnected: boolean = false;

  @Output() messageSend = new EventEmitter<string>();
  @Output() userTyping = new EventEmitter<void>();

  @ViewChild('textarea', { static: false }) textarea: ElementRef<HTMLTextAreaElement> | null = null;

  messageText: string = '';
  isSending: boolean = false;
  private typingTimeoutId: any = null;

  constructor() {}

  ngOnInit(): void {
    // Initialize textarea if needed
  }

  /**
   * Handle input text change
   */
  onTextChange(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.messageText = target.value;

    // Auto-grow textarea
    this.adjustTextareaHeight();

    // Emit typing indicator (debounced)
    if (!this.typingTimeoutId) {
      this.userTyping.emit();
    }

    // Debounce typing indicator
    clearTimeout(this.typingTimeoutId);
    this.typingTimeoutId = setTimeout(() => {
      this.typingTimeoutId = null;
    }, 1000);
  }

  /**
   * Auto-grow textarea height based on content
   */
  private adjustTextareaHeight(): void {
    if (!this.textarea) {
      return;
    }

    const element = this.textarea.nativeElement;

    // Reset height to auto to get the correct scrollHeight
    element.style.height = 'auto';

    // Set height to scrollHeight (max 150px)
    const newHeight = Math.min(element.scrollHeight, 150);
    element.style.height = `${newHeight}px`;
  }

  /**
   * Handle textarea keydown events
   * - Enter to send (Shift+Enter for new line)
   * - Escape to clear
   */
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      if (event.shiftKey) {
        // Allow new line with Shift+Enter
        return;
      }

      // Send message with Enter key
      event.preventDefault();
      this.sendMessage();
    } else if (event.key === 'Escape') {
      // Clear message with Escape
      this.messageText = '';
      this.adjustTextareaHeight();
    }
  }

  /**
   * Send the message
   */
  sendMessage(): void {
    if (!this.messageText.trim() || !this.isConnected) {
      return;
    }

    this.isSending = true;

    // Emit message
    this.messageSend.emit(this.messageText);

    // Clear input
    this.messageText = '';
    this.adjustTextareaHeight();
    this.isSending = false;

    // Focus back on textarea
    if (this.textarea) {
      setTimeout(() => this.textarea?.nativeElement.focus(), 0);
    }
  }

  /**
   * Get character count
   */
  getCharacterCount(): number {
    return this.messageText.length;
  }

  /**
   * Get send button disabled state
   */
  isSendDisabled(): boolean {
    return !this.messageText.trim() || !this.isConnected || this.isSending;
  }

  /**
   * Get connection status message
   */
  getConnectionStatus(): string {
    return this.isConnected ? 'Connected' : 'Connecting...';
  }
}
