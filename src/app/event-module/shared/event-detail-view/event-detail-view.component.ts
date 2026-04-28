import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Event } from '../../models/event.model';
import { Reservation, ReservationService } from '../../services/reservation.service';
import { EventHeaderComponent } from './event-header/event-header.component';
import { ModalComponent } from '../modal/modal.component';
import { EventActionsComponent } from './event-actions/event-actions.component';
import { EventInfoComponent } from './event-info/event-info.component';
import { EventReviewsPreviewComponent } from '../event-reviews-preview/event-reviews-preview.component';

@Component({
  selector: 'app-event-detail-view',
  templateUrl: './event-detail-view.component.html',
  styleUrls: ['./event-detail-view.component.css']
})
export class EventDetailViewComponent implements OnInit, OnDestroy {

  getEventStatus(): string {
    if (!this.event?.startAt) return 'No Date';
    const eventDate = new Date(this.event.startAt);
    const now = new Date();
    
    if (eventDate < now) return 'Event Ended';
    if (eventDate.toDateString() === now.toDateString()) return 'Today';
    if (eventDate.getTime() - now.getTime() < 24 * 60 * 60 * 1000) return 'Tomorrow';
    
    const daysUntil = Math.ceil((eventDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    return `In ${daysUntil} days`;
  }
  get userId(): number | null {
    // TODO: Replace with actual user service/session logic
    // Example: return this.authService.currentUser?.id || null;
    return null;
  }
  @Input() event: Event | null = null;
  @Input() userType: 'tourist' | 'host' = 'tourist';
  @Input() returnRoute: string = '/tourist/events';
  @Output() close = new EventEmitter<void>();

  showModal = false;
  showTouristReservationsModal = false;
  showRouteModal = false;

  get eventLat(): number | null {
    return this.event?.latitude ?? null;
  }
  get eventLng(): number | null {
    return this.event?.longitude ?? null;
  }

  openRouteMap(): void {
    this.showRouteModal = true;
  }

  countdown = { days: '00', hrs: '00', min: '00', sec: '00' };
  remainingSeats: number = 0;
  private intervalId!: any;

  userReservation: Reservation | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reservationService: ReservationService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    // Get event ID from route if not provided as input
    if (!this.event) {
      const eventId = this.route.snapshot.paramMap.get('id');
      if (eventId) {
        this.http.get<any>(`http://localhost:8081/api/events/event/get/${eventId}`).subscribe({
          next: (event) => {
            this.event = event;
            // After loading event, fetch reservations and start countdown
            this.fetchReservationsAndCountdown();
          },
          error: () => {
            this.event = null;
          }
        });
        return;
      }
    }
    this.fetchReservationsAndCountdown();
  }

  private fetchReservationsAndCountdown() {
    // Fetch user reservation for this event
    if (this.event?.id) {
      this.reservationService.getMyReservations().subscribe({
        next: (reservations) => {
          this.userReservation = reservations.find(r => r.event?.id === this.event?.id) || null;
        },
        error: () => {
          this.userReservation = null;
        }
      });
    }
    // Only start countdown if we have an event with startAt
    if (this.event?.startAt) {
      this.startCountdown();
    }
    // Calculate remaining seats
    this.calculateRemainingSeats();
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalId);
  }

  private startCountdown(): void {
    this.updateCountdown();
    this.intervalId = setInterval(() => this.updateCountdown(), 1000);
  }

  private updateCountdown(): void {
    if (!this.event?.startAt) {
      this.countdown = { days: '00', hrs: '00', min: '00', sec: '00' };
      return;
    }

    const target = new Date(this.event.startAt);
    const diff = target.getTime() - Date.now();

    if (diff <= 0) {
      this.countdown = { days: '00', hrs: '00', min: '00', sec: '00' };
      return;
    }

    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    this.countdown = {
      days: this.pad(d),
      hrs: this.pad(h),
      min: this.pad(m),
      sec: this.pad(s)
    };
  }

  private pad(n: number): string {
    return String(n).padStart(2, '0');
  }

  private calculateRemainingSeats(): void {
    if (this.event) {
      this.remainingSeats = (this.event.capacity || 0) - (this.event.bookedSeats || 0);
    }
  }

  onClose(): void {
    this.close.emit();
  }

  onReturn(): void {
    // When used as inline component with close emitter, just close it
    if (this.close.observers.length > 0) {
      this.close.emit();
      return;
    }
    
    // Navigate based on user type or custom return route when used as standalone page
    if (this.userType === 'host') {
      this.router.navigate(['/host/my-events']);
    } else {
      this.router.navigate([this.returnRoute]);
    }
  }

  onSeeReservations(): void {
    // Open modal for both host and tourist
    if (this.userType === 'host') {
      this.showModal = true;
    } else {
      this.showTouristReservationsModal = true;
    }
  }

  closeTouristReservationsModal(): void {
    this.showTouristReservationsModal = false;
  }

  onReserve(): void {
    console.log('Reserve button clicked for event:', this.event?.id);
    // TODO: Open reservation modal
  }

  onEdit(): void {
    // Navigate to edit page for this event
    if (this.event?.id) {
      if (this.userType === 'host') {
        this.router.navigate(['/host/events', this.event.id, 'edit']);
      } else {
        // Tourists shouldn't normally edit, but redirect to host edit if needed
        this.router.navigate(['/host/events', this.event.id, 'edit']);
      }
    } else {
      console.log('Edit event clicked but no event ID');
    }
  }
}
