import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { Station } from '../../../../tourist/models/station.model';
import { TransportService } from '../../../../tourist/services/transport.service';

@Component({
  selector: 'app-host-stations',
  templateUrl: './host-stations.component.html',
  styleUrls: ['./host-stations.component.css']
})
export class HostStationsComponent implements OnInit {
  stations: Station[] = [];
  searchTerm = '';
  stationForm!: FormGroup;
  selectedStation: Station | null = null;

  loading = false;
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
  }

  initForm(): void {
    this.stationForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      city: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      surcharge: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      downtown: [false, Validators.required]
    });
  }

  loadStations(): void {
    this.loading = true;

    this.transportService.getStations()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (data: Station[]) => {
          this.stations = data;
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

    this.stationForm.patchValue({
      name: station.name,
      city: station.city,
      surcharge: station.surcharge,
      downtown: station.downtown
    });
  }

  resetForm(): void {
    this.selectedStation = null;
    this.errorMessage = '';
    this.successMessage = '';
    this.stationForm.reset({
      name: '',
      city: '',
      surcharge: 0,
      downtown: false
    });
  }

  submitStation(): void {
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

    return '';
  }

  deleteStation(id: number): void {
    if (!confirm('Are you sure you want to delete this station?')) return;

    this.transportService.deleteStation(id).subscribe({
      next: () => {
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
      `${station.name} ${station.city} ${station.surcharge}`.toLowerCase().includes(term)
    );
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
}
