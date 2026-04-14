import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { Trajet } from '../../../../tourist/models/trajet.model';
import { Transport } from '../../../../tourist/models/transport.model';
import { TransportService } from '../../../../tourist/services/transport.service';

@Component({
  selector: 'app-host-transports',
  templateUrl: './host-transports.component.html',
  styleUrls: ['./host-transports.component.css']
})
export class HostTransportsComponent implements OnInit {
  transports: Transport[] = [];
  trajets: Trajet[] = [];
  searchTerm = '';
  transportForm!: FormGroup;
  selectedTransport: Transport | null = null;
  transportToDelete: Transport | null = null;

  loading = false;
  trajetsLoading = false;
  saving = false;

  errorMessage = '';
  successMessage = '';
  private successTimeoutId: ReturnType<typeof setTimeout> | null = null;

  readonly WEATHER_OPTIONS = ['SUNNY', 'RAIN', 'STORM', 'SANDSTORM'];
  readonly STATUS_OPTIONS = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

  minDateTime = '';

  constructor(
    private transportService: TransportService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.updateMinDateTime();
    this.initForm();
    this.loadTrajets();
    this.loadTransports();
    this.setupTrajetAutoFill();
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
      weather: ['SUNNY', Validators.required],
      trafficJam: [false],
      status: ['SCHEDULED', Validators.required]
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
        departurePoint: trajet?.departureStationName || ''
      }, { emitEvent: false });
    });
  }

  loadTrajets(): void {
    this.trajetsLoading = true;

    this.transportService.getTrajets()
      .pipe(finalize(() => this.trajetsLoading = false))
      .subscribe({
        next: (data: Trajet[]) => {
          this.trajets = data;

          const selectedId = Number(this.transportForm.get('trajetId')?.value);
          if (selectedId) {
            const trajet = this.trajets.find((item) => item.id === selectedId);
            if (trajet) {
              this.transportForm.patchValue({
                departurePoint: trajet.departureStationName || ''
              }, { emitEvent: false });
            }
          }
        },
        error: (error: any) => {
          console.error('[HostTransportsComponent] loadTrajets error:', error);
          this.errorMessage = 'Unable to load routes.';
        }
      });
  }

  loadTransports(): void {
    this.loading = true;

    this.transportService.getAllTransports()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (data: Transport[]) => {
          this.transports = data;
        },
        error: (error: any) => {
          console.error('[HostTransportsComponent] loadTransports error:', error);
          this.errorMessage = 'Unable to load transports.';
        }
      });
  }

  getTrajetLabel(trajet: Trajet): string {
    const departure = trajet.departureStationName || 'N/A';
    const arrival = trajet.arrivalStationName || 'N/A';
    return `${departure} -> ${arrival}`;
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
      trafficJam: !!transport.trafficJam,
      status: transport.status || 'SCHEDULED'
    });

    const trajet = this.trajets.find((item) => item.id === Number(transport.trajetId));
    if (trajet) {
      this.transportForm.patchValue({
        departurePoint: trajet.departureStationName || transport.departurePoint || ''
      }, { emitEvent: false });
    }
  }

  resetForm(): void {
    this.selectedTransport = null;
    this.errorMessage = '';
    this.successMessage = '';

    this.transportForm.reset({
      departurePoint: '',
      departureDate: '',
      totalCapacity: 10,
      basePrice: 1,
      trajetId: '',
      weather: 'SUNNY',
      trafficJam: false,
      status: 'SCHEDULED'
    });
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

    this.saving = true;

    const payload: Partial<Transport> = {
      departurePoint: raw.departurePoint.trim(),
      departureDate: this.toBackendDateTime(raw.departureDate),
      totalCapacity: Number(raw.totalCapacity),
      basePrice: Number(raw.basePrice),
      trajetId: Number(raw.trajetId),
      weather: raw.weather,
      trafficJam: !!raw.trafficJam,
      status: raw.status
    };

    const request$ = this.selectedTransport
      ? this.transportService.updateTransport(this.selectedTransport.id, payload)
      : this.transportService.createTransport(payload);

    request$
      .pipe(finalize(() => this.saving = false))
      .subscribe({
        next: () => {
          const wasEditing = !!this.selectedTransport;
          this.resetForm();
          this.showSuccessMessage(wasEditing ? 'Transport updated successfully.' : 'Transport created successfully.');
          this.loadTransports();
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

    if (controlName === 'weather' && control.errors['required']) {
      return 'Weather is required.';
    }

    if (controlName === 'status' && control.errors['required']) {
      return 'Status is required.';
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

    const transportId = this.transportToDelete.id;

    this.transportService.deleteTransport(transportId).subscribe({
      next: () => {
        this.transportToDelete = null;
        this.showSuccessMessage('Transport deleted successfully.');
        this.loadTransports();
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

    return this.transports.filter((transport) =>
      `${transport.departurePoint} ${transport.trajetDescription} ${transport.status} ${transport.weather}`
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
}
