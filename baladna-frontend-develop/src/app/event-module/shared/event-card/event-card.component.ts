import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Event } from '../../models/event.model';

@Component({
  selector: 'app-event-card',
  templateUrl: './event-card.component.html',
  styleUrls: ['./event-card.component.css']
})

export class EventCardComponent {
  @Input() events: Event[] = [];
  @Input() mode: 'tourist' | 'host' = 'tourist';
  @Input() viewMode: 'grid' | 'list' = 'grid';
  @Input() reservedEventIds: (string | number)[] = [];
  @Output() viewDetails = new EventEmitter<Event>();
  @Output() editEvent = new EventEmitter<Event>();
  @Output() deleteEvent = new EventEmitter<Event>();
  @Output() bookEvent = new EventEmitter<Event>();

  constructor() {}

  isEventReserved(eventId: string | number): boolean {
    return this.reservedEventIds.some(id => id === eventId);
  }

  getBookButtonText(event: Event): string {
    if (this.isEventReserved(event.id)) {
      return 'Reserved';
    }
    return 'Book Now';
  }

  onViewDetails(event: Event): void {
    this.viewDetails.emit(event);
  }

  onEditEvent(event: Event): void {
    this.editEvent.emit(event);
  }

  onDeleteEvent(event: Event): void {
    this.deleteEvent.emit(event);
  }

  onBookEvent(event: Event): void {
    this.bookEvent.emit(event);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'SCHEDULED': return '#2196F3';
      case 'COMPLETED': return '#4CAF50';
      case 'CANCELLED': return '#F44336';
      case 'ONGOING': return '#FF9800';
      default: return '#666';
    }
  }

  getEventRating(event: Event): number {
    return (event as any).avgRating || 0;
  }

  getEventThumbnail(event: Event): string {
    // First, try to get the cover image from media array
    if (event.media && event.media.length > 0) {
      const coverMedia = event.media.find(m => m.isCover);
      if (coverMedia) {
        return coverMedia.url;
      }
      // If no cover is set, use the first image media
      const firstImage = event.media.find(m => m.type === 'IMAGE');
      if (firstImage) {
        return firstImage.url;
      }
      // If there's media but no images, use the first media item
      if (event.media.length > 0) {
        return event.media[0].url;
      }
    }
    
    // Fallback to imageUrl if available
    if (event.imageUrl) {
      return event.imageUrl;
    }
    
    // No image available - return empty string to show placeholder
    return '';
  }
}
