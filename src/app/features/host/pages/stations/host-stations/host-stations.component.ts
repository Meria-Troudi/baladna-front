import { Component, OnInit } from '@angular/core';
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
export class HostStationsComponent implements OnInit {
  readonly tunisiaLatitudeMin = 30.0;
  readonly tunisiaLatitudeMax = 37.6;
  readonly tunisiaLongitudeMin = 7.0;
  readonly tunisiaLongitudeMax = 11.8;

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
    this.selectedStation = station;
    this.errorMessage = '';
    this.successMessage = '';
    this.locationSearch = `${station.name} - ${station.city}`;
    this.geocodingResults = [];
    this.geocodingError = '';

    this.stationForm.patchValue({
      name: station.name,
      city: station.city,
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

    if (this.isDuplicateStation()) {
      this.errorMessage = 'A station with this name already exists in this city.';
      this.stationForm.get('name')?.markAsTouched();
      this.stationForm.get('city')?.markAsTouched();
      return;
    }

    const payload: Partial<Station> = {
      name: this.stationForm.value.name.trim(),
      city: this.stationForm.value.city.trim(),
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
      `${station.name} ${station.city} ${station.surcharge} ${station.latitude ?? ''} ${station.longitude ?? ''}`
        .toLowerCase()
        .includes(term)
    );
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
      this.clearAutoFilledFieldsIfUnchanged();
    }

    this.locationSearch = value;
    this.geocodingError = '';
    this.geocodingResults = [];
    this.geocodingLoading = false;

    if (!value.trim()) {
      return;
    }
  }

  async triggerLocationSearch(): Promise<void> {
    const query = this.locationSearch.trim();
    if (!query) {
      return;
    }

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

    this.stationForm.patchValue({
      latitude: Number(result.latitude.toFixed(6)),
      longitude: Number(result.longitude.toFixed(6)),
      city: this.stationForm.value.city?.trim() ? this.stationForm.value.city : result.city || this.stationForm.value.city,
      name: this.stationForm.value.name?.trim() ? this.stationForm.value.name : inferredName || this.stationForm.value.name
    });

    this.stationForm.get('latitude')?.markAsDirty();
    this.stationForm.get('longitude')?.markAsDirty();
    this.stationForm.get('city')?.markAsDirty();
    this.stationForm.get('name')?.markAsDirty();
    this.captureAutoFilledSnapshot();
  }

  private applyFirstGeocodingResultIfNeeded(results: GeoLocationResult[]): void {
    const firstResult = results[0];
    if (
      !firstResult ||
      !this.shouldResolveLocationFromSearch() ||
      !this.matchesLocationSearch(firstResult)
    ) {
      return;
    }

    this.useGeocodingResult(firstResult, this.locationSearch);
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
    return [...new Set(this.stations.map((station) => station.city).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b));
  }

  get stationNameSuggestions(): string[] {
    const city = (this.stationForm.get('city')?.value || '').trim().toLowerCase();
    const names = this.stations
      .filter((station) => !city || station.city.toLowerCase() === city)
      .map((station) => station.name);

    return [...new Set(names)].sort((a, b) => a.localeCompare(b));
  }

  isDuplicateStation(): boolean {
    const name = (this.stationForm.get('name')?.value || '').trim().toLowerCase();
    const city = (this.stationForm.get('city')?.value || '').trim().toLowerCase();

    if (!name || !city) return false;

    return this.stations.some((station) =>
      station.id !== this.selectedStation?.id &&
      station.name.trim().toLowerCase() === name &&
      station.city.trim().toLowerCase() === city
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

  private shouldResolveLocationFromSearch(): boolean {
    const hasSearchText = this.locationSearch.trim().length >= 2;
    const latitudeMissing = this.stationForm.get('latitude')?.value == null || this.stationForm.get('latitude')?.value === '';
    const longitudeMissing = this.stationForm.get('longitude')?.value == null || this.stationForm.get('longitude')?.value === '';
    const nameMissing = !(this.stationForm.get('name')?.value || '').trim();
    const cityMissing = !(this.stationForm.get('city')?.value || '').trim();

    return hasSearchText && (latitudeMissing || longitudeMissing || nameMissing || cityMissing);
  }

  private async resolveLocationSearchBeforeSubmit(): Promise<boolean> {
    const query = this.locationSearch.trim();

    if (!query) {
      return false;
    }

    if (this.applyLocalStationMatch(query)) {
      return true;
    }

    return this.searchLocationInTunisia(query);
  }

  private fillLocationDetailsFromCoordinates(latitude: number, longitude: number): void {
    this.cancelReverseGeocoding();
    this.geocodingError = '';

    this.reverseGeocodeSubscription = this.transportService.reverseGeocodeLocation(latitude, longitude).subscribe({
      next: (result) => {
        this.locationSearch = result.displayName || this.locationSearch;
        const resolvedName = this.resolveLocationNameFromCoordinates(result);
        const resolvedCity = this.resolveLocationCityFromCoordinates(result);

        this.stationForm.patchValue({
          city: resolvedCity || this.stationForm.value.city,
          name: resolvedName || this.stationForm.value.name
        });
        this.stationForm.get('city')?.markAsDirty();
        this.stationForm.get('name')?.markAsDirty();
        this.captureAutoFilledSnapshot();
      },
      error: (error) => {
        console.error('[HostStationsComponent] reverseGeocodeLocation error:', error);
        this.geocodingError = 'Coordinates selected, but the city could not be detected automatically.';
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
      const haystack = this.normalizeSearchText(`${station.name} ${station.city}`);
      return haystack === normalizedQuery
        || haystack.startsWith(`${normalizedQuery} `)
        || haystack.includes(` ${normalizedQuery} `)
        || haystack.endsWith(` ${normalizedQuery}`);
    });

    if (!match) {
      return false;
    }

    this.geocodingError = '';
    this.geocodingResults = [];
    this.locationSearch = `${match.name} ${match.city}`.trim();
    this.stationForm.patchValue({
      name: match.name,
      city: match.city,
      latitude: match.latitude ?? null,
      longitude: match.longitude ?? null
    });
    this.stationForm.get('name')?.markAsDirty();
    this.stationForm.get('city')?.markAsDirty();
    this.stationForm.get('latitude')?.markAsDirty();
    this.stationForm.get('longitude')?.markAsDirty();
    this.captureAutoFilledSnapshot();
    return true;
  }

  private buildStationNameFromSearch(result: GeoLocationResult, sourceQuery: string): string {
    const normalizedQuery = this.normalizeSearchText(sourceQuery);
    const normalizedCity = this.normalizeSearchText(result.city || '');
    const normalizedName = this.normalizeSearchText(result.name || '');

    if (normalizedQuery && normalizedQuery === normalizedCity) {
      return result.city || sourceQuery;
    }

    if (normalizedQuery && normalizedQuery !== normalizedName) {
      return sourceQuery;
    }

    return result.name || result.city || sourceQuery;
  }

  private resolveLocationNameFromCoordinates(result: GeoLocationResult): string {
    const name = (result.name || '').trim();
    if (name) {
      return name;
    }

    const displayNameParts = (result.displayName || '')
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);

    return displayNameParts[0] || (result.city || '').trim();
  }

  private resolveLocationCityFromCoordinates(result: GeoLocationResult): string {
    const city = (result.city || '').trim();
    if (city) {
      return city;
    }

    const displayNameParts = (result.displayName || '')
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);

    return displayNameParts[1] || displayNameParts[0] || '';
  }

  private async searchLocationInTunisia(query: string): Promise<boolean> {
    try {
      this.geocodingLoading = true;
      const results = await firstValueFrom(this.transportService.geocodeLocation(query));
      this.geocodingResults = results;

      const matchedResult = results.find((result) => this.matchesLocationSearch(result));
      if (!matchedResult) {
        this.geocodingError = 'Lieu non trouve en Tunisie. Essaie un nom plus precis ou clique sur la carte.';
        return false;
      }

      this.useGeocodingResult(matchedResult, query);
      return true;
    } catch (error) {
      console.error('[HostStationsComponent] searchLocationInTunisia error:', error);
      this.geocodingError = 'Recherche indisponible pour le moment. Tu peux toujours cliquer sur la carte.';
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
}
