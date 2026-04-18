import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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
  transportForm!: FormGroup;
  selectedTransport: Transport | null = null;

  loading = false;
  trajetsLoading = false;
  saving = false;

  errorMessage = '';
  successMessage = '';

  constructor(
    private transportService: TransportService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    console.log('[HostTransportsComponent] ngOnInit');
    this.initForm();
    this.loadTrajets();
    this.loadTransports();
  }

  initForm(): void {
    console.log('[HostTransportsComponent] initForm');

    this.transportForm = this.fb.group({
      departurePoint: ['', Validators.required],
      departureDate: ['', Validators.required],
      totalCapacity: [0, [Validators.required, Validators.min(1)]],
      basePrice: [0, [Validators.required, Validators.min(0)]],
      trajetId: ['', Validators.required],
      weather: ['CLEAR'],
      trafficJam: [false],
      status: ['SCHEDULED']
    });
  }

  loadTrajets(): void {
    console.log('[HostTransportsComponent] loadTrajets');
    this.trajetsLoading = true;

    this.transportService.getTrajets()
      .pipe(finalize(() => {
        this.trajetsLoading = false;
        console.log('[HostTransportsComponent] loadTrajets finished');
      }))
      .subscribe({
        next: (data: Trajet[]) => {
          console.log('[HostTransportsComponent] trajets loaded:', data);
          this.trajets = data;
        },
        error: (error: unknown) => {
          console.error('[HostTransportsComponent] loadTrajets error:', error);
          this.errorMessage = 'Unable to load routes.';
        }
      });
  }

  loadTransports(): void {
    console.log('[HostTransportsComponent] loadTransports');
    this.loading = true;

    this.transportService.getAllTransports()
      .pipe(finalize(() => {
        this.loading = false;
        console.log('[HostTransportsComponent] loadTransports finished');
      }))
      .subscribe({
        next: (data: Transport[]) => {
          console.log('[HostTransportsComponent] transports loaded:', data);
          this.transports = data;
        },
        error: (error: unknown) => {
          console.error('[HostTransportsComponent] loadTransports error:', error);
          this.errorMessage = 'Unable to load transports.';
        }
      });
  }

  editTransport(transport: Transport): void {
    console.log('[HostTransportsComponent] editTransport', transport);

    this.selectedTransport = transport;

    this.transportForm.patchValue({
      departurePoint: transport.departurePoint,
      departureDate: this.formatForDateTimeLocal(transport.departureDate),
      totalCapacity: transport.totalCapacity,
      basePrice: transport.basePrice,
      trajetId: transport.trajetId || '',
      weather: transport.weather || 'CLEAR',
      trafficJam: transport.trafficJam || false,
      status: transport.status || 'SCHEDULED'
    });
  }

  resetForm(): void {
    console.log('[HostTransportsComponent] resetForm');

    this.selectedTransport = null;
    this.transportForm.reset({
      departurePoint: '',
      departureDate: '',
      totalCapacity: 0,
      basePrice: 0,
      trajetId: '',
      weather: 'CLEAR',
      trafficJam: false,
      status: 'SCHEDULED'
    });
  }

  submitTransport(): void {
    console.log('[HostTransportsComponent] submitTransport');

    if (this.transportForm.invalid) {
      console.warn('[HostTransportsComponent] invalid form', this.transportForm.value);
      this.transportForm.markAllAsTouched();
      this.errorMessage = 'The transport form is invalid.';
      return;
    }

    const payload: Partial<Transport> = this.transportForm.value;
    console.log('[HostTransportsComponent] transport payload:', payload);

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const request$ = this.selectedTransport
      ? this.transportService.updateTransport(this.selectedTransport.id, payload)
      : this.transportService.createTransport(payload);

    request$
      .pipe(finalize(() => {
        this.saving = false;
        console.log('[HostTransportsComponent] submitTransport finished');
      }))
      .subscribe({
        next: (response: Transport) => {
          console.log('[HostTransportsComponent] submitTransport success:', response);
          this.successMessage = this.selectedTransport
            ? 'Transport updated successfully.'
            : 'Transport created successfully.';
          this.resetForm();
          this.loadTransports();
        },
        error: (error: unknown) => {
          console.error('[HostTransportsComponent] submitTransport error:', error);
          this.errorMessage = 'Failed to save the transport.';
        }
      });
  }

  deleteTransport(id: number): void {
    console.log('[HostTransportsComponent] deleteTransport', id);

    this.transportService.deleteTransport(id).subscribe({
      next: (response: unknown) => {
        console.log('[HostTransportsComponent] deleteTransport success:', response);
        this.successMessage = 'Transport deleted successfully.';
        this.loadTransports();
      },
      error: (error: unknown) => {
        console.error('[HostTransportsComponent] deleteTransport error:', error);
        this.errorMessage = 'Failed to delete the transport.';
      }
    });
  }

  getTrajetLabel(trajet: Trajet): string {
    const departure = trajet.departureStation?.city || trajet.departureStation?.name || 'N/A';
    const arrival = trajet.arrivalStation?.city || trajet.arrivalStation?.name || 'N/A';
    return `${departure} -> ${arrival}`;
  }

  private formatForDateTimeLocal(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60000);
    return localDate.toISOString().slice(0, 16);
  }
}
