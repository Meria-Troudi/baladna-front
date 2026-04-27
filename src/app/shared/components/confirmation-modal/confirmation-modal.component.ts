import { Component, EventEmitter, Output } from '@angular/core';

export interface ConfirmationOptions {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
}

@Component({
  selector: 'app-confirmation-modal',
  templateUrl: './confirmation-modal.component.html',
  styleUrls: ['./confirmation-modal.component.css']
})
export class ConfirmationModalComponent {
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  isVisible = false;
  title = 'Confirm Action';
  message = 'Are you sure?';
  confirmText = 'Confirm';
  cancelText = 'Cancel';
  isDangerous = false;

  show(options: ConfirmationOptions = {}): void {
    if (options.title) this.title = options.title;
    if (options.message) this.message = options.message;
    if (options.confirmText) this.confirmText = options.confirmText;
    if (options.cancelText) this.cancelText = options.cancelText;
    if (options.isDangerous !== undefined) this.isDangerous = options.isDangerous;
    
    this.isVisible = true;
  }

  onConfirm(): void {
    this.confirmed.emit();
    this.hide();
  }

  onCancel(): void {
    this.cancelled.emit();
    this.hide();
  }

  hide(): void {
    this.isVisible = false;
  }

  onBackdropClick(): void {
    this.onCancel();
  }
}
