import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Event, EventStatus } from '../../../models/event.model';

export interface LiveEvent extends Event {
  eventId: number;
  coverImage: string;
  startAt: string;
  location: string;
  price: number;
  status: EventStatus;
  // LiveEvent specific
  type: 'Upcoming Event' | 'Last Reservation';
  distance?: string;
  progress?: number;
}

@Component({
  selector: 'app-live-status-card',
  templateUrl: './live-status-card.component.html',
  styleUrls: ['./live-status-card.component.css']
})
export class LiveStatusCardComponent implements OnInit {
  @Input() events: LiveEvent[] = [];
  
  viewMode: 'upcoming' | 'last' = 'upcoming';

  // Detail view state (same pattern as events-list)
  selectedEvent: LiveEvent | null = null;

  constructor(private router: Router) {}

  ngOnInit() {
    this.calculateAllProgress();
  }

  get filteredEvents(): LiveEvent[] {
    if (this.viewMode === 'upcoming') {
      return this.events.filter(e => e.type === 'Upcoming Event').slice(0, 3);
    } else {
      return this.events.filter(e => e.type === 'Last Reservation').slice(0, 3);
    }
  }

  calculateAllProgress() {
    this.events.forEach(event => {
      const now = new Date();
      const eventDate = new Date(event.startAt);
      const diffMs = eventDate.getTime() - now.getTime();
      
      if (diffMs <= 0) {
        event.progress = 100;
      } else {
        const diffDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        event.progress = Math.max(0, Math.min(100, 100 - (diffDays / 30 * 100)));
      }
    });
  }

  setViewMode(mode: 'upcoming' | 'last') {
    this.viewMode = mode;
  }

  formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  }

  getCircumference(progress: number | undefined): number {
    return (progress || 0) * 0.94;
  }

  formatEventId(eventId: number): string {
    return `#BLD-${String(eventId).padStart(3, '0')}`;
  }

  // View event details - navigates to dedicated event details page
  viewEvent(event: LiveEvent): void {
    this.router.navigate(['/tourist/events', event.eventId]);
  }

  // Close detail view and return to live status cards
  closeDetailView(): void {
    this.selectedEvent = null;
  }

  // Navigate to reservations list
  viewReservations(): void {
    this.router.navigate(['/tourist/reservations']);
  }
}