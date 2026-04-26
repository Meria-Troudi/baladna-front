import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, finalize, takeUntil } from 'rxjs/operators';

import { Station } from '../../../../tourist/models/station.model';
import { Trajet } from '../../../../tourist/models/trajet.model';
import { RoutePreview, TransportService } from '../../../../tourist/services/transport.service';
import {
  getCompactPlaceLabel,
  getCompactPlaceTitle,
  getCompactRouteLabel
} from '../../../../../shared/utils/location-display.util';

@Component({
  selector: 'app-host-trajets',
  templateUrl: './host-trajets.component.html',
  styleUrls: ['./host-trajets.component.css']
})
export class HostTrajetsComponent implements OnInit, OnDestroy {
  readonly tunisiaLatitudeMin = 30.0;
  readonly tunisiaLatitudeMax = 37.6;
  readonly tunisiaLongitudeMin = 7.0;
  readonly tunisiaLongitudeMax = 11.8;

  trajets: Trajet[] = [];
  stations: Station[] = [];
  searchTerm = '';
  departureSearch = '';
  arrivalSearch = '';
  trajetForm!: FormGroup;
  selectedTrajet: Trajet | null = null;
  trajetToDelete: Trajet | null = null;

  loading = false;
  stationsLoading = false;
  saving = false;
  routePreviewLoading = false;

  errorMessage = '';
  warningMessage = '';
  successMessage = '';
  routePreviewError = '';
  routePreview: RoutePreview | null = null;
  private feedbackTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private readonly destroy$ = new Subject<void>();
  currentPage = 1;
  readonly pageSize = 4;

  constructor(
    private transportService: TransportService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadStations();
    this.loadTrajets();
    this.setupRoutePreview();
  }

  initForm(): void {
    this.trajetForm = this.fb.group({
      departureStationId: ['', Validators.required],
      arrivalStationId: ['', Validators.required],
      distanceKm: [1, [Validators.required, Validators.min(1), Validators.max(1000)]],
      estimatedDurationMinutes: [1, [Validators.required, Validators.min(1)]],
      pricePerKm: [0.01, [Validators.required, Validators.min(0.01), Validators.max(10)]]
    }, { validators: this.differentStationsValidator });
  }

  differentStationsValidator(group: AbstractControl): ValidationErrors | null {
    const departure = group.get('departureStationId')?.value;
    const arrival = group.get('arrivalStationId')?.value;

    if (departure && arrival && String(departure) === String(arrival)) {
      return { sameStations: true };
    }

    return null;
  }

  loadStations(): void {
    this.stationsLoading = true;

    this.transportService.getStations()
      .pipe(finalize(() => this.stationsLoading = false))
      .subscribe({
        next: (data: Station[]) => this.stations = data,
        error: () => this.showErrorMessage('Unable to load stations.')
      });
  }

  loadTrajets(): void {
    this.loading = true;

    this.transportService.getTrajets()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (data: Trajet[]) => {
          this.trajets = [...data].sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
          this.currentPage = 1;
        },
        error: () => this.showErrorMessage('Unable to load routes.')
      });
  }

  editTrajet(trajet: Trajet): void {
    this.selectedTrajet = trajet;
    this.clearFeedbackMessages();

    this.trajetForm.patchValue({
      departureStationId: trajet.departureStationId || '',
      arrivalStationId: trajet.arrivalStationId || '',
      distanceKm: trajet.distanceKm || 1,
      estimatedDurationMinutes: trajet.estimatedDurationMinutes || 1,
      pricePerKm: trajet.pricePerKm || 0.01
    });
    this.departureSearch = this.getStationOptionLabelById(trajet.departureStationId);
    this.arrivalSearch = this.getStationOptionLabelById(trajet.arrivalStationId);
    this.routePreview = trajet.routeGeoJson
      ? {
          distanceKm: trajet.distanceKm || 0,
          estimatedDurationMinutes: trajet.estimatedDurationMinutes || 0,
          routeGeoJson: trajet.routeGeoJson || null
        }
      : null;
    this.routePreviewError = '';
  }

  resetForm(): void {
    this.selectedTrajet = null;
    this.clearFeedbackMessages();

    this.trajetForm.reset({
      departureStationId: '',
      arrivalStationId: '',
      distanceKm: 1,
      estimatedDurationMinutes: 1,
      pricePerKm: 0.01
    });
    this.departureSearch = '';
    this.arrivalSearch = '';
    this.routePreview = null;
    this.routePreviewError = '';
    this.routePreviewLoading = false;
  }

  submitTrajet(): void {
    this.clearFeedbackMessages();

    if (this.trajetForm.invalid) {
      this.trajetForm.markAllAsTouched();
      this.showWarningMessage('Please complete the highlighted fields before saving the route.');
      return;
    }

    if (this.isDuplicateRouteSelection()) {
      this.trajetForm.get('departureStationId')?.markAsTouched();
      this.trajetForm.get('arrivalStationId')?.markAsTouched();
      this.showWarningMessage('This exact route already exists for this host. You cannot create the same departure -> arrival twice. Create the reverse route instead if you need arrival -> departure.');
      return;
    }

    const payload: Partial<Trajet> = {
      departureStationId: Number(this.trajetForm.value.departureStationId),
      arrivalStationId: Number(this.trajetForm.value.arrivalStationId),
      distanceKm: Number(this.trajetForm.value.distanceKm),
      estimatedDurationMinutes: Number(this.trajetForm.value.estimatedDurationMinutes),
      pricePerKm: Number(this.trajetForm.value.pricePerKm),
      routeGeoJson: this.previewRouteGeoJson ?? undefined
    };

    const reverseRouteExists = !this.selectedTrajet && this.hasReverseRouteSelection();

    this.saving = true;

    const request$ = this.selectedTrajet
      ? this.transportService.updateTrajet(this.selectedTrajet.id, payload)
      : this.transportService.createTrajet(payload);

    request$
      .pipe(finalize(() => this.saving = false))
      .subscribe({
        next: () => {
          const wasEditing = !!this.selectedTrajet;
          this.resetForm();
          const successMessage = wasEditing
            ? 'Route updated successfully.'
            : reverseRouteExists
              ? 'Reverse route created successfully. This is allowed because departure and arrival are swapped.'
              : 'Route created successfully.';
          this.showSuccessMessage(successMessage);
          this.loadTrajets();
        },
        error: (error: any) => {
          console.error('[HostTrajetsComponent] submitTrajet error:', error);
          this.showErrorMessage(this.extractErrorMessage(error, 'Failed to save the route.'));
        }
      });
  }

  hasError(controlName: string): boolean {
    const control = this.trajetForm.get(controlName);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  shouldShowSameStationsError(): boolean {
    const departureTouched = this.trajetForm.get('departureStationId')?.touched;
    const arrivalTouched = this.trajetForm.get('arrivalStationId')?.touched;
    return !!this.trajetForm.errors?.['sameStations'] && !!(departureTouched || arrivalTouched);
  }

  isDuplicateRouteSelection(): boolean {
    const departureId = Number(this.trajetForm.get('departureStationId')?.value);
    const arrivalId = Number(this.trajetForm.get('arrivalStationId')?.value);

    if (!departureId || !arrivalId || departureId === arrivalId) {
      return false;
    }

    return this.trajets.some((trajet) =>
      trajet.id !== this.selectedTrajet?.id &&
      Number(trajet.departureStationId) === departureId &&
      Number(trajet.arrivalStationId) === arrivalId
    );
  }

  hasReverseRouteSelection(): boolean {
    const departureId = Number(this.trajetForm.get('departureStationId')?.value);
    const arrivalId = Number(this.trajetForm.get('arrivalStationId')?.value);

    if (!departureId || !arrivalId || departureId === arrivalId) {
      return false;
    }

    return this.trajets.some((trajet) =>
      trajet.id !== this.selectedTrajet?.id &&
      Number(trajet.departureStationId) === arrivalId &&
      Number(trajet.arrivalStationId) === departureId
    );
  }

  getFieldError(controlName: string): string {
    const control = this.trajetForm.get(controlName);

    if (!control || !control.errors || !(control.touched || control.dirty)) {
      return '';
    }

    if (controlName === 'departureStationId' && control.errors['required']) {
      return 'Departure station is required.';
    }

    if (controlName === 'arrivalStationId' && control.errors['required']) {
      return 'Arrival station is required.';
    }

    if (controlName === 'distanceKm') {
      if (control.errors['required']) return 'Distance is required.';
      if (control.errors['min']) return 'Distance must be at least 1 km.';
      if (control.errors['max']) return 'Distance must not exceed 1000 km.';
    }

    if (controlName === 'estimatedDurationMinutes') {
      if (control.errors['required']) return 'Estimated duration is required.';
      if (control.errors['min']) return 'Estimated duration must be at least 1 minute.';
    }

    if (controlName === 'pricePerKm') {
      if (control.errors['required']) return 'Price per kilometer is required.';
      if (control.errors['min']) return 'Price must be at least 0.01 DT.';
      if (control.errors['max']) return 'Price must not exceed 10 DT.';
    }

    return '';
  }

  requestDeleteTrajet(trajet: Trajet): void {
    this.trajetToDelete = trajet;
    this.errorMessage = '';
  }

  cancelDeleteTrajet(): void {
    this.trajetToDelete = null;
  }

  deleteTrajet(): void {
    if (!this.trajetToDelete) {
      return;
    }

    this.transportService.deleteTrajet(this.trajetToDelete.id).subscribe({
      next: () => {
        this.trajetToDelete = null;
        this.showSuccessMessage('Route deleted successfully.');
        this.loadTrajets();
      },
      error: () => {
        this.showErrorMessage('Failed to delete the route.');
      }
    });
  }

  getStationLabel(station?: Station): string {
    if (!station) return 'N/A';
    return getCompactPlaceLabel(station.name, station.city);
  }

  get tunisiaStations(): Station[] {
    return this.stations
      .filter((station) => this.isStationInTunisia(station))
      .sort((left, right) => this.getStationOptionLabel(left).localeCompare(this.getStationOptionLabel(right)));
  }

  get availableDepartureStations(): Station[] {
    const arrivalStationId = this.getSelectedStationId('arrivalStationId');
    return this.tunisiaStations.filter((station) => station.id !== arrivalStationId);
  }

  get availableArrivalStations(): Station[] {
    const departureStationId = this.getSelectedStationId('departureStationId');
    return this.tunisiaStations.filter((station) => station.id !== departureStationId);
  }

  get stationOptions(): string[] {
    return this.stations
      .map((station) => this.getStationOptionLabel(station))
      .sort((left, right) => left.localeCompare(right));
  }

  getStationCoordinates(stationId?: number): string {
    if (!stationId) return 'Coordinates unavailable';

    const station = this.stations.find((item) => item.id === stationId);
    if (!station || !this.isStationInTunisia(station)) {
      return 'Tunisian coordinates unavailable';
    }

    return `${station.latitude.toFixed(4)}, ${station.longitude.toFixed(4)}`;
  }

  getRouteMapStatus(trajet: Trajet): string {
    return trajet.routeGeoJson ? 'Trace available' : 'Trace pending';
  }

  getCompactTrajetLabel(trajet: Trajet): string {
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

  getCompactStationTitle(stationId?: number, fallbackName?: string): string {
    const station = this.stations.find((item) => item.id === stationId);
    return getCompactPlaceTitle(fallbackName || station?.name, station?.city);
  }

  getStationLatitude(stationId?: number): number | null {
    const station = this.stations.find((item) => item.id === stationId);
    return this.isStationInTunisia(station) ? station.latitude : null;
  }

  getStationLongitude(stationId?: number): number | null {
    const station = this.stations.find((item) => item.id === stationId);
    return this.isStationInTunisia(station) ? station.longitude : null;
  }

  get isRouteAutoReady(): boolean {
    const departureId = Number(this.trajetForm.get('departureStationId')?.value);
    const arrivalId = Number(this.trajetForm.get('arrivalStationId')?.value);

    return this.hasStationCoordinates(departureId) && this.hasStationCoordinates(arrivalId);
  }

  get previewRouteGeoJson(): string | null {
    if (this.routePreview?.routeGeoJson) {
      return this.routePreview.routeGeoJson;
    }

    if (this.isEditingCurrentStationPair()) {
      return this.selectedTrajet?.routeGeoJson ?? null;
    }

    return null;
  }

  get previewDistanceKm(): number | null {
    return this.routePreview?.distanceKm ?? null;
  }

  get previewDurationMinutes(): number | null {
    return this.routePreview?.estimatedDurationMinutes ?? null;
  }

  onDepartureSearchInput(value: string): void {
    this.departureSearch = value;
    this.assignStationFromSearch('departureStationId', value);
  }

  onArrivalSearchInput(value: string): void {
    this.arrivalSearch = value;
    this.assignStationFromSearch('arrivalStationId', value);
  }

  selectSuggestedDeparture(option: string): void {
    this.departureSearch = option;
    this.assignStationFromSearch('departureStationId', option, true);
  }

  selectSuggestedArrival(option: string): void {
    this.arrivalSearch = option;
    this.assignStationFromSearch('arrivalStationId', option, true);
  }

  getDepartureSuggestions(): string[] {
    return this.getStationSuggestions(this.departureSearch, this.getSelectedStationId('arrivalStationId'));
  }

  getArrivalSuggestions(): string[] {
    return this.getStationSuggestions(this.arrivalSearch, this.getSelectedStationId('departureStationId'));
  }

  private setupRoutePreview(): void {
    this.trajetForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged((previous, current) =>
          previous.departureStationId === current.departureStationId &&
          previous.arrivalStationId === current.arrivalStationId
        ),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.refreshRoutePreview();
      });
  }

  private refreshRoutePreview(): void {
    this.routePreviewError = '';

    if (!this.isRouteAutoReady) {
      this.routePreview = null;
      this.routePreviewLoading = false;
      return;
    }

    const departureId = Number(this.trajetForm.get('departureStationId')?.value);
    const arrivalId = Number(this.trajetForm.get('arrivalStationId')?.value);
    this.routePreview = null;
    this.routePreviewLoading = true;

    this.transportService.previewRoute(departureId, arrivalId)
      .pipe(finalize(() => this.routePreviewLoading = false))
      .subscribe({
        next: (preview) => {
          this.routePreview = preview;
          this.trajetForm.patchValue({
            distanceKm: preview.distanceKm,
            estimatedDurationMinutes: preview.estimatedDurationMinutes
          }, { emitEvent: false });
        },
        error: () => {
          this.routePreview = null;
          this.routePreviewError = 'Unable to preview the real route right now. You can still save and let the backend retry.';
        }
      });
  }

  private hasStationCoordinates(stationId?: number): boolean {
    if (!stationId) return false;
    const station = this.stations.find((item) => item.id === stationId);
    return !!station && this.isStationInTunisia(station);
  }

  private assignStationFromSearch(controlName: 'departureStationId' | 'arrivalStationId', value: string, exactMatchOnly = false): void {
    const station = this.findStationBySearch(value, exactMatchOnly);
    const control = this.trajetForm.get(controlName);

    if (!control) {
      return;
    }

    if (station) {
      control.setValue(station.id);
      control.markAsDirty();
      return;
    }

    control.setValue('');
    if (value.trim()) {
      control.markAsDirty();
    }
  }

  private findStationBySearch(value: string, exactMatchOnly = false): Station | undefined {
    const normalized = value.trim().toLowerCase();
    if (!normalized) {
      return undefined;
    }

    const exactMatch = this.stations.find((station) => this.getStationOptionLabel(station).toLowerCase() === normalized);
    if (exactMatch || exactMatchOnly) {
      return exactMatch;
    }

    const matches = this.stations.filter((station) => {
      const searchable = [
        station.name,
        station.city,
        this.getStationOptionLabel(station)
      ].join(' ').toLowerCase();

      return searchable.includes(normalized);
    });

    return matches.length === 1 ? matches[0] : undefined;
  }

  private getStationSuggestions(value: string, excludedStationId?: number): string[] {
    const normalized = value.trim().toLowerCase();

    return this.stations
      .filter((station) => station.id !== excludedStationId)
      .filter((station) => {
        if (!normalized) {
          return true;
        }

        const searchable = [
          station.name,
          station.city,
          this.getStationOptionLabel(station)
        ].join(' ').toLowerCase();

        return searchable.includes(normalized);
      })
      .map((station) => this.getStationOptionLabel(station))
      .sort((left, right) => left.localeCompare(right))
      .slice(0, 8);
  }

  getStationOptionLabel(station: Station): string {
    return getCompactPlaceLabel(station.name, station.city);
  }

  private getStationOptionLabelById(stationId?: number): string {
    if (!stationId) {
      return '';
    }

    const station = this.stations.find((item) => item.id === stationId);
    return station ? this.getStationOptionLabel(station) : '';
  }

  private getSelectedStationId(controlName: 'departureStationId' | 'arrivalStationId'): number | undefined {
    const value = Number(this.trajetForm.get(controlName)?.value);
    return Number.isFinite(value) && value > 0 ? value : undefined;
  }

  private isEditingCurrentStationPair(): boolean {
    if (!this.selectedTrajet) {
      return false;
    }

    const departureId = Number(this.trajetForm.get('departureStationId')?.value);
    const arrivalId = Number(this.trajetForm.get('arrivalStationId')?.value);

    return departureId === this.selectedTrajet.departureStationId
      && arrivalId === this.selectedTrajet.arrivalStationId;
  }

  get filteredTrajets(): Trajet[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.trajets;

    return this.trajets.filter((trajet) => {
      const departureStation = this.stations.find((station) => station.id === trajet.departureStationId);
      const arrivalStation = this.stations.find((station) => station.id === trajet.arrivalStationId);

      return `${trajet.departureStationName} ${trajet.arrivalStationName} ${departureStation?.city || ''} ${arrivalStation?.city || ''} ${trajet.distanceKm} ${trajet.estimatedDurationMinutes} ${trajet.pricePerKm} ${trajet.basePrice || ''} ${trajet.routeGeoJson ? 'trace available' : 'trace pending'}`
        .toLowerCase()
        .includes(term);
    });
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredTrajets.length / this.pageSize));
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
  }

  get paginatedTrajets(): Trajet[] {
    const currentPage = this.clampPage(this.currentPage, this.totalPages);
    if (currentPage !== this.currentPage) {
      this.currentPage = currentPage;
    }

    const start = (currentPage - 1) * this.pageSize;
    return this.filteredTrajets.slice(start, start + this.pageSize);
  }

  onSearchChange(): void {
    this.currentPage = 1;
  }

  goToPage(page: number): void {
    this.currentPage = this.clampPage(page, this.totalPages);
  }

  private extractErrorMessage(error: any, fallback: string): string {
    if (typeof error?.error === 'string' && error.error.trim()) {
      return error.error;
    }

    if (error?.error?.message) {
      return error.error.message;
    }

    if (error?.message) {
      return error.message;
    }

    if (error?.error && typeof error.error === 'object') {
      return Object.values(error.error).filter(Boolean).join(', ') || fallback;
    }

    return fallback;
  }

  private clearFeedbackMessages(): void {
    if (this.feedbackTimeoutId) {
      clearTimeout(this.feedbackTimeoutId);
      this.feedbackTimeoutId = null;
    }

    this.errorMessage = '';
    this.warningMessage = '';
    this.successMessage = '';
  }

  private showSuccessMessage(message: string): void {
    this.showTimedFeedback('success', message);
  }

  private showWarningMessage(message: string): void {
    this.showTimedFeedback('warning', message);
  }

  private showErrorMessage(message: string): void {
    this.showTimedFeedback('error', message);
  }

  private showTimedFeedback(type: 'success' | 'warning' | 'error', message: string): void {
    this.clearFeedbackMessages();

    if (type === 'success') {
      this.successMessage = message;
    } else if (type === 'warning') {
      this.warningMessage = message;
    } else {
      this.errorMessage = message;
    }

    this.feedbackTimeoutId = setTimeout(() => {
      this.errorMessage = '';
      this.warningMessage = '';
      this.successMessage = '';
      this.feedbackTimeoutId = null;
    }, 3000);
  }
  private clampPage(page: number, totalPages: number): number {
    return Math.min(Math.max(page, 1), totalPages);
  }

  private isStationInTunisia(station?: Station): station is Station & { latitude: number; longitude: number } {
    return !!station
      && typeof station.latitude === 'number'
      && Number.isFinite(station.latitude)
      && station.latitude >= this.tunisiaLatitudeMin
      && station.latitude <= this.tunisiaLatitudeMax
      && typeof station.longitude === 'number'
      && Number.isFinite(station.longitude)
      && station.longitude >= this.tunisiaLongitudeMin
      && station.longitude <= this.tunisiaLongitudeMax;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
