import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Event } from '../../../models/event.model';

@Component({
  selector: 'app-event-detail-modal',
  templateUrl: './event-detail-modal.component.html',
  styleUrl: './event-detail-modal.component.css'
})
export class EventDetailModalComponent {
  @Input() event!: Event;
  @Output() close = new EventEmitter<void>();

  onClose() {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }
}
