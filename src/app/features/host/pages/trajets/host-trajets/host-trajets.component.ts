import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { Station } from '../../../../tourist/models/station.model';
import { Trajet } from '../../../../tourist/models/trajet.model';
import { TransportService } from '../../../../tourist/services/transport.service';

@Component({
  selector: 'app-host-trajets',
  templateUrl: './host-trajets.component.html',
  styleUrls: ['./host-trajets.component.css']
})
export class HostTrajetsComponent implements OnInit {
  trajets: Trajet[] = [];
  stations: Station[] = [];
  searchTerm = '';
  trajetForm!: FormGroup;
  selectedTrajet: Trajet | null = null;

  loading = false;
  stationsLoading = false;
  saving = false;

  errorMessage = '';
  successMessage = '';
  private successTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private transportService: TransportService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadStations();
    this.loadTrajets();
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
        error: () => this.errorMessage = 'Unable to load stations.'
      });
  }

  loadTrajets(): void {
    this.loading = true;

    this.transportService.getTrajets()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (data: Trajet[]) => this.trajets = data,
        error: () => this.errorMessage = 'Unable to load routes.'
      });
  }

  editTrajet(trajet: Trajet): void {
    this.selectedTrajet = trajet;
    this.errorMessage = '';
    this.successMessage = '';

    this.trajetForm.patchValue({
      departureStationId: trajet.departureStationId || '',
      arrivalStationId: trajet.arrivalStationId || '',
      distanceKm: trajet.distanceKm || 1,
      estimatedDurationMinutes: trajet.estimatedDurationMinutes || 1,
      pricePerKm: trajet.pricePerKm || 0.01
    });
  }

  resetForm(): void {
    this.selectedTrajet = null;
    this.errorMessage = '';
    this.successMessage = '';

    this.trajetForm.reset({
      departureStationId: '',
      arrivalStationId: '',
      distanceKm: 1,
      estimatedDurationMinutes: 1,
      pricePerKm: 0.01
    });
  }

  submitTrajet(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.trajetForm.invalid) {
      this.trajetForm.markAllAsTouched();
      this.errorMessage = 'Please fix the highlighted fields.';
      return;
    }

    const payload: Partial<Trajet> = {
      departureStationId: Number(this.trajetForm.value.departureStationId),
      arrivalStationId: Number(this.trajetForm.value.arrivalStationId),
      distanceKm: Number(this.trajetForm.value.distanceKm),
      estimatedDurationMinutes: Number(this.trajetForm.value.estimatedDurationMinutes),
      pricePerKm: Number(this.trajetForm.value.pricePerKm)
    };

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
          this.showSuccessMessage(wasEditing ? 'Route updated successfully.' : 'Route created successfully.');
          this.loadTrajets();
        },
        error: (error: any) => {
          console.error('[HostTrajetsComponent] submitTrajet error:', error);
          if (error?.error && typeof error.error === 'object') {
            this.errorMessage = Object.values(error.error).join(', ') || 'Saving failed.';
          } else {
            this.errorMessage = error?.error?.message || 'Failed to save the route.';
          }
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

  deleteTrajet(id: number): void {
    if (!confirm('Are you sure you want to delete this route?')) return;

    this.transportService.deleteTrajet(id).subscribe({
      next: () => {
        this.showSuccessMessage('Route deleted successfully.');
        this.loadTrajets();
      },
      error: () => {
        this.errorMessage = 'Failed to delete the route.';
      }
    });
  }

  getStationLabel(station?: Station): string {
    if (!station) return 'N/A';
    return `${station.name} - ${station.city}`;
  }

  get filteredTrajets(): Trajet[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.trajets;

    return this.trajets.filter((trajet) =>
      `${trajet.departureStationName} ${trajet.arrivalStationName} ${trajet.distanceKm} ${trajet.pricePerKm}`
        .toLowerCase()
        .includes(term)
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
}
