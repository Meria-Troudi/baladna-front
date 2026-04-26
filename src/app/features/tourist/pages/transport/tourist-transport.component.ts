import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { Reservation, ReservationRequest } from '../../models/reservation.model';
import { Station } from '../../models/station.model';
import { Trajet } from '../../models/trajet.model';
import { Transport } from '../../models/transport.model';
import {
  BestTransportRecommendation,
  TransportDelayPrediction,
  TransportService
} from '../../services/transport.service';
import { TransportTicketService } from '../../../../shared/services/transport-ticket.service';
import {
  getCompactLocationText,
  getCompactPlaceTitle,
  getCompactRouteLabel,
  getCompactRouteText
} from '../../../../shared/utils/location-display.util';

@Component({
  selector: 'app-tourist-transport',
  templateUrl: './tourist-transport.component.html',
  styleUrls: ['./tourist-transport.component.css']
})
export class TouristTransportComponent implements OnInit {
  transports: Transport[] = [];
  trajets: Trajet[] = [];
  stations: Station[] = [];
  filteredTransports: Transport[] = [];
  displayedTransports: Transport[] = [];
  paginatedDisplayedTransports: Transport[] = [];
  aiRecommendation: BestTransportRecommendation | null = null;
  aiDelayPrediction: TransportDelayPrediction | null = null;

  myReservations: Reservation[] = [];
  filteredReservations: Reservation[] = [];
  paginatedReservations: Reservation[] = [];

  activeTouristView: 'search-book' | 'reservations' = 'search-book';

  searchDeparture = '';
  searchArrival = '';
  reservationSearch = '';
  showOnlyBookable = true;

  selectedTransport: Transport | null = null;
  reservationToCancel: Reservation | null = null;
  reservationToDelete: Reservation | null = null;
  selectedTicketReservation: Reservation | null = null;
  reservationForm!: FormGroup;
  ticketQrCodeDataUrl = '';

  loading = false;
  reservationsLoading = false;
  reservationLoading = false;
  cancelLoading = false;
  deleteLoading = false;
  ticketLoading = false;
  aiRecommendationLoading = false;
  aiDelayPredictionLoading = false;

  errorMessage = '';
  successMessage = '';
  private successTimeoutId: ReturnType<typeof setTimeout> | null = null;

  currentTransportPage = 1;
  currentReservationPage = 1;
  readonly pageSize = 4;

  constructor(
    private transportService: TransportService,
    private fb: FormBuilder,
    private router: Router,
    private transportTicketService: TransportTicketService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadTransportContext();
    this.loadMyReservations();
  }

  initForm(): void {
    this.reservationForm = this.fb.group({
      boardingPoint: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
      seatsCount: [1, [Validators.required, Validators.min(1), Validators.max(20)]]
    });
  }

  loadTransportContext(): void {
    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      transports: this.transportService.getAvailableTransports(),
      trajets: this.transportService.getTrajets(),
      stations: this.transportService.getStations()
    })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: ({ transports, trajets, stations }) => {
          this.transports = transports;
          this.trajets = trajets;
          this.stations = stations;
          this.filteredTransports = transports;
          this.applyTransportFilters();
        },
        error: (error) => {
          this.errorMessage = this.extractErrorMessage(error, 'Unable to load transports.');
        }
      });
  }

  getWeatherLabel(weather: string): string {
    const labels: Record<string, string> = {
      SUNNY: 'Sunny',
      RAIN: 'Rain',
      STORM: 'Storm',
      SANDSTORM: 'Sandstorm'
    };
    return labels[weather] || weather;
  }

  getReservationStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      PENDING_APPROVAL: 'Pending Approval',
      CONFIRMED: 'Confirmed',
      BOARDED: 'Boarded',
      CANCELLED: 'Cancelled',
      REJECTED: 'Rejected'
    };
    return labels[status] || status;
  }

  resetSearch(): void {
    this.searchDeparture = '';
    this.searchArrival = '';
    this.applyTransportFilters();
    this.errorMessage = '';
    this.successMessage = '';
  }

  onSearchInputChange(): void {
    this.applyTransportFilters();
  }

  onReservationSearchChange(): void {
    this.applyReservationFilters();
  }

  resetReservationSearch(): void {
    this.reservationSearch = '';
    this.applyReservationFilters();
  }

  openReservationForm(transport: Transport): void {
    if (!this.canReserve(transport)) return;

    this.selectedTransport = transport;
    this.activeTouristView = 'search-book';
    this.errorMessage = '';
    this.successMessage = '';
    this.aiDelayPrediction = null;
    this.reservationForm.patchValue({
      boardingPoint: transport.departurePoint || '',
      seatsCount: 1
    });
    this.loadDelayPrediction(transport.id);
  }

  closeReservationPanel(): void {
    this.selectedTransport = null;
    this.aiDelayPrediction = null;
    this.aiDelayPredictionLoading = false;
    this.activeTouristView = 'search-book';
    this.reservationForm.reset({
      boardingPoint: '',
      seatsCount: 1
    });
  }

  goBackToDashboard(): void {
    this.router.navigate(['/tourist/dashboard']);
  }

  scrollToTransports(): void {
    this.activeTouristView = 'search-book';
  }

  scrollToReservations(): void {
    this.activeTouristView = 'reservations';
  }

  submitReservation(): void {
    if (!this.selectedTransport) {
      this.errorMessage = 'No transport selected.';
      return;
    }

    if (!this.canReserve(this.selectedTransport)) {
      this.errorMessage = 'This transport is no longer available for booking.';
      return;
    }

    if (this.reservationForm.invalid) {
      this.reservationForm.markAllAsTouched();
      this.errorMessage = 'Please fix the highlighted fields.';
      return;
    }

    const payload: ReservationRequest = {
      transportId: this.selectedTransport.id,
      boardingPoint: this.reservationForm.value.boardingPoint,
      seatsCount: Number(this.reservationForm.value.seatsCount),
      recommendationFeedbackId: this.isRecommendedTransport(this.selectedTransport)
        ? this.aiRecommendation?.recommendationFeedbackId ?? undefined
        : undefined
    };

    this.reservationLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.transportService.createReservation(payload)
      .pipe(finalize(() => (this.reservationLoading = false)))
      .subscribe({
        next: () => {
          this.showSuccessMessage('Reservation request submitted successfully. It is now pending approval.');
          this.closeReservationPanel();
          this.loadTransportContext();
          this.loadMyReservations();
          this.scrollToReservations();
        },
        error: (error) => {
          this.errorMessage = this.extractErrorMessage(error, 'Reservation failed.');
        }
      });
  }

  loadMyReservations(): void {
    this.reservationsLoading = true;

    this.transportService.getMyReservations()
      .pipe(finalize(() => (this.reservationsLoading = false)))
      .subscribe({
        next: (data) => {
          this.myReservations = [...data].sort(
            (a, b) => new Date(b.reservationDate).getTime() - new Date(a.reservationDate).getTime()
          );
          this.applyTransportFilters();
          this.applyReservationFilters();
        },
        error: (error) => {
          this.errorMessage = this.extractErrorMessage(error, 'Unable to load reservations.');
        }
      });
  }

  requestCancelReservation(reservation: Reservation): void {
    if (!this.canCancelReservation(reservation)) return;
    this.reservationToCancel = reservation;
    this.errorMessage = '';
  }

  requestDeleteReservation(reservation: Reservation): void {
    if (!this.canDeleteReservation(reservation)) return;
    this.reservationToDelete = reservation;
    this.errorMessage = '';
  }

  canViewTicket(reservation: Reservation | null): boolean {
    if (!reservation) return false;
    return reservation.status === 'CONFIRMED' || reservation.status === 'BOARDED';
  }

  async openTicketPreview(reservation: Reservation): Promise<void> {
    if (!this.canViewTicket(reservation)) return;

    this.selectedTicketReservation = reservation;
    this.ticketLoading = true;
    this.errorMessage = '';

    try {
      this.ticketQrCodeDataUrl = await this.transportTicketService.getTicketQrCodeDataUrl(reservation);
    } catch (error) {
      this.ticketQrCodeDataUrl = '';
      this.errorMessage = this.extractErrorMessage(error, 'Unable to generate the reservation QR code.');
    } finally {
      this.ticketLoading = false;
    }
  }

  closeTicketPreview(): void {
    this.selectedTicketReservation = null;
    this.ticketQrCodeDataUrl = '';
    this.ticketLoading = false;
  }

  async downloadTicketPdf(reservation: Reservation | null): Promise<void> {
    if (!reservation || !this.canViewTicket(reservation)) return;

    this.errorMessage = '';

    try {
      await this.transportTicketService.openTicketPdf(reservation, 'Tourist copy');
    } catch (error) {
      this.errorMessage = this.extractErrorMessage(error, 'Unable to prepare the reservation PDF.');
    }
  }

  closeCancelModal(): void {
    this.reservationToCancel = null;
  }

  cancelReservation(): void {
    if (!this.reservationToCancel) return;

    const reservationId = this.reservationToCancel.id;
    this.cancelLoading = true;
    this.errorMessage = '';

    this.transportService.cancelReservation(reservationId)
      .pipe(finalize(() => (this.cancelLoading = false)))
      .subscribe({
        next: () => {
          this.showSuccessMessage('Reservation cancelled successfully.');
          this.closeCancelModal();
          this.loadTransportContext();
          this.loadMyReservations();
          this.scrollToReservations();
        },
        error: (error) => {
          this.errorMessage = this.extractErrorMessage(error, 'Cancellation failed.');
        }
      });
  }

  closeDeleteModal(): void {
    this.reservationToDelete = null;
  }

  deleteReservation(): void {
    if (!this.reservationToDelete) return;

    const reservationId = this.reservationToDelete.id;
    this.deleteLoading = true;
    this.errorMessage = '';

    this.transportService.deleteMyReservation(reservationId)
      .pipe(finalize(() => (this.deleteLoading = false)))
      .subscribe({
        next: () => {
          this.showSuccessMessage('Reservation deleted successfully.');
          this.closeDeleteModal();
          this.loadMyReservations();
          this.scrollToReservations();
        },
        error: (error) => {
          this.errorMessage = this.extractErrorMessage(error, 'Unable to delete the reservation.');
        }
      });
  }

  canReserve(transport: Transport): boolean {
    return !this.hasActiveReservationForTransport(transport.id)
      && transport.availableSeats > 0
      && transport.status === 'SCHEDULED';
  }

  isBookableTransport(transport: Transport): boolean {
    return transport.availableSeats > 0 && transport.status === 'SCHEDULED';
  }

  get availableTransportCount(): number {
    return this.displayedTransports.filter((transport) => this.canReserve(transport)).length;
  }

  get activeReservationCount(): number {
    return this.myReservations.filter((reservation) =>
      reservation.status === 'PENDING_APPROVAL' ||
      reservation.status === 'CONFIRMED' ||
      reservation.status === 'BOARDED'
    ).length;
  }

  get cancelledReservationCount(): number {
    return this.myReservations.filter((reservation) =>
      reservation.status === 'CANCELLED' || reservation.status === 'REJECTED'
    ).length;
  }

  get reservedSeatCount(): number {
    return this.myReservations
      .filter((reservation) =>
        reservation.status === 'PENDING_APPROVAL' ||
        reservation.status === 'CONFIRMED' ||
        reservation.status === 'BOARDED'
      )
      .reduce((total, reservation) => total + reservation.reservedSeats, 0);
  }

  get transportTotalPages(): number {
    return Math.max(1, Math.ceil(this.displayedTransports.length / this.pageSize));
  }

  get reservationTotalPages(): number {
    return Math.max(1, Math.ceil(this.filteredReservations.length / this.pageSize));
  }

  get transportPageNumbers(): number[] {
    return Array.from({ length: this.transportTotalPages }, (_, index) => index + 1);
  }

  get reservationPageNumbers(): number[] {
    return Array.from({ length: this.reservationTotalPages }, (_, index) => index + 1);
  }

  goToTransportPage(page: number): void {
    this.currentTransportPage = this.clampPage(page, this.transportTotalPages);
    this.updateTransportPagination();
  }

  goToReservationPage(page: number): void {
    this.currentReservationPage = this.clampPage(page, this.reservationTotalPages);
    this.updateReservationPagination();
  }

  toggleAvailabilityFilter(): void {
    this.showOnlyBookable = !this.showOnlyBookable;
    this.applyTransportFilters();
  }

  canCancelReservation(reservation: Reservation): boolean {
    return reservation.status === 'PENDING_APPROVAL' || reservation.status === 'CONFIRMED';
  }

  canDeleteReservation(reservation: Reservation): boolean {
    return reservation.status === 'CANCELLED' || reservation.status === 'REJECTED';
  }

  getReservationTicketCode(reservation: Reservation): string {
    return this.transportTicketService.getTicketCode(reservation);
  }

  hasActiveReservationForTransport(transportId: number): boolean {
    return this.myReservations.some((reservation) =>
      reservation.transportId === transportId &&
      (
        reservation.status === 'PENDING_APPROVAL' ||
        reservation.status === 'CONFIRMED' ||
        reservation.status === 'BOARDED'
      )
    );
  }

  getTransportActionLabel(transport: Transport): string {
    if (this.hasActiveReservationForTransport(transport.id)) return 'Already booked';
    if (transport.status === 'COMPLETED') return 'Completed';
    if (transport.status === 'CANCELLED') return 'Cancelled';
    if (transport.availableSeats <= 0) return 'No seats left';
    if (transport.status === 'IN_PROGRESS') return 'In Progress';
    if (transport.status !== 'SCHEDULED') return transport.status;
    return 'Reserve';
  }

  getTransportCardState(transport: Transport): string {
    if (transport.status === 'COMPLETED') return 'completed';
    if (transport.status === 'CANCELLED') return 'cancelled';
    if (transport.availableSeats <= 0) return 'full';
    if (transport.status === 'IN_PROGRESS') return 'in-progress';
    return 'available';
  }

  get selectedTransportSeatOptions(): number[] {
    const maxSeats = Math.min(this.selectedTransport?.availableSeats || 1, 20);
    return Array.from({ length: maxSeats }, (_, index) => index + 1);
  }

  isRecommendedTransport(transport: Transport): boolean {
    return this.aiRecommendation?.recommended?.transportId === transport.id;
  }

  chooseAiRecommendation(): void {
    const recommendedTransportId = this.aiRecommendation?.recommended?.transportId;
    if (!recommendedTransportId) {
      return;
    }

    const recommendedTransport = this.displayedTransports.find((transport) => transport.id === recommendedTransportId);
    if (!recommendedTransport) {
      return;
    }

    this.openReservationForm(recommendedTransport);
  }

  getDelayRiskClass(riskLevel?: string | null): string {
    switch (riskLevel) {
      case 'CRITICAL':
        return 'risk-pill risk-pill--critical';
      case 'HIGH':
        return 'risk-pill risk-pill--high';
      case 'MEDIUM':
        return 'risk-pill risk-pill--medium';
      default:
        return 'risk-pill risk-pill--low';
    }
  }

  getDelayRiskLabel(riskLevel?: string | null): string {
    switch (riskLevel) {
      case 'CRITICAL':
        return 'Severe';
      case 'HIGH':
        return 'High';
      case 'MEDIUM':
        return 'Moderate';
      case 'LOW':
        return 'Low';
      default:
        return 'Low';
    }
  }

  getTrajetById(trajetId?: number): Trajet | undefined {
    return this.trajets.find((item) => item.id === trajetId);
  }

  getCompactTransportRoute(transport: Transport): string {
    const trajet = this.getTrajetById(transport.trajetId);
    if (!trajet) {
      return transport.trajetDescription ? getCompactRouteText(transport.trajetDescription) : 'No route details';
    }

    const departureStation = this.stations.find((station) => station.id === trajet.departureStationId);
    const arrivalStation = this.stations.find((station) => station.id === trajet.arrivalStationId);

    return getCompactRouteLabel(
      trajet.departureStationName || departureStation?.name,
      departureStation?.city,
      trajet.arrivalStationName || arrivalStation?.name,
      arrivalStation?.city
    );
  }

  getCompactDeparturePoint(transport: Transport): string {
    const trajet = this.getTrajetById(transport.trajetId);
    if (trajet) {
      const departureStation = this.stations.find((station) => station.id === trajet.departureStationId);
      return getCompactPlaceTitle(
        trajet.departureStationName || departureStation?.name,
        departureStation?.city
      );
    }

    return getCompactLocationText(transport.departurePoint) || 'N/A';
  }

  getCompactReservationRoute(reservation: Reservation): string {
    return reservation.transportRoute
      ? getCompactRouteText(reservation.transportRoute)
      : 'Transport reservation';
  }

  getCompactReservationDeparture(reservation: Reservation): string {
    return getCompactLocationText(reservation.transportDeparturePoint || reservation.boardingPoint) || 'N/A';
  }

  getStationLatitude(stationId?: number): number | null {
    return this.stations.find((item) => item.id === stationId)?.latitude ?? null;
  }

  getStationLongitude(stationId?: number): number | null {
    return this.stations.find((item) => item.id === stationId)?.longitude ?? null;
  }

  private applyTransportFilters(): void {
    const departure = this.searchDeparture.trim().toLowerCase();
    const arrival = this.searchArrival.trim().toLowerCase();

    this.filteredTransports = this.transports.filter((transport) => {
      const trajet = this.getTrajetById(transport.trajetId);
      const departureStation = this.stations.find((station) => station.id === trajet?.departureStationId);
      const arrivalStation = this.stations.find((station) => station.id === trajet?.arrivalStationId);

      const departureText =
        `${transport.departurePoint || ''} ${transport.trajetDescription || ''} ${departureStation?.name || ''} ${departureStation?.city || ''}`.toLowerCase();

      const arrivalText =
        `${transport.trajetDescription || ''} ${arrivalStation?.name || ''} ${arrivalStation?.city || ''}`.toLowerCase();

      const matchesDeparture = !departure || departureText.includes(departure);
      const matchesArrival = !arrival || arrivalText.includes(arrival);

      return matchesDeparture && matchesArrival;
    });

    this.displayedTransports = this.filteredTransports.filter((transport) =>
      !this.hasActiveReservationForTransport(transport.id) &&
      (!this.showOnlyBookable || this.isBookableTransport(transport))
    );

    if (
      this.selectedTransport &&
      !this.displayedTransports.some((transport) => transport.id === this.selectedTransport?.id)
    ) {
      this.closeReservationPanel();
    }

    this.currentTransportPage = 1;
    this.updateTransportPagination();
    this.loadAiRecommendation();
  }

  private applyReservationFilters(): void {
    const search = this.reservationSearch.trim().toLowerCase();

    this.filteredReservations = this.myReservations.filter((reservation) => {
      const route = (reservation.transportRoute || '').toLowerCase();
      const departure = (reservation.transportDeparturePoint || '').toLowerCase();
      const boardingPoint = (reservation.boardingPoint || '').toLowerCase();
      const ticketCode = this.getReservationTicketCode(reservation).toLowerCase();
      const status = this.getReservationStatusLabel(reservation.status).toLowerCase();

      return !search ||
        route.includes(search) ||
        departure.includes(search) ||
        boardingPoint.includes(search) ||
        ticketCode.includes(search) ||
        status.includes(search);
    });

    this.currentReservationPage = 1;
    this.updateReservationPagination();
  }

  private updateTransportPagination(): void {
    this.currentTransportPage = this.clampPage(this.currentTransportPage, this.transportTotalPages);
    const start = (this.currentTransportPage - 1) * this.pageSize;
    this.paginatedDisplayedTransports = this.displayedTransports.slice(start, start + this.pageSize);
  }

  private loadAiRecommendation(): void {
    this.aiRecommendationLoading = true;

    this.transportService.getBestTransportRecommendation(this.searchDeparture, this.searchArrival)
      .pipe(finalize(() => (this.aiRecommendationLoading = false)))
      .subscribe({
        next: (recommendation) => {
          this.aiRecommendation = recommendation;
        },
        error: () => {
          this.aiRecommendation = null;
        }
      });
  }

  private loadDelayPrediction(transportId: number): void {
    this.aiDelayPredictionLoading = true;

    this.transportService.getDelayPrediction(transportId)
      .pipe(finalize(() => (this.aiDelayPredictionLoading = false)))
      .subscribe({
        next: (prediction) => {
          this.aiDelayPrediction = prediction;
        },
        error: () => {
          this.aiDelayPrediction = null;
        }
      });
  }

  private updateReservationPagination(): void {
    this.currentReservationPage = this.clampPage(this.currentReservationPage, this.reservationTotalPages);
    const start = (this.currentReservationPage - 1) * this.pageSize;
    this.paginatedReservations = this.filteredReservations.slice(start, start + this.pageSize);
  }

  private clampPage(page: number, totalPages: number): number {
    return Math.min(Math.max(page, 1), totalPages);
  }

  hasReservationError(controlName: string): boolean {
    const control = this.reservationForm.get(controlName);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  getReservationFieldError(controlName: string): string {
    const control = this.reservationForm.get(controlName);

    if (!control || !control.errors || !(control.touched || control.dirty)) {
      return '';
    }

    if (controlName === 'boardingPoint') {
      if (control.errors['required']) return 'Boarding point is required.';
      if (control.errors['minlength']) return 'Boarding point must contain at least 2 characters.';
      if (control.errors['maxlength']) return 'Boarding point must contain at most 150 characters.';
    }

    if (controlName === 'seatsCount') {
      if (control.errors['required']) return 'Seat count is required.';
      if (control.errors['min']) return 'You must reserve at least 1 seat.';
      if (control.errors['max']) return 'You can reserve up to 20 seats.';
    }

    return '';
  }

  private extractErrorMessage(error: any, fallback: string): string {
    if (!error) return fallback;
    if (typeof error.error === 'string' && error.error.trim()) return error.error;
    if (error.error?.message) return error.error.message;
    if (error.message) return error.message;
    return fallback;
  }

  private showSuccessMessage(message: string): void {
    if (this.successTimeoutId) clearTimeout(this.successTimeoutId);
    this.successMessage = message;
    this.successTimeoutId = setTimeout(() => {
      this.successMessage = '';
      this.successTimeoutId = null;
    }, 3000);
  }
}
