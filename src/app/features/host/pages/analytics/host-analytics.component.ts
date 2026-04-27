<<<<<<< HEAD
import { Component, OnInit } from '@angular/core';
  import { AccommodationApiService } from '../../../accommodation/services/accommodation-api.service';
  import { HostReservationRow } from '../../../accommodation/models/accommodation.types';
=======
import { Component } from '@angular/core';

>>>>>>> origin/marketplace-frontend
@Component({
  selector: 'app-host-analytics',
  templateUrl: './host-analytics.component.html',
  styleUrls: ['./host-analytics.component.css']
})
<<<<<<< HEAD
export class HostAnalyticsComponent implements OnInit   {

     rows: HostReservationRow[] = [];
    loading = true;
    err: string | null = null;
  
    constructor(private api: AccommodationApiService) {}
  
    ngOnInit(): void {
      this.load();
    }
  
    load(): void {
      this.loading = true;
      this.err = null;
      this.api.hostReservations().subscribe({
        next: (list) => {
          this.rows = list;
          this.loading = false;
        },
        error: () => {
          this.rows = [];
          this.loading = false;
          this.err = 'Could not load bookings. Make sure you are signed in as a host.';
        }
      });
    }
  
    formatDate(iso: string): string {
      try {
        return new Date(iso).toLocaleString('en-US', {
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
  
    isPaid(p: string): boolean {
      return p === 'PAID';
    }
  
    isConfirmed(st: string): boolean {
      return st === 'CONFIRMED';
    }
  }
  
=======
export class HostAnalyticsComponent {
  
}
>>>>>>> origin/marketplace-frontend
