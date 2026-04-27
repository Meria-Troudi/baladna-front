import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef } from '@angular/core';
import { Event } from '../../models/event.model';
import { BookingFacadeService, ReservationActionState } from '../../services/booking-facade.service';

@Component({
  selector: 'app-event-card',
  templateUrl: './event-card.component.html',
  styleUrls: ['./event-card.component.css']
})
export class EventCardComponent implements OnInit {
  getReservation(eventId: number) {
    return this.bookingFacade.getReservationForEvent(eventId);
  }
  @Input() events: Event[] = [];
  @Input() mode: 'tourist' | 'host' = 'tourist';
  @Input() viewMode: 'grid' | 'list' = 'grid';
  @Output() viewDetails = new EventEmitter<Event>();
  @Output() editEvent = new EventEmitter<Event>();
  @Output() deleteEvent = new EventEmitter<Event>();
  @Output() bookEvent = new EventEmitter<Event>();
  @Output() viewAnalytics = new EventEmitter<Event>();

  constructor(
    public bookingFacade: BookingFacadeService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.bookingFacade.loadMyReservations();
    this.bookingFacade.getReservations$().subscribe(() => {
      this.cdr.markForCheck();
    });
  }

  getActionState(eventId: number): ReservationActionState {
    return this.bookingFacade.getActionState(eventId);
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

  onViewAnalytics(event: Event): void {
    this.viewAnalytics.emit(event);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'UPCOMING': return '#2196F3';
      case 'FINISHED': return '#4CAF50';
      case 'CANCELED': return '#F44336';
      case 'ONGOING': return '#FF9800';
      case 'FULL': return '#9C27B0';
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
