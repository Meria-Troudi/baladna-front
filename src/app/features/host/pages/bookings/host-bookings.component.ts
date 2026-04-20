import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import jsQR from 'jsqr';

import { Reservation } from '../../../tourist/models/reservation.model';
import {
  ReservationTicketValidationResponse,
  TransportService
} from '../../../tourist/services/transport.service';
import { TransportTicketService } from '../../../../shared/services/transport-ticket.service';
import { getCompactLocationText, getCompactRouteText } from '../../../../shared/utils/location-display.util';

type ReservationTimeframe = 'ALL' | 'TODAY' | 'UPCOMING' | 'PAST';

interface ReservationGroup {
  key: Exclude<ReservationTimeframe, 'ALL'>;
  title: string;
  subtitle: string;
  reservations: Reservation[];
}

interface PaginatedReservationGroup extends ReservationGroup {
  currentPage: number;
  totalPages: number;
  pageNumbers: number[];
  paginatedReservations: Reservation[];
}

@Component({
  selector: 'app-host-bookings',
  templateUrl: './host-bookings.component.html',
  styleUrls: ['./host-bookings.component.css']
})
export class HostBookingsComponent implements OnInit, OnDestroy {
  @ViewChild('scannerVideo') scannerVideo?: ElementRef<HTMLVideoElement>;
  @ViewChild('scannerCanvas') scannerCanvas?: ElementRef<HTMLCanvasElement>;

  reservations: Reservation[] = [];
  filteredReservations: Reservation[] = [];
  recentValidationResults: ReservationTicketValidationResponse[] = [];

  loading = false;
  ticketLoading = false;
  validatingTicket = false;
  scannerStarting = false;
  deleteLoading = false;

  errorMessage = '';
  searchTerm = '';
  pendingSearchTerm = '';
  ticketValidationCode = '';
  scannerErrorMessage = '';

  statusFilter = 'ALL';
  timeframeFilter: ReservationTimeframe = 'ALL';
  weatherFilter = 'ALL';
  showDelayedOnly = false;
  transportIdFilter: number | null = null;

  selectedReservation: Reservation | null = null;
  reservationToDelete: Reservation | null = null;
  validatedReservationMatch: Reservation | null = null;
  selectedTicketQrCode = '';
  ticketValidationResult: ReservationTicketValidationResponse | null = null;
  scannerOpen = false;
  highlightedReservationId: number | null = null;

  approvingId: number | null = null;
  rejectingId: number | null = null;
  boardingId: number | null = null;
  approveErrorMessage = '';

  readonly pageSizeOptions: Array<2 | 3> = [2, 3];
  listPageSize: 2 | 3 = 3;
  private readonly defaultGroupPages: Record<'TODAY' | 'UPCOMING' | 'PAST', number> = {
    TODAY: 1,
    UPCOMING: 1,
    PAST: 1
  };
  pendingPage = 1;
  groupPages: Record<'TODAY' | 'UPCOMING' | 'PAST', number> = {
    TODAY: 1,
    UPCOMING: 1,
    PAST: 1
  };

  private scannerStream: MediaStream | null = null;
  private scannerAnimationFrameId: number | null = null;
  private highlightTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private routeSubscription: Subscription | null = null;

  constructor(
    private transportService: TransportService,
    private transportTicketService: TransportTicketService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.routeSubscription = this.route.queryParamMap.subscribe((params) => {
      const rawTransportId = params.get('transportId');
      const parsedTransportId = rawTransportId ? Number(rawTransportId) : Number.NaN;

      this.transportIdFilter = Number.isFinite(parsedTransportId) ? parsedTransportId : null;
      this.applyFilter();
    });

    this.loadReservations();
  }

  ngOnDestroy(): void {
    this.stopScanner();
    if (this.highlightTimeoutId) {
      clearTimeout(this.highlightTimeoutId);
    }
    this.routeSubscription?.unsubscribe();
  }

  get activeReservationsCount(): number {
    return this.reservations.filter((reservation) =>
      reservation.status !== 'CANCELLED' && reservation.status !== 'REJECTED'
    ).length;
  }

  get cancelledReservationsCount(): number {
    return this.reservations.filter((reservation) =>
      reservation.status === 'CANCELLED' || reservation.status === 'REJECTED'
    ).length;
  }

  get totalSeatsReserved(): number {
    return this.reservations
      .filter((reservation) => reservation.status !== 'CANCELLED' && reservation.status !== 'REJECTED')
      .reduce((total, reservation) => total + reservation.reservedSeats, 0);
  }

  get totalRevenue(): number {
    return this.reservations
      .filter((reservation) => reservation.status !== 'CANCELLED' && reservation.status !== 'REJECTED')
      .reduce((total, reservation) => total + (reservation.totalPrice || 0), 0);
  }

  get todayBookingsCount(): number {
    return this.reservations.filter((reservation) =>
      reservation.status !== 'CANCELLED' &&
      reservation.status !== 'REJECTED' &&
      this.getTimeframeForReservation(reservation) === 'TODAY'
    ).length;
  }

  get todayRevenue(): number {
    return this.reservations
      .filter((reservation) =>
        reservation.status !== 'CANCELLED' &&
        reservation.status !== 'REJECTED' &&
        this.getTimeframeForReservation(reservation) === 'TODAY'
      )
      .reduce((total, reservation) => total + (reservation.totalPrice || 0), 0);
  }

  get upcomingSeatsCount(): number {
    return this.reservations
      .filter((reservation) =>
        reservation.status !== 'CANCELLED' &&
        reservation.status !== 'REJECTED' &&
        this.getTimeframeForReservation(reservation) === 'UPCOMING'
      )
      .reduce((total, reservation) => total + reservation.reservedSeats, 0);
  }

  get delayedReservationsCount(): number {
    return this.reservations.filter((reservation) =>
      reservation.status !== 'CANCELLED' &&
      reservation.status !== 'REJECTED' &&
      (reservation.transportDelayMinutes || 0) > 0
    ).length;
  }

  get weatherFilterOptions(): string[] {
    return [...new Set(
      this.reservations
        .map((reservation) => reservation.transportWeather)
        .filter((weather): weather is string => !!weather)
    )].sort();
  }

  get statusFilterOptions(): string[] {
    return [...new Set(this.reservations.map((reservation) => reservation.status).filter(Boolean))].sort();
  }

  get hasActiveFilters(): boolean {
    return !!this.searchTerm.trim()
      || this.statusFilter !== 'ALL'
      || this.timeframeFilter !== 'ALL'
      || this.weatherFilter !== 'ALL'
      || this.showDelayedOnly
      || this.transportIdFilter !== null;
  }

  get hasTransportFocus(): boolean {
    return this.transportIdFilter !== null;
  }

  get transportFocusLabel(): string {
    if (this.transportIdFilter === null) {
      return '';
    }

    const matchedReservation = this.reservations.find((reservation) => reservation.transportId === this.transportIdFilter);

    if (!matchedReservation) {
      return `Transport #${this.transportIdFilter}`;
    }

    const route = this.getReservationRoute(matchedReservation);
    const departure = this.getReservationDeparture(matchedReservation);

    return departure && departure !== 'N/A'
      ? `${route} | ${departure}`
      : route;
  }

  get activeFilterSummary(): string {
    const parts: string[] = [];

    if (this.transportIdFilter !== null) {
      parts.push(`transport: ${this.transportFocusLabel}`);
    }

    if (this.timeframeFilter !== 'ALL') {
      parts.push(`timeframe: ${this.getTimeframeLabel(this.timeframeFilter)}`);
    }

    if (this.statusFilter !== 'ALL') {
      parts.push(`status: ${this.getStatusLabel(this.statusFilter)}`);
    }

    if (this.weatherFilter !== 'ALL') {
      parts.push(`weather: ${this.getWeatherLabel(this.weatherFilter)}`);
    }

    if (this.showDelayedOnly) {
      parts.push('delays only');
    }

    if (this.searchTerm.trim()) {
      parts.push(`search: "${this.searchTerm.trim()}"`);
    }

    return parts.join(' | ');
  }

  get reservationGroups(): ReservationGroup[] {
    const groups: ReservationGroup[] = [
      {
        key: 'TODAY',
        title: 'Today operations',
        subtitle: 'Bookings that need immediate attention today.',
        reservations: []
      },
      {
        key: 'UPCOMING',
        title: 'Upcoming departures',
        subtitle: 'Future trips that are already booked.',
        reservations: []
      },
      {
        key: 'PAST',
        title: 'Past activity',
        subtitle: 'Older bookings kept for follow-up and ticket history.',
        reservations: []
      }
    ];

    for (const reservation of this.filteredReservations) {
      const timeframe = this.getTimeframeForReservation(reservation);
      const targetGroup = groups.find((group) => group.key === timeframe);
      if (targetGroup) {
        targetGroup.reservations.push(reservation);
      }
    }

    for (const group of groups) {
      group.reservations.sort((left, right) => this.compareReservations(left, right, group.key));
    }

    if (this.timeframeFilter !== 'ALL') {
      return groups.filter((group) => group.key === this.timeframeFilter && group.reservations.length > 0);
    }

    return groups.filter((group) => group.reservations.length > 0);
  }

  get paginatedReservationGroups(): PaginatedReservationGroup[] {
    return this.reservationGroups.map((group) => {
      const currentPage = this.clampGroupPage(group.key, this.groupPages[group.key], group.reservations.length);
      const totalPages = Math.max(1, Math.ceil(group.reservations.length / this.listPageSize));
      const start = (currentPage - 1) * this.listPageSize;
      const paginatedReservations = group.reservations.slice(start, start + this.listPageSize);

      return {
        ...group,
        currentPage,
        totalPages,
        pageNumbers: Array.from({ length: totalPages }, (_, index) => index + 1),
        paginatedReservations
      };
    });
  }

  get pendingReservations(): Reservation[] {
    return this.reservations.filter((r) => r.status === 'PENDING_APPROVAL');
  }

  get filteredPendingReservations(): Reservation[] {
    const query = this.pendingSearchTerm.trim().toLowerCase();

    return this.pendingReservations.filter((reservation) => {
      if (!query) {
        return true;
      }

      return this.buildReservationSearchHaystack(reservation).includes(query);
    });
  }

  get pendingTotalPages(): number {
    return Math.max(1, Math.ceil(this.filteredPendingReservations.length / this.listPageSize));
  }

  get pendingCurrentPage(): number {
    return this.clampPendingPage(this.pendingPage, this.filteredPendingReservations.length);
  }

  get pendingPageNumbers(): number[] {
    return Array.from({ length: this.pendingTotalPages }, (_, index) => index + 1);
  }

  get paginatedPendingReservations(): Reservation[] {
    const currentPage = this.pendingCurrentPage;
    const start = (currentPage - 1) * this.listPageSize;
    return this.filteredPendingReservations.slice(start, start + this.listPageSize);
  }

  loadReservations(): void {
    this.loading = true;
    this.errorMessage = '';
    this.approveErrorMessage = '';

    this.transportService.getAllReservations()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (reservations) => {
          this.reservations = [...reservations].sort((left, right) =>
            (this.getOperationalDate(right)?.getTime() ?? 0) - (this.getOperationalDate(left)?.getTime() ?? 0)
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
      const matchesSearch = !query || this.buildReservationSearchHaystack(reservation).includes(query);
      const matchesStatus = this.statusFilter === 'ALL' || reservation.status === this.statusFilter;
      const matchesTimeframe = this.timeframeFilter === 'ALL' || this.getTimeframeForReservation(reservation) === this.timeframeFilter;
      const matchesWeather = this.weatherFilter === 'ALL' || reservation.transportWeather === this.weatherFilter;
      const matchesDelay = !this.showDelayedOnly || (reservation.transportDelayMinutes || 0) > 0;
      const matchesTransport = this.transportIdFilter === null || reservation.transportId === this.transportIdFilter;

      return matchesSearch && matchesStatus && matchesTimeframe && matchesWeather && matchesDelay && matchesTransport;
    });

    this.resetGroupPages();
  }

  applyPendingFilter(): void {
    this.pendingPage = 1;
  }

  setListPageSize(size: number | string): void {
    const normalizedSize: 2 | 3 = Number(size) === 2 ? 2 : 3;

    if (this.listPageSize === normalizedSize) {
      return;
    }

    this.listPageSize = normalizedSize;
    this.pendingPage = 1;
    this.resetGroupPages();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.statusFilter = 'ALL';
    this.timeframeFilter = 'ALL';
    this.weatherFilter = 'ALL';
    this.showDelayedOnly = false;
    const hadTransportFocus = this.transportIdFilter !== null;
    this.transportIdFilter = null;
    this.applyFilter();

    if (hadTransportFocus) {
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { transportId: null },
        queryParamsHandling: 'merge'
      });
    }
  }

  toggleDelayedOnly(): void {
    this.showDelayedOnly = !this.showDelayedOnly;
    this.applyFilter();
  }

  clearTransportFocus(): void {
    if (this.transportIdFilter === null) {
      return;
    }

    this.transportIdFilter = null;
    this.applyFilter();

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { transportId: null },
      queryParamsHandling: 'merge'
    });
  }

  getTimeframeLabel(timeframe: ReservationTimeframe): string {
    const labels: Record<ReservationTimeframe, string> = {
      ALL: 'All bookings',
      TODAY: 'Today',
      UPCOMING: 'Upcoming',
      PAST: 'Past'
    };

    return labels[timeframe];
  }

 getWeatherLabel(weather?: string): string {
  if (!weather) return '';
  const labels: Record<string, string> = {
    SUNNY: 'Sunny',
    RAIN: 'Rain',
    STORM: 'Storm',
    SANDSTORM: 'Sandstorm'
  };
  return labels[weather] || weather;
}

  getStatusLabel(status?: string): string {
    if (!status) return '';
    const labels: Record<string, string> = {
      PENDING_APPROVAL: 'Pending approval',
      CONFIRMED: 'Confirmed',
      BOARDED: 'Boarded',
      REJECTED: 'Rejected',
      CANCELLED: 'Cancelled'
    };
    return labels[status] || status;
  }

  goToGroupPage(groupKey: Exclude<ReservationTimeframe, 'ALL'>, page: number): void {
    const matchingGroup = this.reservationGroups.find((group) => group.key === groupKey);
    const totalItems = matchingGroup?.reservations.length ?? 0;
    this.groupPages[groupKey] = this.clampGroupPage(groupKey, page, totalItems);
  }

  goToPendingPage(page: number): void {
    this.pendingPage = this.clampPendingPage(page, this.filteredPendingReservations.length);
  }

  requestDeleteReservation(reservation: Reservation): void {
    this.reservationToDelete = reservation;
    this.errorMessage = '';
  }

  closeDeleteModal(): void {
    this.reservationToDelete = null;
    this.deleteLoading = false;
  }

  deleteReservation(): void {
    if (!this.reservationToDelete) {
      return;
    }

    const reservationId = this.reservationToDelete.id;
    this.deleteLoading = true;
    this.errorMessage = '';

    this.transportService.deleteMyReservation(reservationId)
      .pipe(finalize(() => this.deleteLoading = false))
      .subscribe({
        next: () => {
          this.closeDeleteModal();
          this.loadReservations();
        },
        error: (error) => {
          this.errorMessage = this.extractErrorMessage(error, 'Unable to delete reservation.');
        }
      });
  }

  canMarkAsBoarded(reservation: Reservation): boolean {
    return reservation.status === 'CONFIRMED';
  }

  markAsBoarded(reservation: Reservation): void {
    if (!this.canMarkAsBoarded(reservation)) {
      return;
    }

    this.boardingId = reservation.id;
    this.approveErrorMessage = '';

    this.transportService.markReservationAsBoarded(reservation.id)
      .pipe(finalize(() => this.boardingId = null))
      .subscribe({
        next: () => this.loadReservations(),
        error: (error) => {
          this.approveErrorMessage = this.extractErrorMessage(error, 'Unable to mark reservation as boarded.');
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

  openMatchedReservationFromValidation(): void {
    if (!this.validatedReservationMatch) {
      return;
    }

    void this.openTicketPreview(this.validatedReservationMatch);
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
    this.validatedReservationMatch = null;
    this.errorMessage = '';
  }

  get isScannerSupported(): boolean {
    return typeof window !== 'undefined'
      && typeof navigator !== 'undefined'
      && !!navigator.mediaDevices
      && !!navigator.mediaDevices.getUserMedia;
  }

  async openScanner(): Promise<void> {
    this.scannerOpen = true;
    this.scannerErrorMessage = '';
    this.errorMessage = '';
    this.ticketValidationResult = null;
    this.validatedReservationMatch = null;

    if (!this.isScannerSupported) {
      this.scannerErrorMessage = 'Camera access is not available in this browser.';
      return;
    }

    this.scannerStarting = true;

    try {
      this.scannerStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });

      setTimeout(() => {
        const videoElement = this.scannerVideo?.nativeElement;
        if (!videoElement || !this.scannerStream) {
          this.scannerErrorMessage = 'Unable to initialise the scanner preview.';
          this.scannerStarting = false;
          return;
        }

        videoElement.srcObject = this.scannerStream;
        videoElement.play().then(() => {
          this.scannerStarting = false;
          this.scanFrameWithJsQR();
        }).catch(() => {
          this.scannerErrorMessage = 'Unable to play camera feed.';
          this.scannerStarting = false;
        });
      }, 100);
    } catch (error) {
      this.scannerStarting = false;
      this.scannerErrorMessage = this.extractErrorMessage(error, 'Unable to access the camera.');
      this.stopScanner();
    }
  }

  closeScanner(): void {
    this.scannerOpen = false;
    this.scannerErrorMessage = '';
    this.stopScanner();
  }

  approveReservation(reservation: Reservation): void {
    this.approvingId = reservation.id;
    this.approveErrorMessage = '';
    this.transportService.approveReservation(reservation.id)
      .pipe(finalize(() => this.approvingId = null))
      .subscribe({
        next: () => this.loadReservations(),
        error: (error) => {
          this.approveErrorMessage = this.extractErrorMessage(error, 'Unable to approve reservation.');
        }
      });
  }

  rejectReservation(reservation: Reservation): void {
    this.rejectingId = reservation.id;
    this.approveErrorMessage = '';
    this.transportService.rejectReservation(reservation.id)
      .pipe(finalize(() => this.rejectingId = null))
      .subscribe({
        next: () => this.loadReservations(),
        error: (error) => {
          this.approveErrorMessage = this.extractErrorMessage(error, 'Unable to reject reservation.');
        }
      });
  }

  private scanFrameWithJsQR(): void {
    if (!this.scannerOpen) return;

    const video = this.scannerVideo?.nativeElement;
    const canvas = this.scannerCanvas?.nativeElement;

    if (!video || !canvas || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      this.queueNextFrame();
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      this.queueNextFrame();
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const qrResult = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert'
    });

    if (qrResult && qrResult.data) {
      this.ticketValidationCode = this.normalizeTicketCodeInput(qrResult.data);
      this.closeScanner();
      this.validateTicketCode(this.ticketValidationCode);
      return;
    }

    this.queueNextFrame();
  }

  private queueNextFrame(): void {
    this.scannerAnimationFrameId = window.requestAnimationFrame(() => {
      this.scanFrameWithJsQR();
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
  }

  private extractErrorMessage(error: any, fallback: string): string {
    if (!error) return fallback;
    if (typeof error.error === 'string' && error.error.trim()) return error.error;
    if (error.error?.message) return error.error.message;
    if (error.message) return error.message;
    return fallback;
  }

  private buildReservationSearchHaystack(reservation: Reservation): string {
    return [
      this.getReservationTicketCode(reservation),
      reservation.userFullName,
      reservation.userEmail,
      reservation.transportRoute,
      reservation.boardingPoint,
      reservation.transportDeparturePoint,
      reservation.status,
      this.getStatusLabel(reservation.status),
      reservation.transportWeather,
      this.getWeatherLabel(reservation.transportWeather)
    ].join(' ').toLowerCase();
  }

  private validateTicketCode(ticketCode: string): void {
    const normalizedCode = this.normalizeTicketCodeInput(ticketCode);
    if (!normalizedCode) {
      this.errorMessage = 'Please enter a ticket code to validate.';
      this.ticketValidationResult = null;
      this.validatedReservationMatch = null;
      return;
    }

    this.validatingTicket = true;
    this.errorMessage = '';
    this.ticketValidationResult = null;
    this.validatedReservationMatch = null;
    this.ticketValidationCode = normalizedCode;

    this.transportService.validateReservationTicket(normalizedCode)
      .pipe(finalize(() => this.validatingTicket = false))
      .subscribe({
        next: (response) => {
          this.ticketValidationResult = response;
          this.handleValidationResult(response);
        },
        error: (error) => {
          const response = error?.error ?? null;
          this.ticketValidationResult = response;
          this.handleValidationResult(response);
          this.errorMessage = this.extractErrorMessage(error, 'Unable to validate the ticket right now.');
        }
      });
  }

  private normalizeTicketCodeInput(value: string): string {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return '';
    }

    if (trimmedValue.startsWith('{')) {
      try {
        const parsedValue = JSON.parse(trimmedValue) as { ticketCode?: unknown };
        if (typeof parsedValue.ticketCode === 'string' && parsedValue.ticketCode.trim()) {
          return parsedValue.ticketCode.trim();
        }
      } catch {
        // Keep the raw value when it is not a valid JSON QR payload.
      }
    }

    return trimmedValue;
  }

  private handleValidationResult(result: ReservationTicketValidationResponse | null): void {
    if (!result) {
      this.validatedReservationMatch = null;
      return;
    }

    this.validatedReservationMatch = this.findReservationFromValidationResult(result);
    this.trackValidationResult(result);

    if (this.validatedReservationMatch?.id != null) {
      this.highlightReservation(this.validatedReservationMatch.id);
    }
  }

  private trackValidationResult(result: ReservationTicketValidationResponse): void {
    const key = result.reservationId || result.ticketCode || `${result.valid}-${result.message}`;

    this.recentValidationResults = [
      result,
      ...this.recentValidationResults.filter((item) =>
        (item.reservationId || item.ticketCode || `${item.valid}-${item.message}`) !== key
      )
    ].slice(0, 5);
  }

  confirmDelete(reservation: Reservation): void {
  const confirmAction = confirm(
    `⚠️ Are you sure you want to delete this reservation?\n\n${reservation.transportRoute}`
  );

  if (confirmAction) {
    this.requestDeleteReservation(reservation);
  }
}
  private findReservationFromValidationResult(result: ReservationTicketValidationResponse): Reservation | null {
    if (result.reservationId != null) {
      const matchedById = this.reservations.find((reservation) => reservation.id === result.reservationId);
      if (matchedById) {
        return matchedById;
      }
    }

    if (result.ticketCode) {
      const matchedByTicket = this.reservations.find((reservation) =>
        this.getReservationTicketCode(reservation) === result.ticketCode
      );

      if (matchedByTicket) {
        return matchedByTicket;
      }
    }

    return null;
  }

  private highlightReservation(reservationId: number): void {
    this.highlightedReservationId = reservationId;

    if (this.highlightTimeoutId) {
      clearTimeout(this.highlightTimeoutId);
    }

    this.highlightTimeoutId = setTimeout(() => {
      this.highlightedReservationId = null;
      this.highlightTimeoutId = null;
    }, 3500);
  }

  private getTimeframeForReservation(reservation: Reservation): Exclude<ReservationTimeframe, 'ALL'> {
    const operationalDate = this.getOperationalDate(reservation);
    if (!operationalDate) {
      return 'PAST';
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    if (operationalDate >= startOfToday && operationalDate < startOfTomorrow) {
      return 'TODAY';
    }

    if (operationalDate >= startOfTomorrow) {
      return 'UPCOMING';
    }

    return 'PAST';
  }

  private getOperationalDate(reservation: Reservation): Date | null {
    const rawValue = reservation.transportDepartureDate || reservation.reservationDate;
    if (!rawValue) {
      return null;
    }

    const parsedDate = new Date(rawValue);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  private compareReservations(
    left: Reservation,
    right: Reservation,
    timeframe: Exclude<ReservationTimeframe, 'ALL'>
  ): number {
    const leftTime = this.getOperationalDate(left)?.getTime() ?? 0;
    const rightTime = this.getOperationalDate(right)?.getTime() ?? 0;

    if (timeframe === 'PAST') {
      return rightTime - leftTime;
    }

    return leftTime - rightTime;
  }

  private resetGroupPages(): void {
    this.groupPages = { ...this.defaultGroupPages };
  }

  private clampGroupPage(
    groupKey: Exclude<ReservationTimeframe, 'ALL'>,
    page: number,
    totalItems: number
  ): number {
    const totalPages = Math.max(1, Math.ceil(totalItems / this.listPageSize));
    const normalized = Math.min(Math.max(page || 1, 1), totalPages);
    this.groupPages[groupKey] = normalized;
    return normalized;
  }

  private clampPendingPage(page: number, totalItems: number): number {
    const totalPages = Math.max(1, Math.ceil(totalItems / this.listPageSize));
    return Math.min(Math.max(page || 1, 1), totalPages);
  }
}
