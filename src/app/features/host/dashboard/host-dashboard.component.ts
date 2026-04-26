import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AccommodationApiService } from '../../accommodation/services/accommodation-api.service';
import {
  Accommodation,
  HostReservationRow
} from '../../accommodation/models/accommodation.types';

@Component({
  selector: 'app-host-dashboard',
  templateUrl: './host-dashboard.component.html',
  styleUrls: ['./host-dashboard.component.css']
})
export class HostDashboardComponent implements OnInit {
  properties: Accommodation[] = [];
  reservations: HostReservationRow[] = [];
  loading = true;
  err: string | null = null;

  constructor(
    private router: Router,
    private api: AccommodationApiService
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.err = null;
    this.api.listMine().subscribe({
      next: (list) => {
        this.properties = list;
        this.api.hostReservations().subscribe({
          next: (rows) => {
            this.reservations = rows;
            this.loading = false;
          },
          error: () => {
            this.reservations = [];
            this.loading = false;
            this.err = 'Could not load bookings.';
          }
        });
      },
      error: () => {
        this.loading = false;
        this.err = 'Could not load your listings.';
      }
    });
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  get totalRooms(): number {
    return this.properties.reduce((n, a) => n + (a.rooms?.length ?? 0), 0);
  }

  /** Listings with ACTIVE status (live). */
  get activeListings(): number {
    return this.properties.filter((a) => a.status === 'ACTIVE').length;
  }

  get lastReservation(): HostReservationRow | null {
    return this.reservations.length > 0 ? this.reservations[0] : null;
  }

  formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return iso;
    }
  }

  formatMoney(v: number | null): string {
    if (v == null) return '—';
    return `${Number(v).toFixed(2)} TND`;
  }
}