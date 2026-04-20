import { Component, OnDestroy, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';

import { Reservation } from '../../models/reservation.model';
import { TransportService } from '../../services/transport.service';
import { TransportTicketService } from '../../../../shared/services/transport-ticket.service';
import { getCompactLocationText, getCompactRouteText } from '../../../../shared/utils/location-display.util';

@Component({
  selector: 'app-tourist-bookings',
  templateUrl: './tourist-bookings.component.html',
  styleUrls: ['./tourist-bookings.component.css']
})
export class TouristBookingsComponent implements OnInit, OnDestroy {
  myReservations: Reservation[] = [];
  loading = false;
  ticketLoading = false;
  cancellingId: number | null = null;
  errorMessage = '';
  selectedReservation: Reservation | null = null;
  selectedTicketQrCode = '';

  private pollingInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private transportService: TransportService,
    private transportTicketService: TransportTicketService
  ) {}

  ngOnInit(): void {
    this.loadReservations();
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      PENDING_APPROVAL: 'Pending approval',
      CONFIRMED: 'Confirmed',
      BOARDED: 'Boarded',
      CANCELLED: 'Cancelled',
      REJECTED: 'Rejected'
    };

    return labels[status] || status;
  }

  get pendingCount(): number {
    return this.myReservations.filter((reservation) => reservation.status === 'PENDING_APPROVAL').length;
  }

  get activeReservationsCount(): number {
    return this.myReservations.filter((reservation) =>
      reservation.status === 'CONFIRMED' || reservation.status === 'BOARDED'
    ).length;
  }

  get cancelledReservationsCount(): number {
    return this.myReservations.filter((reservation) =>
      reservation.status === 'CANCELLED' || reservation.status === 'REJECTED'
    ).length;
  }

  get reservedSeatsCount(): number {
    return this.myReservations
      .filter((reservation) =>
        reservation.status === 'CONFIRMED' || reservation.status === 'PENDING_APPROVAL'
      )
      .reduce((total, reservation) => total + reservation.reservedSeats, 0);
  }

  canCancel(reservation: Reservation): boolean {
    return reservation.status === 'PENDING_APPROVAL' || reservation.status === 'CONFIRMED';
  }

  canViewTicket(reservation: Reservation): boolean {
    return reservation.status === 'CONFIRMED' || reservation.status === 'BOARDED';
  }

  loadReservations(): void {
    this.loading = true;
    this.errorMessage = '';

    this.transportService.getMyReservations()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (reservations) => {
          this.myReservations = [...reservations].sort((first, second) =>
            new Date(second.reservationDate).getTime() - new Date(first.reservationDate).getTime()
          );

          if (this.pendingCount === 0) {
            this.stopPolling();
          }
        },
        error: (error) => {
          this.errorMessage = this.extractErrorMessage(error, 'Unable to load your bookings.');
        }
      });
  }

  cancelReservation(reservation: Reservation): void {
    if (!this.canCancel(reservation)) {
      return;
    }

    this.cancellingId = reservation.id;
    this.errorMessage = '';

    this.transportService.cancelReservation(reservation.id)
      .pipe(finalize(() => this.cancellingId = null))
      .subscribe({
        next: () => this.loadReservations(),
        error: (error) => {
          this.errorMessage = this.extractErrorMessage(error, 'Unable to cancel the reservation.');
        }
      });
  }

  async openTicketPreview(reservation: Reservation): Promise<void> {
    if (!this.canViewTicket(reservation)) {
      return;
    }

    this.selectedReservation = reservation;
    this.ticketLoading = true;
    this.errorMessage = '';

    try {
      this.selectedTicketQrCode = await this.transportTicketService.getTicketQrCodeDataUrl(reservation);
    } catch (error) {
      this.selectedTicketQrCode = '';
      this.errorMessage = this.extractErrorMessage(error, 'Unable to generate the ticket QR code.');
    } finally {
      this.ticketLoading = false;
    }
  }

  closeTicketPreview(): void {
    this.selectedReservation = null;
    this.selectedTicketQrCode = '';
    this.ticketLoading = false;
  }

  async downloadTicketPdf(reservation: Reservation): Promise<void> {
    if (!this.canViewTicket(reservation)) {
      return;
    }

    this.errorMessage = '';

    try {
      await this.transportTicketService.openTicketPdf(reservation, 'Tourist copy');
    } catch (error) {
      this.errorMessage = this.extractErrorMessage(error, 'Unable to prepare the ticket PDF.');
    }
  }

  getReservationRoute(reservation: Reservation): string {
    return getCompactRouteText(reservation.transportRoute) || 'Transport reservation';
  }

  getReservationDeparture(reservation: Reservation): string {
    return getCompactLocationText(
      reservation.transportDeparturePoint || reservation.boardingPoint
    ) || reservation.boardingPoint || 'N/A';
  }

  getReservationTicketCode(reservation: Reservation): string {
    return this.transportTicketService.getTicketCode(reservation);
  }

  private startPolling(): void {
    this.pollingInterval = setInterval(() => {
      if (this.pendingCount > 0) {
        this.loadReservations();
      }
    }, 30000);
  }

  private stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  private extractErrorMessage(error: any, fallback: string): string {
    if (!error) return fallback;
    if (typeof error.error === 'string' && error.error.trim()) return error.error;
    if (error.error?.message) return error.error.message;
    if (error.message) return error.message;
    return fallback;
  }
}