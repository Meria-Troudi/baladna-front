import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AccommodationApiService } from '../../../accommodation/services/accommodation-api.service';
import {
  Accommodation,
  AccommodationRequest,
  AccommodationType,
  RoomType
} from '../../../accommodation/models/accommodation.types';

@Component({
  selector: 'app-host-properties',
  templateUrl: './host-properties.component.html',
  styleUrls: ['./host-properties.component.css']
})
export class HostPropertiesComponent implements OnInit {
  properties: Accommodation[] = [];
  loading = false;
  saving = false;
  deletingId: string | null = null;
  errorMsg: string | null = null;

  showModal = false;
  editingId: string | null = null;
  coverFile: File | null = null;

  form: FormGroup;

  typeOptions: { value: AccommodationType; label: string }[] = [
    { value: 'GUEST_HOUSE', label: 'Guest house' },
    { value: 'CAMPING', label: 'Camping' },
    { value: 'APARTMENT', label: 'Apartment' },
    { value: 'FARM', label: 'Farm stay' },
    { value: 'OTHER', label: 'Other' }
  ];

  roomTypeOptions: { value: RoomType; label: string }[] = [
    { value: 'STANDARD', label: 'Standard' },
    { value: 'DOUBLE', label: 'Double' },
    { value: 'SUITE', label: 'Suite' },
    { value: 'DORM', label: 'Dorm / shared' },
    { value: 'FAMILY', label: 'Family' },
    { value: 'OTHER', label: 'Other' }
  ];

  constructor(
    private fb: FormBuilder,
    private api: AccommodationApiService
  ) {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(200)]],
      description: [''],
      address: ['', Validators.required],
      latitude: [null as number | null],
      longitude: [null as number | null],
      maxGuests: [2, [Validators.required, Validators.min(1)]],
      amenities: [''],
      rules: [''],
      type: ['GUEST_HOUSE' as AccommodationType, Validators.required],
      status: ['ACTIVE'],
      rooms: this.fb.array([])
    });
    this.addRoomRow();
  }

  ngOnInit(): void {
    this.load();
  }

  get rooms(): FormArray {
    return this.form.get('rooms') as FormArray;
  }

  addRoomRow(): void {
    this.rooms.push(
      this.fb.group({
        id: [''],
        type: ['STANDARD' as RoomType, Validators.required],
        capacity: [2, [Validators.required, Validators.min(1)]],
        pricePerNight: [50, [Validators.required, Validators.min(0.01)]],
        amenities: ['']
      })
    );
  }

  removeRoomRow(i: number): void {
    if (this.rooms.length <= 1) return;
    this.rooms.removeAt(i);
  }

  load(): void {
    this.loading = true;
    this.errorMsg = null;
    this.api.listMine().subscribe({
      next: (list) => {
        this.properties = list;
        this.loading = false;
      },
      error: () => {
        this.errorMsg = 'Could not load your properties. Ensure you are logged in as a host.';
        this.loading = false;
      }
    });
  }

  openCreate(): void {
    this.editingId = null;
    this.coverFile = null;
    this.form.reset({
      title: '',
      description: '',
      address: '',
      latitude: null,
      longitude: null,
      maxGuests: 2,
      amenities: '',
      rules: '',
      type: 'GUEST_HOUSE',
      status: 'ACTIVE'
    });
    this.rooms.clear();
    this.addRoomRow();
    this.showModal = true;
  }

  openEdit(p: Accommodation): void {
    this.editingId = p.id;
    this.coverFile = null;
    this.form.patchValue({
      title: p.title,
      description: p.description ?? '',
      address: p.address,
      latitude: p.latitude ?? null,
      longitude: p.longitude ?? null,
      maxGuests: p.maxGuests,
      amenities: p.amenities ?? '',
      rules: p.rules ?? '',
      type: p.type,
      status: p.status
    });
    this.rooms.clear();
    for (const r of p.rooms) {
      this.rooms.push(
        this.fb.group({
          id: [r.id ?? ''],
          type: [r.type, Validators.required],
          capacity: [r.capacity, [Validators.required, Validators.min(1)]],
          pricePerNight: [r.pricePerNight, [Validators.required, Validators.min(0.01)]],
          amenities: [r.amenities ?? '']
        })
      );
    }
    if (this.rooms.length === 0) this.addRoomRow();
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  deleteProperty(p: Accommodation, ev: Event): void {
    ev.stopPropagation();
    if (
      !confirm(
        `Delete “${p.title}”? This removes the listing, its rooms, and related reservations. This cannot be undone.`
      )
    ) {
      return;
    }
    this.deletingId = p.id;
    this.errorMsg = null;
    this.api.delete(p.id).subscribe({
      next: () => {
        this.deletingId = null;
        this.properties = this.properties.filter((x) => x.id !== p.id);
      },
      error: (e) => {
        this.deletingId = null;
        this.errorMsg = this.apiErrorMessage(
          e,
          'Could not delete this listing. Try again or check your connection.'
        );
      }
    });
  }

  private apiErrorMessage(e: unknown, fallback: string): string {
    const http = e as {
      status?: number;
      error?: { message?: string; error?: string } | string;
    };
    if (http?.status === 403) {
      return 'Access denied (403). You need a Host account and a valid session.';
    }
    if (typeof http?.error === 'string') {
      return http.error;
    }
    return http?.error?.message || http?.error?.error || fallback;
  }

  onCoverSelected(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    this.coverFile = input.files?.[0] ?? null;
  }

  useMyLocation(): void {
    if (!navigator.geolocation) {
      this.errorMsg = 'Geolocation is not supported by this browser.';
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.form.patchValue({
          latitude: Math.round(pos.coords.latitude * 1e6) / 1e6,
          longitude: Math.round(pos.coords.longitude * 1e6) / 1e6
        });
      },
      () => {
        this.errorMsg = 'Unable to read your location. Enter coordinates manually or check permissions.';
      }
    );
  }

  private buildPayload(): AccommodationRequest {
    const v = this.form.getRawValue();
    return {
      title: v.title,
      description: v.description || undefined,
      address: v.address,
      latitude: v.latitude != null && v.latitude !== '' ? Number(v.latitude) : undefined,
      longitude: v.longitude != null && v.longitude !== '' ? Number(v.longitude) : undefined,
      maxGuests: Number(v.maxGuests),
      amenities: v.amenities || undefined,
      rules: v.rules || undefined,
      type: v.type,
      status: v.status,
      rooms: v.rooms.map((r: any) => ({
        id: r.id || undefined,
        type: r.type,
        capacity: Number(r.capacity),
        pricePerNight: Number(r.pricePerNight),
        amenities: r.amenities || undefined
      }))
    };
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    this.errorMsg = null;
    const payload = this.buildPayload();

    const done = (acc: Accommodation) => {
      const uploadNext = () => {
        if (this.coverFile) {
          this.api.uploadCover(acc.id, this.coverFile).subscribe({
            next: () => {
              this.saving = false;
              this.showModal = false;
              this.load();
            },
            error: () => {
              this.saving = false;
              this.errorMsg = 'Saved listing but cover image upload failed.';
              this.load();
            }
          });
        } else {
          this.saving = false;
          this.showModal = false;
          this.load();
        }
      };

      uploadNext();
    };

    if (this.editingId) {
      this.api.update(this.editingId, payload).subscribe({
        next: done,
        error: (e) => {
          this.saving = false;
          this.errorMsg = this.apiErrorMessage(
            e,
            'Update failed. Check the API and your Host role.'
          );
        }
      });
    } else {
      this.api.create(payload).subscribe({
        next: done,
        error: (e) => {
          this.saving = false;
          this.errorMsg = this.apiErrorMessage(
            e,
            'Could not create property. Check the API is running, MySQL enums match the app, or see the server message.'
          );
        }
      });
    }
  }

  typeLabel(t: AccommodationType): string {
    return this.typeOptions.find((o) => o.value === t)?.label ?? t;
  }

  get totalRoomCount(): number {
    return this.properties.reduce((n, p) => n + (p.rooms?.length || 0), 0);
  }
}
