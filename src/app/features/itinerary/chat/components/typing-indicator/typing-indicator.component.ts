import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

/**
 * Typing Indicator Component
 * Displays animated typing indicator when other users are composing messages
 */
@Component({
  selector: 'app-typing-indicator',
  templateUrl: './typing-indicator.component.html',
  styleUrls: ['./typing-indicator.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TypingIndicatorComponent {
  @Input() typingUserCount: number = 0;

  /**
   * Get typing status message
   */
  getTypingMessage(): string {
    if (this.typingUserCount === 0) {
      return '';
    }

    if (this.typingUserCount === 1) {
      return 'Someone is typing...';
    }

    return `${this.typingUserCount} users are typing...`;
  }
}
