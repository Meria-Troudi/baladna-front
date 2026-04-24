import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EventService } from '../../../services/event.service';
import { EventStatus } from '../../../models/event.model';
import { Event } from '../../../models/event.model';
import type { EventAnalytics } from '../../../models/event-analytics.model';
interface AdminEvent extends Event {
  selected?: boolean;
}

interface Flag {
  id: number;
  type: string;
  count: number;
  severity: 'low' | 'medium' | 'high';
  description: string;
  createdAt: string;
}

interface Review {
  id: number;
  userId: number;
  userName: string;
  rating: number;
  comment: string;
  flagged: boolean;
  createdAt: string;
}

interface Report {
  id: number;
  type: string;
  description: string;
  createdAt: string;
  userId: number;
  userName: string;
}

interface QuickStats {
  averageRating: number;
  totalReviews: number;
  totalComments: number;
  flaggedContent: number;
  recentReports: number;
}

@Component({
  selector: 'app-admin-event-detail',
  templateUrl: './admin-event-detail.component.html',
  styleUrls: ['./admin-event-detail.component.css']
})
export class AdminEventDetailComponent implements OnInit {
  event: AdminEvent | null = null;
  loading: boolean = false;
  error: string = '';
  
  // Moderation data from backend
  flags: Flag[] = [];
  reviews: Review[] = [];
  quickStats: QuickStats | null = null;
  recentReports: Report[] = [];
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventService: EventService
  ) {}

  ngOnInit(): void {
    const eventId = this.route.snapshot.paramMap.get('id');
    if (eventId) {
      this.loadEventDetails(eventId);
    } else {
      this.error = 'Event ID not found';
    }
  }

  loadEventDetails(id: string) {
    this.loading = true;
    this.error = '';
    
    // Load main event details
    this.eventService.getEventById(id).subscribe({
      next: (event: Event) => {
        this.event = { ...event, selected: false };
        this.loadModerationData(id);
        this.loading = false;
      },
      error: (err: any) => {
        this.error = 'Failed to load event details';
        this.loading = false;
      }
    });
  }

  loadModerationData(eventId: string) {
    // Load all moderation data from backend
    this.loadEventFlags(eventId);
    this.loadEventReviews(eventId);
    this.loadEventStats(eventId);
    this.loadRecentReports(eventId);
  }

  loadEventFlags(eventId: string) {
    // TODO: Replace with actual backend service call
    // this.moderationService.getEventFlags(eventId).subscribe(...)
    
    // Initialize empty - will be populated by backend
    this.flags = [];
  }

  loadEventReviews(eventId: string) {
    // TODO: Replace with actual backend service call
    // this.reviewService.getEventReviews(eventId).subscribe(...)
    
    // Initialize empty - will be populated by backend
    this.reviews = [];
  }

  loadEventStats(eventId: string) {
    // TODO: Replace with actual backend service call
    // this.analyticsService.getEventStats(eventId).subscribe(...)
    
    // Initialize null - will be populated by backend
    this.quickStats = null;
  }

  loadRecentReports(eventId: string) {
    // TODO: Replace with actual backend service call
    // this.reportService.getRecentReports(eventId).subscribe(...)
    
    // Initialize empty - will be populated by backend
    this.recentReports = [];
  }

  goBack() {
    this.router.navigate(['/admin/events']);
  }

  updateEventStatus(status: EventStatus) {
    if (this.event && confirm(`Are you sure you want to change the event status to ${status}?`)) {
      this.event.status = status;
      // TODO: Call service to update status
      console.log('Event status updated to:', status);
    }
  }

  deleteEvent() {
    if (this.event && confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      this.eventService.deleteEvent(this.event.id.toString()).subscribe({
        next: () => {
          this.router.navigate(['/admin/events']);
        },
        error: () => {
          this.error = 'Failed to delete event';
        }
      });
    }
  }

  suspendEvent() {
    if (this.event && confirm('Are you sure you want to suspend this event?')) {
      this.updateEventStatus(EventStatus.CANCELED);
    }
  }

  hideFlaggedContent() {
    // TODO: Implement hide flagged content functionality
    console.log('Hiding flagged content...');
  }

  formatFlagType(type: string): string {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
}
