import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription, firstValueFrom } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { Station } from '../../../../tourist/models/station.model';
import { GeoLocationResult, TransportService } from '../../../../tourist/services/transport.service';

@Component({
  selector: 'app-host-stations',
  templateUrl: './host-stations.component.html',
  styleUrls: ['./host-stations.component.css']
})
export class HostStationsComponent implements OnInit, OnDestroy {
  readonly tunisiaLatitudeMin = 30.0;
  readonly tunisiaLatitudeMax = 37.6;
  readonly tunisiaLongitudeMin = 7.0;
  readonly tunisiaLongitudeMax = 11.8;
  readonly nearbyStationMatchRadiusKm = 20;
  readonly administrativeLocationKeywords = [
    'delegation',
    'délégation',
    'delegation regionale',
    'route regionale',
    'route régionale',
    'governorat',
    'gouvernorat',
    'governorate',
    'province',
    'district',
    'region',
    'région',
    'ولاية',
    'معتمدية'
  ];

  stations: Station[] = [];
  searchTerm = '';
  locationSearch = '';
  stationForm!: FormGroup;
  selectedStation: Station | null = null;
  stationToDelete: Station | null = null;
  geocodingResults: GeoLocationResult[] = [];

  loading = false;
  saving = false;
  geocodingLoading = false;
  autoDetectedLocation = false;
  autoDetectedLocationApproximate = false;

  errorMessage = '';
  successMessage = '';
  geocodingError = '';
  private autoFilledSnapshot: { name: string; city: string; latitude: number | null; longitude: number | null } | null = null;
  private successTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private reverseGeocodeSubscription: Subscription | null = null;
  currentPage = 1;
  readonly pageSize = 3;

  constructor(
    private transportService: TransportService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadStations();
  }

  ngOnDestroy(): void {
    this.cancelReverseGeocoding();
    if (this.successTimeoutId) {
      clearTimeout(this.successTimeoutId);
      this.successTimeoutId = null;
    }
  }

  initForm(): void {
    this.stationForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      city: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      surcharge: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      latitude: [null, [Validators.required, Validators.min(this.tunisiaLatitudeMin), Validators.max(this.tunisiaLatitudeMax)]],
      longitude: [null, [Validators.required, Validators.min(this.tunisiaLongitudeMin), Validators.max(this.tunisiaLongitudeMax)]],
      downtown: [false, Validators.required]
    });
  }

  loadStations(): void {
    this.loading = true;

    this.transportService.getStations()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (data: Station[]) => {
          this.stations = [...data].sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
          this.currentPage = 1;
        },
        error: (error: any) => {
          console.error('[HostStationsComponent] loadStations error:', error);
          this.errorMessage = 'Unable to load stations.';
        }
      });
  }

  editStation(station: Station): void {
    const editableName = this.getEditableStationName(station);
    const editableCity = this.getEditableStationCity(station);
    const displayTitle = this.getDisplayStationName(station);
    const displaySubtitle = this.getDisplayStationSubtitle(station);

    this.selectedStation = station;
    this.errorMessage = '';
    this.successMessage = '';
    this.locationSearch = [displayTitle, displaySubtitle].filter(Boolean).join(' - ');
    this.geocodingResults = [];
    this.geocodingError = '';
    this.autoDetectedLocation = false;
    this.autoDetectedLocationApproximate = false;

    this.stationForm.patchValue({
      name: editableName,
      city: editableCity,
      surcharge: station.surcharge,
      latitude: station.latitude ?? null,
      longitude: station.longitude ?? null,
      downtown: station.downtown
    });
  }

  resetForm(): void {
    this.selectedStation = null;
    this.errorMessage = '';
    this.successMessage = '';
    this.locationSearch = '';
    this.geocodingResults = [];
    this.geocodingError = '';
    this.geocodingLoading = false;
    this.autoDetectedLocation = false;
    this.autoDetectedLocationApproximate = false;
    this.cancelReverseGeocoding();
    this.autoFilledSnapshot = null;
    this.stationForm.reset({
      name: '',
      city: '',
      surcharge: 0,
      latitude: null,
      longitude: null,
      downtown: false
    });
  }

  async submitStation(): Promise<void> {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.stationForm.invalid) {
      this.stationForm.markAllAsTouched();
      this.errorMessage = 'Please fix the highlighted fields.';
      return;
    }

    const normalizedName = this.normalizeStationName(this.stationForm.value.name);
    const normalizedCity = this.normalizeStationCity(this.stationForm.value.city);

    if (!normalizedName || this.isInvalidStationNameLabel(normalizedName)) {
      this.errorMessage = 'Please enter a real station name, not coordinates or a route/administrative label.';
      this.stationForm.get('name')?.markAsTouched();
      return;
    }

    if (!normalizedCity || this.isInvalidStationCityLabel(normalizedCity)) {
      this.errorMessage = 'Please enter a real city name, not only the country or an administrative area.';
      this.stationForm.get('city')?.markAsTouched();
      return;
    }

    if (this.isDuplicateStation()) {
      this.errorMessage = 'A station with this name already exists in this city.';
      this.stationForm.get('name')?.markAsTouched();
      this.stationForm.get('city')?.markAsTouched();
      return;
    }

    const payload: Partial<Station> = {
      name: normalizedName,
      city: normalizedCity,
      surcharge: Number(this.stationForm.value.surcharge),
      latitude: Number(this.stationForm.value.latitude),
      longitude: Number(this.stationForm.value.longitude),
      downtown: !!this.stationForm.value.downtown
    };

    this.saving = true;

    const request$ = this.selectedStation
      ? this.transportService.updateStation(this.selectedStation.id, payload)
      : this.transportService.createStation(payload);

    request$
      .pipe(finalize(() => this.saving = false))
      .subscribe({
        next: () => {
          const wasEditing = !!this.selectedStation;
          this.resetForm();
          this.showSuccessMessage(wasEditing ? 'Station updated successfully.' : 'Station created successfully.');
          this.loadStations();
        },
        error: (error: any) => {
          console.error('[HostStationsComponent] submitStation error:', error);
          if (error?.error && typeof error.error === 'object') {
            this.errorMessage = Object.values(error.error).join(', ') || 'Saving failed.';
          } else {
            this.errorMessage = error?.error?.message || 'Failed to save the station.';
          }
        }
      });
  }

  hasError(controlName: string): boolean {
    const control = this.stationForm.get(controlName);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  getFieldError(controlName: string): string {
    const control = this.stationForm.get(controlName);

    if (!control || !control.errors || !(control.touched || control.dirty)) {
      return '';
    }

    if (controlName === 'name') {
      if (control.errors['required']) return 'Name is required.';
      if (control.errors['minlength']) return 'Name must contain at least 2 characters.';
      if (control.errors['maxlength']) return 'Name must not exceed 100 characters.';
    }

    if (controlName === 'city') {
      if (control.errors['required']) return 'City is required.';
      if (control.errors['minlength']) return 'City must contain at least 2 characters.';
      if (control.errors['maxlength']) return 'City must not exceed 100 characters.';
    }

    if (controlName === 'surcharge') {
      if (control.errors['required']) return 'Extra fee is required.';
      if (control.errors['min']) return 'Extra fee must be at least 0.';
      if (control.errors['max']) return 'Extra fee must not exceed 100.';
    }

    if (controlName === 'latitude') {
      if (control.errors['required']) return 'Latitude is required.';
      if (control.errors['min'] || control.errors['max']) {
        return `Latitude must stay inside Tunisia (${this.tunisiaLatitudeMin} to ${this.tunisiaLatitudeMax}).`;
      }
    }

    if (controlName === 'longitude') {
      if (control.errors['required']) return 'Longitude is required.';
      if (control.errors['min'] || control.errors['max']) {
        return `Longitude must stay inside Tunisia (${this.tunisiaLongitudeMin} to ${this.tunisiaLongitudeMax}).`;
      }
    }

    return '';
  }

  requestDeleteStation(station: Station): void {
    this.stationToDelete = station;
    this.errorMessage = '';
  }

  cancelDeleteStation(): void {
    this.stationToDelete = null;
  }

  deleteStation(): void {
    if (!this.stationToDelete) return;

    this.transportService.deleteStation(this.stationToDelete.id).subscribe({
      next: () => {
        this.stationToDelete = null;
        this.showSuccessMessage('Station deleted successfully.');
        this.loadStations();
      },
      error: (error: any) => {
        console.error('[HostStationsComponent] deleteStation error:', error);
        this.errorMessage = 'Failed to delete the station.';
      }
    });
  }

  get filteredStations(): Station[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.stations;

    return this.stations.filter((station) =>
      `${this.getDisplayStationName(station)} ${this.getDisplayStationSubtitle(station)} ${this.getEditableStationCity(station)} ${station.surcharge} ${station.latitude ?? ''} ${station.longitude ?? ''}`
        .toLowerCase()
        .includes(term)
    );
  }

  getDisplayStationName(station?: Station | null): string {
    const editableName = this.getEditableStationName(station);
    if (editableName) {
      return editableName;
    }

    const editableCity = this.getEditableStationCity(station);
    if (editableCity) {
      return editableCity;
    }

    return 'Unnamed station';
  }

  getDisplayStationSubtitle(station?: Station | null): string {
    const editableCity = this.getEditableStationCity(station);
    const editableName = this.getEditableStationName(station);

    if (!editableCity || !editableName) {
      return '';
    }

    if (this.normalizeSearchText(editableCity) === this.normalizeSearchText(editableName)) {
      return '';
    }

    return editableCity;
  }

  formatCoordinate(value?: number): string {
    return typeof value === 'number' ? value.toFixed(6) : 'N/A';
  }

  get selectedLatitude(): number | null {
    const value = this.stationForm.get('latitude')?.value;
    return typeof value === 'number' ? value : value != null && value !== '' ? Number(value) : null;
  }

  get selectedLongitude(): number | null {
    const value = this.stationForm.get('longitude')?.value;
    return typeof value === 'number' ? value : value != null && value !== '' ? Number(value) : null;
  }

  get hasSelectedCoordinates(): boolean {
    return this.selectedLatitude != null && this.selectedLongitude != null;
  }

  onMapCoordinateSelected(selection: { lat: number; lng: number }): void {
    this.stationForm.patchValue({
      latitude: selection.lat,
      longitude: selection.lng
    });
    this.stationForm.get('latitude')?.markAsDirty();
    this.stationForm.get('longitude')?.markAsDirty();
    this.fillLocationDetailsFromCoordinates(selection.lat, selection.lng);
  }

  onLocationSearchInput(value: string): void {
    if (value !== this.locationSearch) {
      this.cancelReverseGeocoding();
      this.clearAutoFilledFieldsIfUnchanged();
    }

    this.locationSearch = value;
    this.geocodingError = '';
    this.geocodingResults = [];
    this.geocodingLoading = false;
    this.autoDetectedLocation = false;
    this.autoDetectedLocationApproximate = false;

    if (!value.trim()) {
      return;
    }
  }

  async triggerLocationSearch(): Promise<void> {
    const query = this.locationSearch.trim();
    if (!query) {
      return;
    }

    this.cancelReverseGeocoding();
    this.geocodingLoading = false;
    this.geocodingError = '';
    this.geocodingResults = [];

    if (this.applyLocalStationMatch(query)) {
      return;
    }

    await this.searchLocationInTunisia(query);
  }

  useGeocodingResult(result: GeoLocationResult, sourceQuery?: string): void {
    this.locationSearch = result.displayName;
    this.geocodingResults = [];
    this.geocodingError = '';

    const normalizedSourceQuery = (sourceQuery || this.locationSearch || '').trim();
    const inferredName = this.buildStationNameFromSearch(result, normalizedSourceQuery);
    const currentName = this.normalizeStationName(this.stationForm.value.name || '');
    const currentCity = this.normalizeStationCity(this.stationForm.value.city || '');
    const resolvedCityCandidate = this.getResolvedCityCandidate(result);
    const resolvedCity = currentCity || resolvedCityCandidate;
    const inferredNameCandidate = this.normalizeStationName(
      inferredName || this.getResolvedNameCandidate(result, resolvedCity)
    );
    const resolvedName = currentName
      || (!this.isInvalidStationNameLabel(inferredNameCandidate) ? inferredNameCandidate : '')
      || this.buildFallbackNameFromCoordinates(resolvedCity, result.latitude, result.longitude);

    this.stationForm.patchValue({
      latitude: Number(result.latitude.toFixed(6)),
      longitude: Number(result.longitude.toFixed(6)),
      city: resolvedCity,
      name: resolvedName
    });

    this.stationForm.get('latitude')?.markAsDirty();
    this.stationForm.get('longitude')?.markAsDirty();
    this.stationForm.get('city')?.markAsDirty();
    this.stationForm.get('name')?.markAsDirty();
    this.captureAutoFilledSnapshot();
    this.autoDetectedLocation = true;
    this.autoDetectedLocationApproximate = !resolvedName || !resolvedCity;
    this.geocodingError = this.autoDetectedLocationApproximate
      ? 'Location found. Please complete the missing station name or city before saving.'
      : '';
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredStations.length / this.pageSize));
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
  }

  get paginatedStations(): Station[] {
    const currentPage = this.clampPage(this.currentPage, this.totalPages);
    if (currentPage !== this.currentPage) {
      this.currentPage = currentPage;
    }

    const start = (currentPage - 1) * this.pageSize;
    return this.filteredStations.slice(start, start + this.pageSize);
  }

  onSearchChange(): void {
    this.currentPage = 1;
  }

  goToPage(page: number): void {
    this.currentPage = this.clampPage(page, this.totalPages);
  }

  get cityOptions(): string[] {
    return [...new Set(this.stations.map((station) => this.getEditableStationCity(station)).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b));
  }

  get stationNameSuggestions(): string[] {
    const city = this.normalizeStationCity(this.stationForm.get('city')?.value || '').toLowerCase();
    const names = this.stations
      .filter((station) => !city || this.getEditableStationCity(station).toLowerCase() === city)
      .map((station) => this.getDisplayStationName(station));

    return [...new Set(names)].sort((a, b) => a.localeCompare(b));
  }

  isDuplicateStation(): boolean {
    const name = this.normalizeStationName(this.stationForm.get('name')?.value || '').toLowerCase();
    const city = this.normalizeStationCity(this.stationForm.get('city')?.value || '').toLowerCase();

    if (!name || !city) return false;

    return this.stations.some((station) =>
      station.id !== this.selectedStation?.id &&
      this.getDisplayStationName(station).toLowerCase() === name &&
      this.getEditableStationCity(station).toLowerCase() === city
    );
  }

  private showSuccessMessage(message: string): void {
    if (this.successTimeoutId) clearTimeout(this.successTimeoutId);
    this.successMessage = message;
    this.successTimeoutId = setTimeout(() => {
      this.successMessage = '';
      this.successTimeoutId = null;
    }, 3000);
  }

  private clampPage(page: number, totalPages: number): number {
    return Math.min(Math.max(page, 1), totalPages);
  }

  private fillLocationDetailsFromCoordinates(latitude: number, longitude: number): void {
    this.cancelReverseGeocoding();
    this.geocodingLoading = true;
    this.geocodingError = '';
    this.autoDetectedLocation = false;
    this.autoDetectedLocationApproximate = false;

    this.reverseGeocodeSubscription = this.transportService.reverseGeocodeLocation(latitude, longitude).subscribe({
      next: (result) => {
        this.geocodingLoading = false;
        this.locationSearch = result.displayName || this.locationSearch;
        const resolvedCity = this.resolveLocationCityFromCoordinates(result)
          || this.buildFallbackCityFromCoordinates(latitude, longitude);
        const resolvedName = this.resolveLocationNameFromCoordinates(result, resolvedCity, latitude, longitude);

        this.applyResolvedMapSelection(latitude, longitude, resolvedName, resolvedCity, result.displayName);
      },
      error: (error) => {
        this.geocodingLoading = false;
        console.error('[HostStationsComponent] reverseGeocodeLocation error:', error);
        const fallbackCity = this.buildFallbackCityFromCoordinates(latitude, longitude);
        const fallbackName = this.buildFallbackNameFromCoordinates(fallbackCity, latitude, longitude);
        this.applyResolvedMapSelection(latitude, longitude, fallbackName, fallbackCity);
        this.autoDetectedLocation = true;
        this.autoDetectedLocationApproximate = true;
        this.geocodingError = 'Coordinates selected. Please complete the station name and city manually before saving.';
      }
    });
  }

  private cancelReverseGeocoding(): void {
    if (this.reverseGeocodeSubscription) {
      this.reverseGeocodeSubscription.unsubscribe();
      this.reverseGeocodeSubscription = null;
    }
  }

  private matchesLocationSearch(result: GeoLocationResult): boolean {
    const queryTokens = this.normalizeSearchText(this.locationSearch)
      .split(' ')
      .filter((token) => token.length >= 2);

    if (!queryTokens.length) {
      return true;
    }

    const haystack = this.normalizeSearchText([
      result.name,
      result.city,
      result.displayName
    ].filter(Boolean).join(' '));

    const matchedTokens = queryTokens.filter((token) => haystack.includes(token));
    return matchedTokens.length >= Math.min(2, queryTokens.length);
  }

  private normalizeSearchText(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\b(tunisie|tunisia)\b/g, ' ')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private applyLocalStationMatch(query: string): boolean {
    const normalizedQuery = this.normalizeSearchText(query);
    if (!normalizedQuery || normalizedQuery.length < 3) {
      return false;
    }

    const match = this.stations.find((station) => {
      const haystack = this.normalizeSearchText(`${this.getDisplayStationName(station)} ${station.city}`);
      return haystack === normalizedQuery
        || haystack.startsWith(`${normalizedQuery} `)
        || haystack.includes(` ${normalizedQuery} `)
        || haystack.endsWith(` ${normalizedQuery}`);
    });

    if (!match) {
      return false;
    }

    const editableName = this.getEditableStationName(match);
    const editableCity = this.getEditableStationCity(match);

    this.geocodingError = '';
    this.geocodingResults = [];
    this.locationSearch = [this.getDisplayStationName(match), this.getDisplayStationSubtitle(match)].filter(Boolean).join(' ');
    this.stationForm.patchValue({
      name: editableName,
      city: editableCity,
      latitude: match.latitude ?? null,
      longitude: match.longitude ?? null
    });
    this.stationForm.get('name')?.markAsDirty();
    this.stationForm.get('city')?.markAsDirty();
    this.stationForm.get('latitude')?.markAsDirty();
    this.stationForm.get('longitude')?.markAsDirty();
    this.captureAutoFilledSnapshot();
    this.autoDetectedLocation = true;
    this.autoDetectedLocationApproximate = false;
    return true;
  }

  private buildStationNameFromSearch(result: GeoLocationResult, sourceQuery: string): string {
    const normalizedQuery = this.normalizeSearchText(sourceQuery);
    const normalizedCity = this.normalizeSearchText(result.city || '');
    const normalizedName = this.normalizeSearchText(result.name || '');

    if (normalizedQuery && normalizedQuery === normalizedCity) {
      return this.getResolvedCityCandidate(result);
    }

    if (normalizedQuery && normalizedQuery !== normalizedName) {
      const queryName = this.normalizeStationName(sourceQuery);
      return this.isInvalidStationNameLabel(queryName) ? '' : queryName;
    }

    const fallbackName = this.normalizeStationName(result.name || sourceQuery);
    return this.isInvalidStationNameLabel(fallbackName) ? '' : fallbackName;
  }

  private resolveLocationNameFromCoordinates(
    result: GeoLocationResult,
    resolvedCity: string,
    latitude: number,
    longitude: number
  ): string {
    const name = this.getResolvedNameCandidate(result, resolvedCity);
    const reliableCity = this.cleanLocationLabel(result.city || '');
    if (
      name &&
      !this.isInvalidStationNameLabel(name) &&
      this.normalizeSearchText(name) !== this.normalizeSearchText(resolvedCity)
    ) {
      return name;
    }

    if (!reliableCity || this.isInvalidStationCityLabel(reliableCity)) {
      return this.buildFallbackNameFromCoordinates(resolvedCity, latitude, longitude);
    }

    const displayNameParts = this.getMeaningfulDisplayNameParts(result.displayName);

    const firstDistinctPart = displayNameParts.find((part) =>
      !this.isInvalidStationNameLabel(part)
      && this.normalizeSearchText(this.normalizeStationName(part)) !== this.normalizeSearchText(resolvedCity)
    );

    return this.normalizeStationName(firstDistinctPart || this.buildFallbackNameFromCoordinates(resolvedCity, latitude, longitude));
  }

  private resolveLocationCityFromCoordinates(result: GeoLocationResult): string {
    return this.getResolvedCityCandidate(result);
  }

  private applyResolvedMapSelection(
    latitude: number,
    longitude: number,
    name: string,
    city: string,
    displayName?: string
  ): void {
    const currentName = this.normalizeStationName(this.stationForm.get('name')?.value || '');
    const currentCity = this.normalizeStationCity(this.stationForm.get('city')?.value || '');
    const normalizedName = this.normalizeStationName(name || '');
    const normalizedCity = this.normalizeStationCity(city || '');
    const fallbackName = !this.isInvalidStationNameLabel(normalizedCity) ? normalizedCity : '';
    const fallbackCity = !this.isInvalidStationCityLabel(normalizedName) ? normalizedName : '';
    const resolvedName = !this.isInvalidStationNameLabel(normalizedName)
      ? normalizedName
      : currentName || fallbackName;
    const resolvedCity = !this.isInvalidStationCityLabel(normalizedCity)
      ? normalizedCity
      : currentCity || fallbackCity;

    this.stationForm.patchValue({
      latitude: Number(latitude.toFixed(6)),
      longitude: Number(longitude.toFixed(6)),
      name: resolvedName,
      city: resolvedCity
    });
    this.stationForm.get('latitude')?.markAsDirty();
    this.stationForm.get('longitude')?.markAsDirty();
    this.stationForm.get('name')?.markAsDirty();
    this.stationForm.get('city')?.markAsDirty();
    this.locationSearch = [resolvedName, resolvedCity].filter(Boolean).join(', ').trim() || displayName || '';
    this.captureAutoFilledSnapshot();
    this.autoDetectedLocation = true;
    this.autoDetectedLocationApproximate = !resolvedName || !resolvedCity;

    if (!resolvedName || !resolvedCity) {
      this.geocodingError = 'Coordinates selected. Please enter the station name and city manually before saving.';
      return;
    }

    this.geocodingError = '';
  }

  private buildFallbackCityFromCoordinates(latitude: number, longitude: number): string {
    const nearestStation = this.findNearestStation(latitude, longitude);
    const nearestCity = this.getEditableStationCity(nearestStation);
    if (nearestCity) {
      return nearestCity;
    }

    const nearestName = this.getEditableStationName(nearestStation);
    if (nearestName) {
      return nearestName;
    }

    return '';
  }

  private buildFallbackNameFromCoordinates(city: string, latitude: number, longitude: number): string {
    const normalizedCity = this.normalizeStationName(city || '');
    if (normalizedCity && !this.isInvalidStationNameLabel(normalizedCity)) {
      return normalizedCity;
    }

    const nearestStation = this.findNearestStation(latitude, longitude);
    const nearestName = this.getEditableStationName(nearestStation);
    if (nearestName) {
      return nearestName;
    }

    const nearestCity = this.getEditableStationCity(nearestStation);
    if (nearestCity) {
      return nearestCity;
    }

    return '';
  }

  private findNearestStation(latitude: number, longitude: number): Station | null {
    let nearestStation: Station | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (const station of this.stations) {
      if (station.latitude == null || station.longitude == null) {
        continue;
      }

      const distanceKm = this.calculateDistanceKm(latitude, longitude, station.latitude, station.longitude);
      if (distanceKm < nearestDistance) {
        nearestDistance = distanceKm;
        nearestStation = station;
      }
    }

    if (nearestDistance > this.nearbyStationMatchRadiusKm) {
      return null;
    }

    return nearestStation;
  }

  private calculateDistanceKm(startLat: number, startLng: number, endLat: number, endLng: number): number {
    const toRadians = (value: number) => value * (Math.PI / 180);
    const earthRadiusKm = 6371;
    const deltaLat = toRadians(endLat - startLat);
    const deltaLng = toRadians(endLng - startLng);
    const originLat = toRadians(startLat);
    const destinationLat = toRadians(endLat);

    const haversine =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(originLat) * Math.cos(destinationLat) *
      Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

    return 2 * earthRadiusKm * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  }

  private getMeaningfulDisplayNameParts(displayName?: string): string[] {
    return (displayName || '')
      .split(',')
      .map((part) => this.cleanLocationLabel(part))
      .filter((part) => !!part)
      .filter((part) => !/^\d{4,}$/.test(part))
      .filter((part) => this.normalizeSearchText(part) !== 'tunisia')
      .filter((part) => !this.isGeneratedCoordinateName(part))
      .filter((part) => !this.isExplicitRouteLabel(part));
  }

  private getResolvedCityCandidate(result: GeoLocationResult): string {
    const directCity = this.normalizeStationCity(this.cleanLocationLabel(result.city || ''));
    if (directCity && !this.isInvalidStationCityLabel(directCity)) {
      return directCity;
    }

    const displayNameParts = this.getMeaningfulDisplayNameParts(result.displayName)
      .map((part) => this.normalizeStationCity(part))
      .filter((part) => !this.isInvalidStationCityLabel(part));

    if (displayNameParts.length > 1) {
      return displayNameParts[displayNameParts.length - 1];
    }

    return displayNameParts[0] || '';
  }

  private getResolvedNameCandidate(result: GeoLocationResult, resolvedCity?: string): string {
    const directName = this.normalizeStationName(this.cleanLocationLabel(result.name || ''));
    if (
      directName &&
      !this.isInvalidStationNameLabel(directName) &&
      this.normalizeSearchText(directName) !== this.normalizeSearchText(resolvedCity || '')
    ) {
      return directName;
    }

    const displayNameParts = this.getMeaningfulDisplayNameParts(result.displayName)
      .map((part) => this.normalizeStationName(part))
      .filter((part) => !this.isInvalidStationNameLabel(part));

    const distinctPart = displayNameParts.find((part) =>
      this.normalizeSearchText(part) !== this.normalizeSearchText(resolvedCity || '')
    );

    return distinctPart || displayNameParts[0] || this.normalizeStationName(resolvedCity || '');
  }

  private cleanLocationLabel(value: string): string {
    return (value || '')
      .replace(/\b\d{4,}\b/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private isAdministrativeLocationLabel(value: string): boolean {
    const normalizedValue = this.normalizeSearchText(value);
    if (!normalizedValue) {
      return true;
    }

    return this.administrativeLocationKeywords.some((keyword) => normalizedValue.includes(this.normalizeSearchText(keyword)));
  }

  private isExplicitRouteLabel(value: string): boolean {
    const normalizedValue = this.normalizeSearchText(value);
    return normalizedValue.includes('route regionale')
      || normalizedValue.includes('route nationale')
      || normalizedValue.startsWith('route ');
  }

  private normalizeStationName(value: string): string {
    return (value || '')
      .replace(/^\s*station\s+/i, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private normalizeStationCity(value: string): string {
    return (value || '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private getEditableStationName(station?: Station | null): string {
    const normalizedName = this.normalizeStationName(station?.name || '');
    return this.isInvalidStationNameLabel(normalizedName) ? '' : normalizedName;
  }

  private getEditableStationCity(station?: Station | null): string {
    const normalizedCity = this.normalizeStationCity(station?.city || '');
    return this.isInvalidStationCityLabel(normalizedCity) ? '' : normalizedCity;
  }

  private isGeneratedCoordinateName(value: string): boolean {
    const normalizedValue = this.normalizeSearchText(value || '');
    return normalizedValue.startsWith('selected location ')
      || /^selected location \d/.test(normalizedValue);
  }

  private isInvalidStationNameLabel(value: string): boolean {
    const normalizedValue = this.normalizeStationName(value);
    return !normalizedValue
      || this.isGeneratedCoordinateName(normalizedValue)
      || this.isGenericCountryLabel(normalizedValue)
      || this.isExplicitRouteLabel(normalizedValue);
  }

  private isInvalidStationCityLabel(value: string): boolean {
    const normalizedValue = this.normalizeStationCity(value);
    return !normalizedValue
      || this.isGenericCountryLabel(normalizedValue)
      || this.isGeneratedCoordinateName(normalizedValue);
  }

  private isGenericCountryLabel(value: string): boolean {
    const normalizedValue = this.normalizeSearchText(value || '');
    return normalizedValue === 'tunisia'
      || normalizedValue === 'tunisie';
  }

  private async searchLocationInTunisia(query: string): Promise<boolean> {
    try {
      this.geocodingLoading = true;
      const results = await firstValueFrom(this.transportService.geocodeLocation(query));
      const matchedResults = results.filter((result) => this.matchesLocationSearch(result));

      this.geocodingResults = [];

      if (!matchedResults.length) {
        this.geocodingError = 'Location not found in Tunisia. Try a more specific name or click on the map.';
        return false;
      }

      const exactMatch = matchedResults.find((result) => this.isExactLocationMatch(result, query));
      if (exactMatch || matchedResults.length === 1) {
        this.useGeocodingResult(exactMatch || matchedResults[0], query);
        return true;
      }

      this.geocodingResults = matchedResults.slice(0, 5);
      this.geocodingError = 'Multiple locations found. Choose the closest result below.';
      return false;
    } catch (error) {
      console.error('[HostStationsComponent] searchLocationInTunisia error:', error);
      this.geocodingError = 'Search is currently unavailable. You can still click on the map.';
      return false;
    } finally {
      this.geocodingLoading = false;
    }
  }

  private captureAutoFilledSnapshot(): void {
    this.autoFilledSnapshot = {
      name: this.stationForm.get('name')?.value || '',
      city: this.stationForm.get('city')?.value || '',
      latitude: this.stationForm.get('latitude')?.value ?? null,
      longitude: this.stationForm.get('longitude')?.value ?? null
    };
  }

  private clearAutoFilledFieldsIfUnchanged(): void {
    if (!this.autoFilledSnapshot) {
      return;
    }

    const currentName = this.stationForm.get('name')?.value || '';
    const currentCity = this.stationForm.get('city')?.value || '';
    const currentLatitude = this.stationForm.get('latitude')?.value ?? null;
    const currentLongitude = this.stationForm.get('longitude')?.value ?? null;

    if (
      currentName !== this.autoFilledSnapshot.name ||
      currentCity !== this.autoFilledSnapshot.city ||
      currentLatitude !== this.autoFilledSnapshot.latitude ||
      currentLongitude !== this.autoFilledSnapshot.longitude
    ) {
      return;
    }

    this.stationForm.patchValue({
      name: '',
      city: '',
      latitude: null,
      longitude: null
    });
    this.autoFilledSnapshot = null;
  }

  clearSelectedLocation(): void {
    this.cancelReverseGeocoding();
    this.geocodingLoading = false;

    const currentName = this.stationForm.get('name')?.value || '';
    const currentCity = this.stationForm.get('city')?.value || '';
    const currentLatitude = this.stationForm.get('latitude')?.value ?? null;
    const currentLongitude = this.stationForm.get('longitude')?.value ?? null;
    const shouldClearAutoFilledText = !!this.autoFilledSnapshot
      && currentName === this.autoFilledSnapshot.name
      && currentCity === this.autoFilledSnapshot.city;

    this.stationForm.patchValue({
      name: shouldClearAutoFilledText ? '' : currentName,
      city: shouldClearAutoFilledText ? '' : currentCity,
      latitude: null,
      longitude: null
    });

    if (currentLatitude !== null || currentLongitude !== null) {
      this.stationForm.get('latitude')?.markAsDirty();
      this.stationForm.get('longitude')?.markAsDirty();
    }

    if (shouldClearAutoFilledText) {
      this.stationForm.get('name')?.markAsDirty();
      this.stationForm.get('city')?.markAsDirty();
    }

    this.locationSearch = '';
    this.geocodingResults = [];
    this.geocodingError = '';
    this.autoDetectedLocation = false;
    this.autoDetectedLocationApproximate = false;
    this.autoFilledSnapshot = null;
  }

  private isExactLocationMatch(result: GeoLocationResult, query: string): boolean {
    const normalizedQuery = this.normalizeSearchText(query);
    if (!normalizedQuery) {
      return false;
    }

    const candidates = [
      result.name,
      result.city,
      result.displayName,
      `${result.name} ${result.city}`
    ];

    return candidates.some((candidate) => this.normalizeSearchText(candidate || '') === normalizedQuery);
  }
}
