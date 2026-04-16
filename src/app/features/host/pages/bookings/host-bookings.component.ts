import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { finalize } from 'rxjs/operators';

import { Reservation } from '../../../tourist/models/reservation.model';
import {
  ReservationTicketValidationResponse,
  TransportService
} from '../../../tourist/services/transport.service';
import { TransportTicketService } from '../../../../shared/services/transport-ticket.service';
import { getCompactLocationText, getCompactRouteText } from '../../../../shared/utils/location-display.util';

@Component({
  selector: 'app-host-bookings',
  templateUrl: './host-bookings.component.html',
  styleUrls: ['./host-bookings.component.css']
})
export class HostBookingsComponent implements OnInit, OnDestroy {
  @ViewChild('scannerVideo') scannerVideo?: ElementRef<HTMLVideoElement>;

  reservations: Reservation[] = [];
  filteredReservations: Reservation[] = [];
  loading = false;
  ticketLoading = false;
  validatingTicket = false;
  scannerStarting = false;
  errorMessage = '';
  searchTerm = '';
  ticketValidationCode = '';
  scannerErrorMessage = '';
  selectedReservation: Reservation | null = null;
  selectedTicketQrCode = '';
  ticketValidationResult: ReservationTicketValidationResponse | null = null;
  scannerOpen = false;

  private barcodeDetector: BarcodeDetector | null = null;
  private scannerStream: MediaStream | null = null;
  private scannerAnimationFrameId: number | null = null;

  constructor(
    private transportService: TransportService,
    private transportTicketService: TransportTicketService
  ) {}

  ngOnInit(): void {
    this.loadReservations();
  }

  ngOnDestroy(): void {
    this.stopScanner();
  }

  get activeReservationsCount(): number {
    return this.reservations.filter((reservation) => reservation.status !== 'CANCELLED').length;
  }

  get cancelledReservationsCount(): number {
    return this.reservations.filter((reservation) => reservation.status === 'CANCELLED').length;
  }

  get totalSeatsReserved(): number {
    return this.reservations
      .filter((reservation) => reservation.status !== 'CANCELLED')
      .reduce((total, reservation) => total + reservation.reservedSeats, 0);
  }

  loadReservations(): void {
    this.loading = true;
    this.errorMessage = '';

    this.transportService.getAllReservations()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (reservations) => {
          this.reservations = [...reservations].sort((first, second) =>
            new Date(second.reservationDate).getTime() - new Date(first.reservationDate).getTime()
          );
          this.applyFilter();
        },
        error: (error) => {
          this.errorMessage = this.extractErrorMessage(error, 'Unable to load bookings.');
        }
      });
  }

  applyFilter(): void {
    const query = this.searchTerm.trim().toLowerCase();

    this.filteredReservations = this.reservations.filter((reservation) => {
      const haystack = [
        this.getReservationTicketCode(reservation),
        reservation.userFullName,
        reservation.userEmail,
        reservation.transportRoute,
        reservation.boardingPoint,
        reservation.transportDeparturePoint,
        reservation.status
      ].join(' ').toLowerCase();

      return !query || haystack.includes(query);
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
      await this.transportTicketService.openTicketPdf(reservation, 'Host control copy');
    } catch (error) {
      this.errorMessage = this.extractErrorMessage(error, 'Unable to prepare the ticket PDF.');
    }
  }

  validateTypedTicket(): void {
    this.validateTicketCode(this.ticketValidationCode);
  }

  validateReservationTicket(reservation: Reservation): void {
    this.validateTicketCode(this.getReservationTicketCode(reservation));
  }

  getReservationRoute(reservation: Reservation): string {
    return getCompactRouteText(reservation.transportRoute) || 'Transport reservation';
  }

  getReservationDeparture(reservation: Reservation): string {
    return getCompactLocationText(reservation.transportDeparturePoint || reservation.boardingPoint) || reservation.boardingPoint || 'N/A';
  }

  getReservationPassenger(reservation: Reservation): string {
    return reservation.userFullName || 'Passenger not provided';
  }

  getReservationTicketCode(reservation: Reservation): string {
    return this.transportTicketService.getTicketCode(reservation);
  }

  clearTicketValidation(): void {
    this.ticketValidationCode = '';
    this.ticketValidationResult = null;
    this.errorMessage = '';
  }

  get isScannerSupported(): boolean {
    return typeof window !== 'undefined' && 'BarcodeDetector' in window && !!navigator?.mediaDevices?.getUserMedia;
  }

  async openScanner(): Promise<void> {
    this.scannerOpen = true;
    this.scannerErrorMessage = '';
    this.errorMessage = '';
    this.ticketValidationResult = null;

    if (!this.isScannerSupported) {
     // this.scannerErrorMessage = 'QR camera scanning is not supported in this browser. Use manual ticket code validation instead.';
      //return;
    }

    this.scannerStarting = true;

    try {
      this.barcodeDetector = new BarcodeDetector({ formats: ['qr_code'] });
      this.scannerStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment'
        },
        audio: false
      });

      setTimeout(async () => {
        const videoElement = this.scannerVideo?.nativeElement;
        if (!videoElement || !this.scannerStream) {
          this.scannerErrorMessage = 'Unable to initialise the scanner preview.';
          this.scannerStarting = false;
          return;
        }

        videoElement.srcObject = this.scannerStream;
        await videoElement.play();
        this.scannerStarting = false;
        this.scanFrame();
      }, 0);
    } catch (error) {
      this.scannerStarting = false;
      this.scannerErrorMessage = this.extractErrorMessage(error, 'Unable to access the camera for QR scanning.');
      this.stopScanner();
    }
  }

  closeScanner(): void {
    this.scannerOpen = false;
    this.scannerErrorMessage = '';
    this.stopScanner();
  }

  private extractErrorMessage(error: any, fallback: string): string {
    if (!error) return fallback;
    if (typeof error.error === 'string' && error.error.trim()) return error.error;
    if (error.error?.message) return error.error.message;
    if (error.message) return error.message;
    return fallback;
  }

  private validateTicketCode(ticketCode: string): void {
    const normalizedCode = ticketCode.trim();
    if (!normalizedCode) {
      this.errorMessage = 'Please enter a ticket code to validate.';
      this.ticketValidationResult = null;
      return;
    }

    this.validatingTicket = true;
    this.errorMessage = '';
    this.ticketValidationResult = null;
    this.ticketValidationCode = normalizedCode;

    this.transportService.validateReservationTicket(normalizedCode)
      .pipe(finalize(() => this.validatingTicket = false))
      .subscribe({
        next: (response) => {
          this.ticketValidationResult = response;
        },
        error: (error) => {
          this.ticketValidationResult = error?.error ?? null;
          this.errorMessage = this.extractErrorMessage(error, 'Unable to validate the ticket right now.');
        }
      });
  }

  private async scanFrame(): Promise<void> {
    if (!this.scannerOpen || !this.barcodeDetector) {
      return;
    }

    const videoElement = this.scannerVideo?.nativeElement;
    if (!videoElement || videoElement.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      this.queueNextScanFrame();
      return;
    }

    try {
      const barcodes = await this.barcodeDetector.detect(videoElement);
      const qrCode = barcodes.find((barcode) => !!barcode.rawValue)?.rawValue?.trim();

      if (qrCode) {
        this.ticketValidationCode = qrCode;
        this.closeScanner();
        this.validateTicketCode(qrCode);
        return;
      }
    } catch (error) {
      this.scannerErrorMessage = this.extractErrorMessage(error, 'QR scanning failed.');
      this.closeScanner();
      return;
    }

    this.queueNextScanFrame();
  }

  private queueNextScanFrame(): void {
    this.scannerAnimationFrameId = window.requestAnimationFrame(() => {
      void this.scanFrame();
    });
  }

  private stopScanner(): void {
    if (this.scannerAnimationFrameId !== null) {
      window.cancelAnimationFrame(this.scannerAnimationFrameId);
      this.scannerAnimationFrameId = null;
    }

    if (this.scannerVideo?.nativeElement) {
      this.scannerVideo.nativeElement.pause();
      this.scannerVideo.nativeElement.srcObject = null;
    }

    if (this.scannerStream) {
      this.scannerStream.getTracks().forEach((track) => track.stop());
      this.scannerStream = null;
    }

    this.scannerStarting = false;
    this.barcodeDetector = null;
  }
}
