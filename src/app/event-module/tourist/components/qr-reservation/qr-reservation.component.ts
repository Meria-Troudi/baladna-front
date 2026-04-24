import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReservationService, Reservation } from '../../../services/reservation.service';

@Component({
  selector: 'app-qr-reservation',
  templateUrl: './qr-reservation.component.html',
  styleUrl: './qr-reservation.component.css'
})
export class QrReservationComponent implements OnInit {
  reservation: Reservation | null = null;
  loading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reservationService: ReservationService
  ) {}

  ngOnInit(): void {
    const reservationId = this.route.snapshot.paramMap.get('id');
    if (reservationId) {
      this.loadReservation(+reservationId);
    } else {
      this.error = 'No reservation ID provided';
      this.loading = false;
    }
  }

  loadReservation(reservationId: number): void {
    this.reservationService.getReservationWithEvent(reservationId).subscribe({
      next: (reservation) => {
        this.reservation = reservation;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load reservation details';
        this.loading = false;
        console.error('Error loading reservation:', err);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/tourist/reservations']);
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

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'CONFIRMED': return 'status-badge confirmed';
      case 'WAITLISTED': return 'status-badge waitlisted';
      case 'CANCELLED': return 'status-badge cancelled';
      default: return 'status-badge';
    }
  }
}