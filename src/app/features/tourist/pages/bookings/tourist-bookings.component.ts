import { Component, OnInit } from '@angular/core';
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
export class TouristBookingsComponent implements OnInit {
  myReservations: Reservation[] = [];
  loading = false;
  ticketLoading = false;
  errorMessage = '';
  selectedReservation: Reservation | null = null;
  selectedTicketQrCode = '';

  constructor(
    private transportService: TransportService,
    private transportTicketService: TransportTicketService
  ) {}

  ngOnInit(): void {
    this.loadReservations();
  }

  get activeReservationsCount(): number {
    return this.myReservations.filter((reservation) => reservation.status !== 'CANCELLED').length;
  }

  get cancelledReservationsCount(): number {
    return this.myReservations.filter((reservation) => reservation.status === 'CANCELLED').length;
  }

  get reservedSeatsCount(): number {
    return this.myReservations
      .filter((reservation) => reservation.status !== 'CANCELLED')
      .reduce((total, reservation) => total + reservation.reservedSeats, 0);
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
        },
        error: (error) => {
          this.errorMessage = this.extractErrorMessage(error, 'Unable to load your bookings.');
        }
      });
  }

  async openTicketPreview(reservation: Reservation): Promise<void> {
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
    return getCompactLocationText(reservation.transportDeparturePoint || reservation.boardingPoint) || reservation.boardingPoint || 'N/A';
  }

  getReservationTicketCode(reservation: Reservation): string {
    return this.transportTicketService.getTicketCode(reservation);
  }

  private extractErrorMessage(error: any, fallback: string): string {
    if (!error) return fallback;
    if (typeof error.error === 'string' && error.error.trim()) return error.error;
    if (error.error?.message) return error.error.message;
    if (error.message) return error.message;
    return fallback;
  }
}
