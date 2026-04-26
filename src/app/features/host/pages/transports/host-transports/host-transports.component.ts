import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { Reservation } from '../../../../tourist/models/reservation.model';
import { Trajet } from '../../../../tourist/models/trajet.model';
import { Station } from '../../../../tourist/models/station.model';
import { TrafficCongestionLevel, Transport } from '../../../../tourist/models/transport.model';
import {
  HostTransportAiReport,
  TransportAiDelayModelSummary,
  TransportAiAlert,
  TransportAiDatasetSummary,
  TransportService,
  WeatherPreview
} from '../../../../tourist/services/transport.service';
import {
  getCompactLocationText,
  getCompactPlaceTitle,
  getCompactRouteLabel,
  getCompactRouteText
} from '../../../../../shared/utils/location-display.util';

@Component({
  selector: 'app-host-transports',
  templateUrl: './host-transports.component.html',
  styleUrls: ['./host-transports.component.css']
})
export class HostTransportsComponent implements OnInit {
  transports: Transport[] = [];
  reservations: Reservation[] = [];
  trajets: Trajet[] = [];
  stations: Station[] = [];
  searchTerm = '';
  transportForm!: FormGroup;
  selectedTransport: Transport | null = null;
  transportToDelete: Transport | null = null;
  aiAlerts: TransportAiAlert[] = [];
  aiReport: HostTransportAiReport | null = null;
  aiModelSummary: TransportAiDelayModelSummary | null = null;
  aiDatasetSummary: TransportAiDatasetSummary | null = null;

  loading = false;
  trajetsLoading = false;
  saving = false;
  aiInsightsLoading = false;
  aiPanelExpanded = false;
  errorMessage = '';
  successMessage = '';
  aiInsightsErrorMessage = '';
  aiInsightsNoticeMessage = '';
  private successTimeoutId: ReturnType<typeof setTimeout> | null = null;
  currentPage = 1;
  readonly pageSize = 4;
  readonly alertPreviewCount = 2;
  readonly recommendationPreviewCount = 2;
  readonly minimumDatasetRows = 1000;

  readonly WEATHER_OPTIONS = ['SUNNY', 'RAIN', 'STORM', 'SANDSTORM'];
  readonly STATUS_OPTIONS = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
  readonly TRAFFIC_CONGESTION_OPTIONS: Array<{
    value: TrafficCongestionLevel;
    label: string;
    hint: string;
  }> = [
    { value: 'NONE', label: 'No congestion', hint: 'Use when the route is expected to stay fluid.' },
    { value: 'LOW', label: 'Low congestion', hint: 'Minor slowdowns, usually short queues or light city traffic.' },
    { value: 'MEDIUM', label: 'Medium congestion', hint: 'Noticeable congestion with moderate impact on arrival.' },
    { value: 'HIGH', label: 'High congestion', hint: 'Heavy traffic likely to push the departure noticeably.' }
  ];

  minDateTime = '';

  weatherPreview: WeatherPreview | null = null;

  constructor(
    private transportService: TransportService,
    private fb: FormBuilder,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.updateMinDateTime();
    this.initForm();
    this.loadStations();
    this.loadTrajets();
    this.loadTransports();
    this.loadReservations();
    this.setupTrajetAutoFill();
    this.setupWeatherPreviewAutoLoad();
    this.loadAiInsights();
  }

  updateMinDateTime(): void {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);
    const offset = now.getTimezoneOffset();
    const localDate = new Date(now.getTime() - offset * 60000);
    this.minDateTime = localDate.toISOString().slice(0, 16);
  }

  initForm(): void {
    this.transportForm = this.fb.group({
      departurePoint: [
        { value: '', disabled: true },
        [Validators.required, Validators.minLength(2), Validators.maxLength(150)]
      ],
      departureDate: ['', [Validators.required, this.futureDateValidator]],
      totalCapacity: [10, [Validators.required, Validators.min(1), Validators.max(100)]],
      basePrice: [1, [Validators.required, Validators.min(0.01)]],
      trajetId: ['', Validators.required],
      weather: ['SUNNY'],
      trafficCongestionLevel: ['NONE'],
      status: ['SCHEDULED', Validators.required],
      actualDelayMinutes: [null, [Validators.min(0), Validators.max(720)]]
    });
  }

  futureDateValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;

    const selectedDate = new Date(control.value);
    const now = new Date();

    if (selectedDate <= now) {
      return { notFuture: true };
    }

    return null;
  }

  setupTrajetAutoFill(): void {
    this.transportForm.get('trajetId')?.valueChanges.subscribe((id) => {
      const trajetId = Number(id);
      const trajet = this.trajets.find((item) => item.id === trajetId);

      this.transportForm.patchValue({
        departurePoint: this.getTrajetDeparturePoint(trajet) || ''
      }, { emitEvent: false });
    });
  }

  setupWeatherPreviewAutoLoad(): void {
    this.transportForm.get('trajetId')?.valueChanges.subscribe(() => {
      this.tryLoadWeatherPreview();
    });

    this.transportForm.get('departureDate')?.valueChanges.subscribe(() => {
      this.tryLoadWeatherPreview();
    });

    this.transportForm.get('trafficCongestionLevel')?.valueChanges.subscribe(() => {
      this.tryLoadWeatherPreview();
    });

    this.transportForm.get('status')?.valueChanges.subscribe(() => {
      this.applyDepartureDateValidators();
    });
  }

  tryLoadWeatherPreview(): void {
    const raw = this.transportForm.getRawValue();

    if (!raw.trajetId || !raw.departureDate) {
      this.weatherPreview = null;
      return;
    }

    this.transportService.getWeatherPreview(
      Number(raw.trajetId),
      this.toBackendDateTime(raw.departureDate),
      this.normalizeTrafficCongestionLevel(raw.trafficCongestionLevel)
    ).subscribe({
      next: (preview) => {
        this.transportForm.patchValue({
          weather: preview.weather || 'SUNNY'
        }, { emitEvent: false });

        this.weatherPreview = preview;
      },
      error: (error) => {
        console.error('[HostTransportsComponent] weather preview error:', error);
        this.weatherPreview = null;
      }
    });
  }

  loadTrajets(): void {
    this.trajetsLoading = true;

    this.transportService.getTrajets()
      .pipe(finalize(() => this.trajetsLoading = false))
      .subscribe({
      next: (data: Trajet[]) => {
        this.errorMessage = '';
        this.trajets = [...data].sort((a, b) => (b.id ?? 0) - (a.id ?? 0));

        const selectedId = Number(this.transportForm.get('trajetId')?.value);
        if (selectedId) {
            const trajet = this.trajets.find((item) => item.id === selectedId);
            if (trajet) {
              this.transportForm.patchValue({
                departurePoint: this.getTrajetDeparturePoint(trajet) || ''
              }, { emitEvent: false });
            }
          }
        },
        error: (error: any) => {
          console.error('[HostTransportsComponent] loadTrajets error:', error);
          this.trajets = [];
        }
      });
  }

  loadStations(): void {
    this.transportService.getStations().subscribe({
      next: (data: Station[]) => {
        this.stations = data;
      },
      error: (error: any) => {
        console.error('[HostTransportsComponent] loadStations error:', error);
      }
    });
  }

  loadTransports(): void {
    this.loading = true;

    this.transportService.getAllTransports()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (data: Transport[]) => {
          this.errorMessage = '';
          this.transports = [...data].sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
          this.currentPage = 1;
        },
        error: (error: any) => {
          console.error('[HostTransportsComponent] loadTransports error:', error);
          this.transports = [];
          this.currentPage = 1;
        }
      });
  }

  loadReservations(): void {
    this.transportService.getAllReservations().subscribe({
      next: (data: Reservation[]) => {
        this.reservations = data;
      },
      error: (error: any) => {
        console.error('[HostTransportsComponent] loadReservations error:', error);
      }
    });
  }

  getTrajetLabel(trajet: Trajet): string {
    const departureStation = this.stations.find((station) => station.id === trajet.departureStationId);
    const arrivalStation = this.stations.find((station) => station.id === trajet.arrivalStationId);

    return getCompactRouteLabel(
      trajet.departureStationName || departureStation?.name,
      departureStation?.city,
      trajet.arrivalStationName || arrivalStation?.name,
      arrivalStation?.city
    );
  }

  getFullTrajetLabel(trajet: Trajet): string {
    return `${trajet.departureStationName || 'N/A'} -> ${trajet.arrivalStationName || 'N/A'}`;
  }

  get selectedTrajetSummary(): string {
    const trajetId = Number(this.transportForm.get('trajetId')?.value);
    const trajet = this.getTrajetById(trajetId);

    if (!trajet) {
      return 'Select an existing route from the list. If it does not exist yet, create it first in the Routes tab.';
    }

    return `${this.getTrajetLabel(trajet)} | ${trajet.distanceKm} km | ${trajet.estimatedDurationMinutes} min`;
  }

  getTrajetById(trajetId?: number): Trajet | undefined {
    return this.trajets.find((item) => item.id === trajetId);
  }

  getStationLatitude(stationId?: number): number | null {
    if (!stationId) return null;
    return this.stations.find((item) => item.id === stationId)?.latitude ?? null;
  }

  getStationLongitude(stationId?: number): number | null {
    if (!stationId) return null;
    return this.stations.find((item) => item.id === stationId)?.longitude ?? null;
  }

  editTransport(transport: Transport): void {
    this.selectedTransport = transport;
    this.errorMessage = '';
    this.successMessage = '';

    this.transportForm.patchValue({
      departurePoint: transport.departurePoint || '',
      departureDate: this.formatForDateTimeLocal(transport.departureDate),
      totalCapacity: transport.totalCapacity ?? 10,
      basePrice: transport.basePrice ?? 1,
      trajetId: transport.trajetId ?? '',
      weather: transport.weather || 'SUNNY',
      trafficCongestionLevel: this.resolveTrafficCongestionLevel(transport),
      status: transport.status || 'SCHEDULED',
      actualDelayMinutes: transport.actualDelayMinutes ?? null
    });
    this.applyDepartureDateValidators();

    const trajet = this.trajets.find((item) => item.id === Number(transport.trajetId));
    if (trajet) {
      this.transportForm.patchValue({
        departurePoint: this.getTrajetDeparturePoint(trajet) || this.getCompactDeparturePoint(transport)
      }, { emitEvent: false });
    }

    this.weatherPreview = {
      weather: transport.weather || 'SUNNY',
      weatherSource: 'AUTO',
      routingSource: trajet?.routeGeoJson ? 'OSRM' : 'ROUTE_BASELINE',
      weatherTemperature: transport.weatherTemperature ?? null,
      weatherWindSpeed: transport.weatherWindSpeed ?? null,
      weatherPrecipitation: transport.weatherPrecipitation ?? null,
      routeDistanceKm: trajet?.distanceKm ?? null,
      estimatedDurationMinutes: trajet?.estimatedDurationMinutes ?? null,
      trafficCongestionLevel: this.resolveTrafficCongestionLevel(transport),
      trafficDelayMinutes: this.getTrafficDelayMinutesForLevel(this.resolveTrafficCongestionLevel(transport)),
      delayMinutes: transport.delayMinutes ?? null
    };

    this.tryLoadWeatherPreview();
  }

  resetForm(): void {
    this.selectedTransport = null;
    this.errorMessage = '';
    this.successMessage = '';
    this.weatherPreview = null;

    this.transportForm.reset({
      departurePoint: '',
      departureDate: '',
      totalCapacity: 10,
      basePrice: 1,
      trajetId: '',
      weather: 'SUNNY',
      trafficCongestionLevel: 'NONE',
      status: 'SCHEDULED',
      actualDelayMinutes: null
    });
    this.applyDepartureDateValidators();
  }

  submitTransport(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.transportForm.invalid) {
      this.transportForm.markAllAsTouched();
      this.errorMessage = 'Please fix the highlighted fields.';
      return;
    }

    const raw = this.transportForm.getRawValue();
    const trajetExists = this.trajets.some((trajet) => trajet.id === Number(raw.trajetId));

    if (!trajetExists) {
      this.errorMessage = 'Invalid route. Please select another one.';
      return;
    }

    if (!raw.departurePoint || raw.departurePoint.trim().length < 2) {
      this.errorMessage = 'Departure point is required. Please choose a valid route.';
      return;
    }

    if (raw.status === 'COMPLETED' && (raw.actualDelayMinutes === null || raw.actualDelayMinutes === '')) {
      this.errorMessage = 'Actual delay is required for completed transports so the AI model can train on your real data.';
      return;
    }

    this.saving = true;

    const trafficCongestionLevel = this.normalizeTrafficCongestionLevel(raw.trafficCongestionLevel);
    const payload: Partial<Transport> = {
      departurePoint: raw.departurePoint.trim(),
      departureDate: this.toBackendDateTime(raw.departureDate),
      totalCapacity: Number(raw.totalCapacity),
      basePrice: Number(raw.basePrice),
      trajetId: Number(raw.trajetId),
      weather: raw.weather || 'SUNNY',
      weatherSource: 'AUTO',
      trafficJam: trafficCongestionLevel !== 'NONE',
      trafficCongestionLevel,
      status: raw.status,
      actualDelayMinutes: raw.status === 'COMPLETED' && raw.actualDelayMinutes !== null && raw.actualDelayMinutes !== ''
        ? Number(raw.actualDelayMinutes)
        : null
    };

    const request$ = this.selectedTransport
      ? this.transportService.updateTransport(this.selectedTransport.id!, payload)
      : this.transportService.createTransport(payload);

    request$
      .pipe(finalize(() => this.saving = false))
      .subscribe({
        next: () => {
          const wasEditing = !!this.selectedTransport;
          this.resetForm();
          this.showSuccessMessage(wasEditing ? 'Transport updated successfully.' : 'Transport created successfully.');
          this.loadTransports();
          this.loadAiInsights();
        },
        error: (error: any) => {
          console.error('[HostTransportsComponent] submitTransport error:', error);

          if (error?.error && typeof error.error === 'object') {
            const backendErrors = Object.values(error.error).join(', ');
            this.errorMessage = backendErrors || 'Saving failed.';
          } else {
            this.errorMessage = error?.error?.message || error?.error || 'Failed to save the transport.';
          }
        }
      });
  }

  hasError(controlName: string): boolean {
    const control = this.transportForm.get(controlName);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  getFieldError(controlName: string): string {
    const control = this.transportForm.get(controlName);

    if (!control || !control.errors || !(control.touched || control.dirty)) {
      return '';
    }

    if (controlName === 'trajetId' && control.errors['required']) {
      return 'Route is required.';
    }

    if (controlName === 'departurePoint') {
      if (control.errors['required']) return 'Departure point is required.';
      if (control.errors['minlength']) return 'Departure point must contain at least 2 characters.';
      if (control.errors['maxlength']) return 'Departure point must not exceed 150 characters.';
    }

    if (controlName === 'departureDate') {
      if (control.errors['required']) return 'Departure date is required.';
      if (control.errors['notFuture']) return 'Departure date must be in the future.';
    }

    if (controlName === 'totalCapacity') {
      if (control.errors['required']) return 'Capacity is required.';
      if (control.errors['min']) return 'Capacity must be at least 1 seat.';
      if (control.errors['max']) return 'Capacity must not exceed 100 seats.';
    }

    if (controlName === 'basePrice') {
      if (control.errors['required']) return 'Base price is required.';
      if (control.errors['min']) return 'Base price must be at least 0.01 DT.';
    }

    if (controlName === 'status' && control.errors['required']) {
      return 'Status is required.';
    }

    if (controlName === 'actualDelayMinutes') {
      if (control.errors['min']) return 'Actual delay must be 0 minutes or more.';
      if (control.errors['max']) return 'Actual delay must not exceed 720 minutes.';
    }

    return '';
  }

  requestDeleteTransport(transport: Transport): void {
    this.transportToDelete = transport;
    this.errorMessage = '';
  }

  cancelDeleteTransport(): void {
    this.transportToDelete = null;
  }

  deleteTransport(): void {
    if (!this.transportToDelete) return;

    const transportId = this.transportToDelete.id!;

    this.transportService.deleteTransport(transportId).subscribe({
      next: () => {
        this.transportToDelete = null;
        this.showSuccessMessage('Transport deleted successfully.');
        this.loadTransports();
        this.loadAiInsights();
      },
      error: (error: any) => {
        console.error('[HostTransportsComponent] deleteTransport error:', error);
        this.errorMessage = error?.error?.message || 'Failed to delete the transport.';
      }
    });
  }

  get filteredTransportsList(): Transport[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.transports;

    return this.transports.filter((transport) => {
      const trajet = this.getTrajetById(transport.trajetId);
      const departureStation = this.stations.find((station) => station.id === trajet?.departureStationId);
      const arrivalStation = this.stations.find((station) => station.id === trajet?.arrivalStationId);

      return `${transport.departurePoint} ${transport.trajetDescription} ${transport.status} ${transport.weather} ${transport.trafficCongestionLevel || ''} ${this.getTransportOperationalLabel(transport)} ${departureStation?.name || ''} ${departureStation?.city || ''} ${arrivalStation?.name || ''} ${arrivalStation?.city || ''} ${transport.basePrice}`
        .toLowerCase()
        .includes(term);
    });
  }

  get visibleAiAlerts(): TransportAiAlert[] {
    return this.aiAlerts.slice(0, this.alertPreviewCount);
  }

  get hiddenAiAlertsCount(): number {
    return Math.max(0, this.aiAlerts.length - this.visibleAiAlerts.length);
  }

  get criticalAiAlertsCount(): number {
    return this.aiAlerts.filter((alert) => alert.severity === 'CRITICAL').length;
  }

  get warningAiAlertsCount(): number {
    return this.aiAlerts.filter((alert) => alert.severity === 'WARNING').length;
  }

  get visibleRecommendations(): string[] {
    return this.aiReport?.recommendations?.slice(0, this.recommendationPreviewCount) ?? [];
  }

  get datasetTripRecordCount(): number {
    return Number(this.aiDatasetSummary?.trainingReadyTripRecords ?? 0);
  }

  get realDatasetTripRecordCount(): number {
    return Number(this.aiDatasetSummary?.realTrainingReadyTripRecords ?? 0);
  }

  get bootstrapDatasetTripRecordCount(): number {
    return Number(this.aiDatasetSummary?.bootstrapTrainingReadyTripRecords ?? 0);
  }

  get syncedTripRecordCount(): number {
    return Number(this.aiDatasetSummary?.tripRecords ?? 0);
  }

  get remainingDatasetRows(): number {
    return Math.max(0, this.minimumDatasetRows - this.datasetTripRecordCount);
  }

  get hasMinimumDatasetRows(): boolean {
    return this.datasetTripRecordCount >= this.minimumDatasetRows;
  }

  get isCompletedStatusSelected(): boolean {
    return this.transportForm.get('status')?.value === 'COMPLETED';
  }

  getCompactDeparturePoint(transport: Transport): string {
    const trajet = this.getTrajetById(transport.trajetId);
    if (trajet) {
      return this.getTrajetDeparturePoint(trajet) || getCompactLocationText(transport.departurePoint);
    }

    return getCompactLocationText(transport.departurePoint) || 'N/A';
  }

  getCompactTransportRoute(transport: Transport): string {
    const trajet = this.getTrajetById(transport.trajetId);
    if (trajet) {
      return this.getTrajetLabel(trajet);
    }

    return transport.trajetDescription ? getCompactRouteText(transport.trajetDescription) : 'No route details';
  }

  getTransportBookingCount(transport: Transport): number {
    return this.getActiveReservationsForTransport(transport.id).length;
  }

  getBookedSeats(transport: Transport): number {
    return this.getActiveReservationsForTransport(transport.id)
      .reduce((total, reservation) => total + (reservation.reservedSeats || 0), 0);
  }

  getOccupancyRate(transport: Transport): number {
    if (!transport.totalCapacity) {
      return 0;
    }

    return Math.min(100, Math.round((this.getBookedSeats(transport) / transport.totalCapacity) * 100));
  }

  getTransportRevenue(transport: Transport): number {
    return this.getActiveReservationsForTransport(transport.id)
      .reduce((total, reservation) => total + (reservation.totalPrice || 0), 0);
  }

  getTransportOperationalLabel(transport: Transport): string {
    if (transport.status === 'CANCELLED') {
      return 'Cancelled';
    }

    if (transport.status === 'COMPLETED') {
      return 'Completed';
    }

    if ((transport.delayMinutes || 0) > 0) {
      return `ETA +${transport.delayMinutes} min`;
    }

    if (this.getOccupancyRate(transport) >= 100 || transport.availableSeats <= 0) {
      return 'Full';
    }

    if (this.getOccupancyRate(transport) >= 80) {
      return 'Almost full';
    }

    if (transport.status === 'IN_PROGRESS') {
      return 'Boarding';
    }

    return 'On track';
  }

  getStatusLabel(status?: string | null): string {
    switch (status) {
      case 'SCHEDULED':
        return 'Scheduled';
      case 'IN_PROGRESS':
        return 'In progress';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status || 'Unknown';
    }
  }

  getTransportOperationalClass(transport: Transport): string {
    if (transport.status === 'CANCELLED') {
      return 'operational-pill--cancelled';
    }

    if (transport.status === 'COMPLETED') {
      return 'operational-pill--completed';
    }

    if ((transport.delayMinutes || 0) > 0) {
      return 'operational-pill--delayed';
    }

    if (this.getOccupancyRate(transport) >= 100 || transport.availableSeats <= 0) {
      return 'operational-pill--full';
    }

    if (this.getOccupancyRate(transport) >= 80) {
      return 'operational-pill--almost-full';
    }

    if (transport.status === 'IN_PROGRESS') {
      return 'operational-pill--boarding';
    }

    return 'operational-pill--on-track';
  }

  openTransportBookings(transport: Transport): void {
    if (transport.id == null) {
      return;
    }

    void this.router.navigate(['/host/bookings'], {
      queryParams: { transportId: transport.id }
    });
  }

  openTransportBookingsById(transportId?: number): void {
    if (transportId == null) {
      return;
    }

    void this.router.navigate(['/host/bookings'], {
      queryParams: { transportId }
    });
  }

  openBookingsBoard(): void {
    void this.router.navigate(['/host/bookings']);
  }

  getTransportConditionsTitle(transport: Transport): string {
    if (transport.status === 'CANCELLED') {
      return 'Cancelled';
    }

    if (transport.status === 'COMPLETED' && transport.actualDelayMinutes != null) {
      return transport.actualDelayMinutes > 0
        ? `Actual delay +${transport.actualDelayMinutes} min`
        : 'Completed on time';
    }

    if ((transport.delayMinutes || 0) > 0) {
      return `ETA +${transport.delayMinutes} min`;
    }

    if (transport.weather === 'STORM' || transport.weather === 'SANDSTORM') {
      return transport.weather;
    }

    const trafficLevel = this.resolveTrafficCongestionLevel(transport);
    if (trafficLevel !== 'NONE') {
      return `${this.getTrafficCongestionLabel(trafficLevel)} congestion`;
    }

    return transport.weather || 'Stable';
  }

  getTransportConditionsHint(transport: Transport): string {
    if (transport.status === 'CANCELLED') {
      return 'Passenger follow-up required.';
    }

    if (transport.status === 'COMPLETED' && transport.actualDelayMinutes != null) {
      return 'Recorded from the completed transport and used for AI training.';
    }

    if (transport.weather === 'STORM' || transport.weather === 'SANDSTORM') {
      return 'High disruption risk before departure.';
    }

    if ((transport.delayMinutes || 0) > 0) {
      return 'Estimated delay from weather, route duration, congestion, and local AI.';
    }

    const trafficLevel = this.resolveTrafficCongestionLevel(transport);
    if (trafficLevel !== 'NONE') {
      return `${this.getTrafficCongestionLabel(trafficLevel)} congestion is included in the ETA estimate.`;
    }

    if (transport.weatherTemperature != null) {
      return `${transport.weatherTemperature.toFixed(1)} deg C forecast`;
    }

    return 'No major disruption detected.';
  }

  getAlertSeverityClass(severity?: string | null): string {
    switch (severity) {
      case 'CRITICAL':
        return 'ai-alert-card ai-alert-card--critical';
      case 'WARNING':
        return 'ai-alert-card ai-alert-card--warning';
      default:
        return 'ai-alert-card ai-alert-card--info';
    }
  }

  private getTrajetDeparturePoint(trajet?: Trajet): string {
    if (!trajet) {
      return '';
    }

    const departureStation = this.stations.find((station) => station.id === trajet.departureStationId);
    return getCompactPlaceTitle(trajet.departureStationName || departureStation?.name, departureStation?.city);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredTransportsList.length / this.pageSize));
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
  }

  get paginatedTransports(): Transport[] {
    const currentPage = this.clampPage(this.currentPage, this.totalPages);
    if (currentPage !== this.currentPage) {
      this.currentPage = currentPage;
    }

    const start = (currentPage - 1) * this.pageSize;
    return this.filteredTransportsList.slice(start, start + this.pageSize);
  }

  onSearchChange(): void {
    this.currentPage = 1;
  }

  goToPage(page: number): void {
    this.currentPage = this.clampPage(page, this.totalPages);
  }

  private showSuccessMessage(message: string): void {
    if (this.successTimeoutId) clearTimeout(this.successTimeoutId);
    this.successMessage = message;
    this.successTimeoutId = setTimeout(() => {
      this.successMessage = '';
      this.successTimeoutId = null;
    }, 3000);
  }

  private formatForDateTimeLocal(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60000);
    return localDate.toISOString().slice(0, 16);
  }

  private toBackendDateTime(dateTimeLocal: string): string {
    if (!dateTimeLocal) return '';
    return dateTimeLocal.length === 16 ? `${dateTimeLocal}:00` : dateTimeLocal;
  }

  private getActiveReservationsForTransport(transportId?: number): Reservation[] {
    if (transportId == null) {
      return [];
    }

    return this.reservations.filter((reservation) =>
      reservation.transportId === transportId && reservation.status !== 'CANCELLED'
    );
  }

  private clampPage(page: number, totalPages: number): number {
    return Math.min(Math.max(page, 1), totalPages);
  }

  resolveTrafficCongestionLevel(transport?: Partial<Transport> | null): TrafficCongestionLevel {
    const rawLevel = transport?.trafficCongestionLevel;
    if (rawLevel === 'LOW' || rawLevel === 'MEDIUM' || rawLevel === 'HIGH' || rawLevel === 'NONE') {
      return rawLevel;
    }
    return transport?.trafficJam ? 'MEDIUM' : 'NONE';
  }

  normalizeTrafficCongestionLevel(value: unknown): TrafficCongestionLevel {
    return value === 'LOW' || value === 'MEDIUM' || value === 'HIGH' ? value : 'NONE';
  }

  getTrafficCongestionLabel(level: TrafficCongestionLevel): string {
    switch (level) {
      case 'LOW':
        return 'Low';
      case 'MEDIUM':
        return 'Medium';
      case 'HIGH':
        return 'High';
      default:
        return 'No';
    }
  }

  getTrafficCongestionHint(level: TrafficCongestionLevel): string {
    const option = this.TRAFFIC_CONGESTION_OPTIONS.find((entry) => entry.value === level);
    return option?.hint ?? this.TRAFFIC_CONGESTION_OPTIONS[0].hint;
  }

  getTrafficDelayMinutesForLevel(level: TrafficCongestionLevel): number {
    switch (level) {
      case 'LOW':
        return 5;
      case 'MEDIUM':
        return 15;
      case 'HIGH':
        return 30;
      default:
        return 0;
    }
  }

  getWeatherSourceLabel(source?: string | null): string {
    return source === 'AUTO' ? 'Automatic forecast' : 'Manual';
  }

  getRoutingSourceLabel(source?: string | null): string {
    return source === 'OSRM' ? 'Mapped route' : 'Route baseline';
  }

  private applyDepartureDateValidators(): void {
    const control = this.transportForm.get('departureDate');
    if (!control) {
      return;
    }

    control.setValidators(this.requiresFutureDepartureDate()
      ? [Validators.required, this.futureDateValidator]
      : [Validators.required]);
    control.updateValueAndValidity({ emitEvent: false });
  }

  private requiresFutureDepartureDate(): boolean {
    const status = this.transportForm.get('status')?.value;
    return status === 'SCHEDULED' || status === 'IN_PROGRESS';
  }

  private loadAiInsights(): void {
    this.aiInsightsLoading = true;
    this.aiInsightsErrorMessage = '';
    this.aiInsightsNoticeMessage = '';

    forkJoin({
      alerts: this.transportService.getHostAiAlerts(),
      report: this.transportService.getHostAiReport(),
      model: this.transportService.getHostAiModelSummary(),
      dataset: this.transportService.getHostAiDatasetSummary()
    })
      .pipe(finalize(() => (this.aiInsightsLoading = false)))
      .subscribe({
        next: ({ alerts, report, model, dataset }) => {
          this.aiInsightsErrorMessage = '';
          this.aiAlerts = alerts;
          this.aiReport = report;
          this.aiModelSummary = model;
          this.aiDatasetSummary = dataset;
          this.updateDatasetNoticeMessage();
        },
        error: (error) => {
          console.error('[HostTransportsComponent] AI insights error:', error);
          this.aiAlerts = [];
          this.aiReport = null;
          this.aiModelSummary = null;
          this.aiDatasetSummary = null;
          this.aiInsightsErrorMessage = '';
          this.aiInsightsNoticeMessage = '';
        }
      });
  }

  private updateDatasetNoticeMessage(): void {
    if (!this.aiDatasetSummary) {
      this.aiInsightsNoticeMessage = '';
      return;
    }

    if (this.datasetTripRecordCount <= 0) {
      this.aiInsightsNoticeMessage = `No training-ready trip rows are available yet. Record the actual delay on completed transports. The target dataset for model training is ${this.minimumDatasetRows} rows.`;
      return;
    }

    if (this.realDatasetTripRecordCount < this.minimumDatasetRows && this.bootstrapDatasetTripRecordCount > 0) {
      this.aiInsightsNoticeMessage = `Real transport history is still limited: ${this.realDatasetTripRecordCount} real labeled rows and ${this.bootstrapDatasetTripRecordCount} bootstrap rows. Keep adding completed transports with actual delay values so the model can move toward fully real training data.`;
      return;
    }

    if (!this.hasMinimumDatasetRows) {
      this.aiInsightsNoticeMessage = `Training dataset progress: ${this.datasetTripRecordCount} labeled trip rows ready out of ${this.syncedTripRecordCount} synced rows. Add ${this.remainingDatasetRows} more to reach the ${this.minimumDatasetRows}-row target.`;
      return;
    }

    this.aiInsightsNoticeMessage = '';
  }
}
