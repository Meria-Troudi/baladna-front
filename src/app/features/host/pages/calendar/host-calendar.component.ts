<<<<<<< HEAD
import { Component, OnInit } from '@angular/core';
import { AccommodationApiService } from '../../../accommodation/services/accommodation-api.service';
import { HostReservationRow } from '../../../accommodation/models/accommodation.types';

interface CalendarCell {
  empty: boolean;
  dayNum?: number;
  date?: Date;
  inMonth: boolean;
  hasBooking?: boolean;
}
=======
import { Component } from '@angular/core';
>>>>>>> origin/marketplace-frontend

@Component({
  selector: 'app-host-calendar',
  templateUrl: './host-calendar.component.html',
  styleUrls: ['./host-calendar.component.css']
})
<<<<<<< HEAD
export class HostCalendarComponent implements OnInit {
  allRows: HostReservationRow[] = [];
  loading = true;
  err: string | null = null;

  viewMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  constructor(private api: AccommodationApiService) {}

  ngOnInit(): void {
    this.api.hostReservations().subscribe({
      next: (list) => {
        this.allRows = list;
        this.loading = false;
      },
      error: () => {
        this.allRows = [];
        this.loading = false;
        this.err = 'Could not load bookings.';
      }
    });
  }

  get monthTitle(): string {
    return this.viewMonthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  prevMonth(): void {
    const y = this.viewMonthStart.getFullYear();
    const m = this.viewMonthStart.getMonth();
    this.viewMonthStart = new Date(y, m - 1, 1);
  }

  nextMonth(): void {
    const y = this.viewMonthStart.getFullYear();
    const m = this.viewMonthStart.getMonth();
    this.viewMonthStart = new Date(y, m + 1, 1);
  }

  get rowsInVisibleMonth(): HostReservationRow[] {
    const y = this.viewMonthStart.getFullYear();
    const m = this.viewMonthStart.getMonth();
    const first = new Date(y, m, 1);
    const last = new Date(y, m + 1, 0, 23, 59, 59, 999);
    return this.allRows.filter((r) => this.rangeOverlapsMonth(r.checkIn, r.checkOut, first, last));
  }

  get cells(): CalendarCell[] {
    const y = this.viewMonthStart.getFullYear();
    const m = this.viewMonthStart.getMonth();
    const firstDow = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const cells: CalendarCell[] = [];

    for (let i = 0; i < firstDow; i++) {
      cells.push({ empty: true, inMonth: false, hasBooking: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(y, m, d);
      cells.push({
        empty: false,
        dayNum: d,
        date,
        inMonth: true,
        hasBooking: this.dayHasBooking(date)
      });
    }
    while (cells.length % 7 !== 0) {
      cells.push({ empty: true, inMonth: false, hasBooking: false });
    }
    return cells;
  }

  private dayHasBooking(day: Date): boolean {
    return this.allRows.some((r) => this.nightOccupiesDay(r.checkIn, r.checkOut, day));
  }

  private nightOccupiesDay(checkInIso: string, checkOutIso: string, day: Date): boolean {
    const start = this.startOfDay(new Date(checkInIso));
    const end = this.startOfDay(new Date(checkOutIso));
    const t = this.startOfDay(day).getTime();
    return t >= start.getTime() && t < end.getTime();
  }

  private rangeOverlapsMonth(checkInIso: string, checkOutIso: string, monthFirst: Date, monthLast: Date): boolean {
    const s = new Date(checkInIso).getTime();
    const e = new Date(checkOutIso).getTime();
    return s < monthLast.getTime() && e > monthFirst.getTime();
  }

  private startOfDay(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  formatShort(iso: string): string {
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
=======
export class HostCalendarComponent {
  
>>>>>>> origin/marketplace-frontend
}
