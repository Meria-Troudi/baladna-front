import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { Reservation, ReservationRequest } from '../../models/reservation.model';
import { Transport } from '../../models/transport.model';
import { TransportService } from '../../services/transport.service';

@Component({
  selector: 'app-tourist-transport',
  templateUrl: './tourist-transport.component.html',
  styleUrls: ['./tourist-transport.component.css']
})
export class TouristTransportComponent implements OnInit {
  transports: Transport[] = [];
  filteredTransports: Transport[] = [];
  displayedTransports: Transport[] = [];
  myReservations: Reservation[] = [];
  activeTouristView: 'search-book' | 'reservations' = 'search-book';

  searchDeparture = '';
  searchArrival = '';

  selectedTransport: Transport | null = null;
  reservationToCancel: Reservation | null = null;
  reservationForm!: FormGroup;

  loading = false;
  reservationsLoading = false;
  reservationLoading = false;

  errorMessage = '';
  successMessage = '';
  private successTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private transportService: TransportService,
    private fb: FormBuilder,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadAvailableTransports();
    this.loadMyReservations();
  }

  initForm(): void {
    this.reservationForm = this.fb.group({
      boardingPoint: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
      seatsCount: [1, [Validators.required, Validators.min(1), Validators.max(20)]]
    });
  }

  loadAvailableTransports(): void {
    this.loading = true;
    this.errorMessage = '';

    this.transportService.getAvailableTransports()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (data) => {
          this.transports = data;
          this.filteredTransports = data;
          this.applyTransportVisibility();
        },
        error: (error) => {
          this.errorMessage = this.extractErrorMessage(error, 'Unable to load transports.');
        }
      });
  }

  searchTransport(): void {
    const departure = this.searchDeparture.trim();
    const arrival = this.searchArrival.trim();

    if (!departure || !arrival) {
      this.filteredTransports = this.transports;
      this.applyTransportVisibility();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.transportService.searchTransports(departure, arrival)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (data) => {
          this.filteredTransports = data;
          this.applyTransportVisibility();
        },
        error: (error) => {
          this.errorMessage = this.extractErrorMessage(error, 'Search failed.');
        }
      });
  }

  resetSearch(): void {
    this.searchDeparture = '';
    this.searchArrival = '';
    this.filteredTransports = this.transports;
    this.applyTransportVisibility();
    this.errorMessage = '';
    this.successMessage = '';
  }

  onSearchInputChange(): void {
    if (!this.searchDeparture.trim() || !this.searchArrival.trim()) {
      this.filteredTransports = this.transports;
      this.applyTransportVisibility();
    }
  }

  openReservationForm(transport: Transport): void {
    this.selectedTransport = transport;
    this.activeTouristView = 'search-book';
    this.errorMessage = '';
    this.successMessage = '';
    this.reservationForm.patchValue({
      boardingPoint: transport.departurePoint || '',
      seatsCount: 1
    });
  }

  closeReservationPanel(): void {
    this.selectedTransport = null;
    this.activeTouristView = 'search-book';
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

    if (this.reservationForm.invalid) {
      this.reservationForm.markAllAsTouched();
      this.errorMessage = 'Please fix the highlighted fields.';
      return;
    }

    const payload: ReservationRequest = {
      transportId: this.selectedTransport.id,
      boardingPoint: this.reservationForm.value.boardingPoint,
      seatsCount: Number(this.reservationForm.value.seatsCount)
    };

    this.reservationLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.transportService.createReservation(payload)
      .pipe(finalize(() => this.reservationLoading = false))
      .subscribe({
        next: () => {
          this.showSuccessMessage('Reservation completed successfully.');
          this.closeReservationPanel();
          this.loadAvailableTransports();
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
      .pipe(finalize(() => this.reservationsLoading = false))
      .subscribe({
        next: (data) => {
          this.myReservations = data;
          this.applyTransportVisibility();
        },
        error: (error) => {
          this.errorMessage = this.extractErrorMessage(error, 'Unable to load reservations.');
        }
      });
  }

  requestCancelReservation(reservation: Reservation): void {
    if (!this.canCancelReservation(reservation)) {
      return;
    }

    this.reservationToCancel = reservation;
    this.errorMessage = '';
  }

  closeCancelModal(): void {
    this.reservationToCancel = null;
  }

  cancelReservation(): void {
    if (!this.reservationToCancel) {
      return;
    }

    const reservationId = this.reservationToCancel.id;
    this.transportService.cancelReservation(reservationId).subscribe({
      next: () => {
        this.showSuccessMessage('Reservation cancelled successfully.');
        this.closeCancelModal();
        this.loadAvailableTransports();
        this.loadMyReservations();
      },
      error: (error) => {
        this.errorMessage = this.extractErrorMessage(error, 'Cancellation failed.');
      }
    });
  }

  canReserve(transport: Transport): boolean {
    return !this.hasActiveReservationForTransport(transport.id)
      && transport.availableSeats > 0
      && transport.status === 'SCHEDULED';
  }

  get availableTransportCount(): number {
    return this.displayedTransports.filter((transport) => this.canReserve(transport)).length;
  }

  get activeReservationCount(): number {
    return this.myReservations.filter((reservation) => reservation.status !== 'CANCELLED').length;
  }

  get cancelledReservationCount(): number {
    return this.myReservations.filter((reservation) => reservation.status === 'CANCELLED').length;
  }

  get reservedSeatCount(): number {
    return this.myReservations
      .filter((reservation) => reservation.status !== 'CANCELLED')
      .reduce((total, reservation) => total + reservation.reservedSeats, 0);
  }

  canCancelReservation(reservation: Reservation): boolean {
    return reservation.status !== 'CANCELLED';
  }

  hasActiveReservationForTransport(transportId: number): boolean {
    return this.myReservations.some((reservation) =>
      reservation.transportId === transportId && reservation.status !== 'CANCELLED'
    );
  }

  getTransportActionLabel(transport: Transport): string {
    if (this.hasActiveReservationForTransport(transport.id)) {
      return 'Already reserved';
    }

    if (transport.status === 'COMPLETED') {
      return 'Completed';
    }

    if (transport.status === 'CANCELLED') {
      return 'Cancelled';
    }

    if (transport.availableSeats <= 0) {
      return 'Full';
    }

    if (transport.status !== 'SCHEDULED') {
      return transport.status;
    }

    return 'Reserve';
  }

  getTransportCardState(transport: Transport): string {
    if (transport.status === 'COMPLETED') {
      return 'completed';
    }

    if (transport.status === 'CANCELLED') {
      return 'cancelled';
    }

    if (transport.availableSeats <= 0) {
      return 'full';
    }

    return 'available';
  }

  private applyTransportVisibility(): void {
    this.displayedTransports = this.filteredTransports.filter((transport) =>
      !this.hasActiveReservationForTransport(transport.id)
    );
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
