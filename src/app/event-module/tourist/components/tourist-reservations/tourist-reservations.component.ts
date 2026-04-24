import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReservationService, Reservation } from '../../../services/reservation.service';
import { BookingFacadeService } from '../../../services/booking-facade.service';

@Component({
  selector: 'app-tourist-reservations',
  templateUrl: './tourist-reservations.component.html',
  styleUrls: ['./tourist-reservations.component.css']
})
export class TouristReservationsComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  reservations: Reservation[] = [];
  loading = true;
  error = '';

  // Edit modal state
  showEditModal = false;
  editingReservation: Reservation | null = null;

  // QR popup modal state
  showQRModal = false;
  selectedReservation: Reservation | null = null;

  constructor(
    private reservationService: ReservationService,
    public router: Router,
    public bookingFacade: BookingFacadeService
  ) {}

  goToEventsList(): void {
    this.router.navigate(['/tourist/events/list']);
  }

  ngOnInit(): void {
    this.loadReservations();
  }

  loadReservations(): void {
    this.loading = true;
    this.error = '';
    this.reservationService.getMyReservations().subscribe({
      next: (reservations) => {
        this.reservations = reservations;
        this.loading = false;
        console.log('Loaded reservations:', reservations);
      },
      error: (err) => {
        this.error = 'Failed to load reservations. Please try again.';
        this.loading = false;
        console.error('Error loading reservations:', err);
      }
    });
  }

  cancelReservation(reservationId: number): void {
    if (confirm('Are you sure you want to cancel this reservation?')) {
      this.reservationService.cancel(reservationId).subscribe({
        next: () => {
          const reservation = this.reservations.find((r) => r.id === reservationId);
          if (reservation) {
            reservation.status = 'CANCELLED';
          }
        },
        error: (err) => {
          console.error('Error cancelling reservation:', err);
          alert('Failed to cancel reservation. Please try again.');
        }
      });
    }
  }

  viewEventDetails(eventId: number | undefined | null): void {
    if (eventId) {
      this.router.navigate(['/tourist/events', eventId]);
    } else {
      console.warn('Cannot navigate: event ID is null or undefined');
    }
  }

  showQRPopup(reservation: Reservation): void {
    this.selectedReservation = reservation;
    this.showQRModal = true;
  }

  closeQRModal(): void {
    this.showQRModal = false;
    this.selectedReservation = null;
  }

  goBack(): void {
    this.close.emit();
  }

  openEditModal(reservation: Reservation): void {
    // If reservation is pending payment, open modal directly to payment step
    if (reservation.paymentStatus === 'PENDING') {
      this.editingReservation = reservation;
      this.showEditModal = true;
      // Optionally, emit an event or set a flag to force payment step in the modal
      return;
    }
    // Otherwise, fetch full reservation with event data for editing
    this.reservationService.getReservationWithEvent(reservation.id).subscribe({
      next: (fullReservation) => {
        this.editingReservation = fullReservation;
        this.showEditModal = true;
      },
      error: (err) => {
        alert('Failed to load reservation details. Please try again.');
      }
    });
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editingReservation = null;
  }

  onReservationUpdated(updatedReservation: Reservation): void {
    const index = this.reservations.findIndex((r) => r.id === updatedReservation.id);
    if (index !== -1) {
      this.reservations[index] = updatedReservation;
    }
    this.closeEditModal();
  }

  getStatusBadgeClass(reservation: Reservation): string {
    const state = this.bookingFacade.getActionState(reservation.event?.id);
    switch (state) {
      case 'CONFIRMED':
        return 'status-badge confirmed';
      case 'WAITLISTED':
        return 'status-badge waitlisted';
      case 'CANCELLED':
        return 'status-badge cancelled';
      default:
        return 'status-badge';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}