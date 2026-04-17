import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Event } from '../../../models/event.model';
import { Reservation, ReservationService } from '../../../services/reservation.service';

@Component({
  selector: 'app-event-actions',
  templateUrl: './event-actions.component.html',
  styleUrls: ['./event-actions.component.css']
})
export class EventActionsComponent implements OnInit {
  @Input() event: Event | null = null;
  @Input() userType: 'tourist' | 'host' = 'tourist';
@Input() userId: number = 1; // TODO: Replace with auth
  @Input() remainingSeats: number = 0;
  @Output() reserve = new EventEmitter<void>();
  @Output() seeReservations = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  // Reservation state
  showModal = false;
  userReservation: Reservation | null = null;
  loading = false;

  // Host stats
  hostStats = {
    confirmed: 0,
    waitlisted: 0,
    cancelled: 0
  };

  constructor(private router: Router, private reservationService: ReservationService) {}

  ngOnInit(): void {
    if (this.userType === 'tourist' && this.event?.id) {
this.reservationService.getEligibility(Number(this.event.id)).subscribe({
        next: (eligibility) => {
this.userId = eligibility.userId || 0; // Ensure a valid fallback value
          this.loadUserReservation();
        },
        error: (err) => {
          console.error('Error fetching eligibility:', err);
        }
      });
    } else if (this.userType === 'host' && this.event?.id) {
      this.loadHostStats();
    }
  }

  loadHostStats(): void {
    this.reservationService.getEventReservations(String(this.event!.id)).subscribe({
      next: (reservations) => {
        this.hostStats.confirmed = reservations.filter(r => r.status === 'CONFIRMED').length;
        this.hostStats.waitlisted = reservations.filter(r => r.status === 'WAITLISTED').length;
        this.hostStats.cancelled = reservations.filter(r => r.status === 'CANCELLED').length;
      },
      error: (err) => {
        console.error('Error loading host stats:', err);
        // Reset stats to 0 on error so it doesn't show stale data
        this.hostStats.confirmed = 0;
        this.hostStats.waitlisted = 0;
        this.hostStats.cancelled = 0;
      }
    });
  }

  loadUserReservation(): void {
    this.loading = true;
this.reservationService.getMyReservations().subscribe({
      next: (reservations) => {
        this.userReservation = reservations.find(r => r.event?.id === this.event?.id) || null;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading reservation:', err);
        // On error, set userReservation to null so the reserve button shows
        this.userReservation = null;
        this.loading = false;
      }
    });
  }

  openReservationModal(): void {
    this.showModal = true;
  }

  closeReservationModal(): void {
    this.showModal = false;
  }

  onReservationComplete(reservation: Reservation): void {
    this.userReservation = reservation;
    this.showModal = false;
    // Emit event to parent to refresh event data
    this.reserve.emit();
  }

  cancelReservation(): void {
    if (this.userReservation?.id) {
      this.reservationService.cancel(this.userReservation.id).subscribe({
        next: () => {
          // Update status to CANCELLED instead of removing
          if (this.userReservation) {
            this.userReservation.status = 'CANCELLED';
          }
          // Refresh event data
          this.reserve.emit();
        },
        error: (err) => {
          console.error('Error cancelling reservation:', err);
        }
      });
    }
  }

  isEventPast(): boolean {
    if (!this.event?.startAt) return false;
    const eventDate = new Date(this.event.startAt);
    const now = new Date();
    return eventDate < now;
  }

  isFull(): boolean {
    return this.remainingSeats <= 0;
  }

  onSeeReservations(): void {
    this.seeReservations.emit();
  }

  onEdit(): void {
    if (this.event?.id) {
      this.router.navigate(['/host/events/edit', this.event.id]);
    }
  }

  onClose(): void {
    this.close.emit();
  }
}