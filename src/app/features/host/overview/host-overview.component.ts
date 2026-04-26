import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

import { Reservation } from '../../tourist/models/reservation.model';
import { Transport } from '../../tourist/models/transport.model';
import {
  HostTransportAiReport,
  TransportService
} from '../../tourist/services/transport.service';
import { getCompactLocationText, getCompactRouteText } from '../../../shared/utils/location-display.util';

interface DashboardAction {
  icon: string;
  title: string;
  subtitle: string;
  route: string;
}

interface DashboardMetric {
  icon: string;
  label: string;
  value: string;
  hint: string;
  tone: 'blue' | 'orange' | 'green' | 'slate';
}

interface RouteSnapshot {
  label: string;
  reservations: number;
  seats: number;
}

interface HostOverviewSnapshot {
  transports: Transport[];
  reservations: Reservation[];
  aiReport: HostTransportAiReport | null;
  cachedAt: string;
}

@Component({
  selector: 'app-host-overview',
  templateUrl: './host-overview.component.html',
  styleUrls: ['./host-overview.component.css']
})
export class HostOverviewComponent implements OnInit {
  private readonly cacheStorageKey = 'baladna.host-overview.snapshot';

  readonly quickActions: DashboardAction[] = [
    {
      icon: 'bi bi-bus-front',
      title: 'Transport hub',
      subtitle: 'Review departures, delays and seat availability.',
      route: '/host/transports'
    },
    {
      icon: 'bi bi-ticket-detailed',
      title: 'Bookings',
      subtitle: 'Approve, reject and board passengers quickly.',
      route: '/host/bookings'
    },
    {
      icon: 'bi bi-signpost-split',
      title: 'Routes',
      subtitle: 'Extend the network with new managed trajets.',
      route: '/host/trajets'
    },
    {
      icon: 'bi bi-geo-alt',
      title: 'Stations',
      subtitle: 'Keep departure and arrival points organized.',
      route: '/host/stations'
    }
  ];

  loading = false;
  errorMessage = '';
  partialNoticeMessage = '';
  hasHydratedData = false;

  transports: Transport[] = [];
  reservations: Reservation[] = [];
  aiReport: HostTransportAiReport | null = null;

  constructor(
    private transportService: TransportService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.restoreCachedOverview();
    this.loadOverview();
  }

  get activeReservations(): Reservation[] {
    return this.reservations.filter((reservation) =>
      reservation.status !== 'CANCELLED' && reservation.status !== 'REJECTED'
    );
  }

  get upcomingTransports(): Transport[] {
    const now = new Date();

    return this.transports
      .filter((transport) => {
        const departureDate = this.toDate(transport.departureDate);
        if (!departureDate) {
          return false;
        }

        return departureDate.getTime() >= now.getTime()
          && transport.status !== 'COMPLETED'
          && transport.status !== 'CANCELLED';
      })
      .sort((left, right) => {
        const leftTime = this.toDate(left.departureDate)?.getTime() ?? 0;
        const rightTime = this.toDate(right.departureDate)?.getTime() ?? 0;
        return leftTime - rightTime;
      });
  }

  get todayBookingsCount(): number {
    return this.activeReservations.filter((reservation) => this.isToday(this.getOperationalDate(reservation))).length;
  }

  get pendingBookingsCount(): number {
    return this.reservations.filter((reservation) => reservation.status === 'PENDING_APPROVAL').length;
  }

  get totalSeatsReserved(): number {
    return this.activeReservations.reduce((total, reservation) => total + reservation.reservedSeats, 0);
  }

  get upcomingTransportsPreview(): Transport[] {
    return this.upcomingTransports.slice(0, 4);
  }

  get recentBookings(): Reservation[] {
    return [...this.reservations]
      .sort((left, right) => {
        const leftTime = this.getOperationalDate(left)?.getTime() ?? 0;
        const rightTime = this.getOperationalDate(right)?.getTime() ?? 0;
        return rightTime - leftTime;
      })
      .slice(0, 4);
  }

  get topRoutes(): RouteSnapshot[] {
    const snapshots = new Map<string, RouteSnapshot>();

    for (const reservation of this.activeReservations) {
      const routeLabel = this.getReservationRouteLabel(reservation);
      const current = snapshots.get(routeLabel) ?? {
        label: routeLabel,
        reservations: 0,
        seats: 0
      };

      current.reservations += 1;
      current.seats += reservation.reservedSeats || 0;
      snapshots.set(routeLabel, current);
    }

    return [...snapshots.values()]
      .sort((left, right) => {
        if (right.reservations !== left.reservations) {
          return right.reservations - left.reservations;
        }
        return right.seats - left.seats;
      })
      .slice(0, 3);
  }

  get noticeMessages(): string[] {
    return [];
  }

  get metrics(): DashboardMetric[] {
    return [
      {
        icon: 'bi bi-bus-front',
        label: 'Managed transports',
        value: this.formatInteger(this.transports.length),
        hint: `${this.formatInteger(this.upcomingTransports.length)} upcoming departures to monitor`,
        tone: 'blue'
      },
      {
        icon: 'bi bi-ticket-detailed',
        label: 'Active bookings',
        value: this.formatInteger(this.activeReservations.length),
        hint: `${this.formatInteger(this.pendingBookingsCount)} pending approval`,
        tone: 'orange'
      },
      {
        icon: 'bi bi-cash-stack',
        label: 'Estimated revenue',
        value: this.formatCurrency(this.aiReport?.estimatedRevenue ?? this.totalRevenueValue),
        hint: `${this.formatInteger(this.totalSeatsReserved)} seat(s) currently reserved`,
        tone: 'green'
      },
      {
        icon: 'bi bi-calendar2-check',
        label: 'Today activity',
        value: this.formatInteger(this.todayBookingsCount),
        hint: 'Bookings tied to today operations',
        tone: 'slate'
      },
      {
        icon: 'bi bi-exclamation-triangle',
        label: 'At-risk transports',
        value: this.formatInteger(this.aiReport?.atRiskTransports ?? 0),
        hint: `${this.formatInteger(this.aiReport?.lowOccupancyTransports ?? 0)} low-occupancy departure(s)`,
        tone: 'orange'
      },
      {
        icon: 'bi bi-speedometer2',
        label: 'Average occupancy',
        value: `${this.formatInteger(this.averageOccupancyRate)}%`,
        hint: this.leadingRouteLabel,
        tone: 'blue'
      }
    ];
  }

  get averageOccupancyRate(): number {
    if (this.aiReport?.averageOccupancyRate != null) {
      return Math.round(this.aiReport.averageOccupancyRate);
    }

    const eligibleTransports = this.transports.filter((transport) =>
      transport.totalCapacity != null
      && transport.totalCapacity > 0
      && transport.availableSeats != null
    );

    if (!eligibleTransports.length) {
      return 0;
    }

    const totalRate = eligibleTransports.reduce((sum, transport) => {
      const occupiedSeats = Math.max(0, transport.totalCapacity - (transport.availableSeats ?? 0));
      return sum + ((occupiedSeats / transport.totalCapacity) * 100);
    }, 0);

    return Math.round(totalRate / eligibleTransports.length);
  }

  get leadingRouteLabel(): string {
    if (this.aiReport?.topRouteLabel?.trim()) {
      return `${this.aiReport.topRouteLabel} is currently leading`;
    }

    if (this.topRoutes.length) {
      return `${this.topRoutes[0].label} is currently leading`;
    }

    return 'No dominant route yet';
  }

  navigateTo(path: string): void {
    void this.router.navigate([path]);
  }

  openTransportBookings(transportId?: number): void {
    if (transportId == null) {
      return;
    }

    void this.router.navigate(['/host/bookings'], {
      queryParams: { transportId }
    });
  }

  getTransportRouteLabel(transport: Transport): string {
    if (transport.trajetDescription?.trim()) {
      return getCompactRouteText(transport.trajetDescription);
    }

    return transport.id != null ? `Transport #${transport.id}` : 'Transport route';
  }

  getTransportDepartureLabel(transport: Transport): string {
    return getCompactLocationText(transport.departurePoint) || 'Departure point unavailable';
  }

  getTransportStatusLabel(transport: Transport): string {
    switch (transport.status) {
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      case 'IN_PROGRESS':
        return 'In progress';
      default:
        return 'Scheduled';
    }
  }

  getTransportConditionsLabel(transport: Transport): string {
    if (transport.status === 'COMPLETED' && transport.actualDelayMinutes != null) {
      return transport.actualDelayMinutes > 0
        ? `Actual +${transport.actualDelayMinutes} min`
        : 'Completed on time';
    }

    if ((transport.delayMinutes ?? 0) > 0) {
      return `Forecast +${transport.delayMinutes} min`;
    }

    if (transport.trafficCongestionLevel && transport.trafficCongestionLevel !== 'NONE') {
      return `${transport.trafficCongestionLevel.toLowerCase()} traffic`;
    }

    if (transport.trafficJam) {
      return 'Traffic flagged';
    }

    return transport.weather || 'Stable conditions';
  }

  getOccupancyLabel(transport: Transport): string {
    if (!transport.totalCapacity || transport.totalCapacity <= 0) {
      return 'Capacity unavailable';
    }

    const occupiedSeats = Math.max(0, transport.totalCapacity - (transport.availableSeats ?? 0));
    const occupancyRate = Math.round((occupiedSeats / transport.totalCapacity) * 100);
    return `${occupancyRate}% occupied`;
  }

  getReservationRouteLabel(reservation: Reservation): string {
    return getCompactRouteText(reservation.transportRoute) || 'Transport reservation';
  }

  getReservationPassengerLabel(reservation: Reservation): string {
    return reservation.userFullName?.trim() || reservation.userEmail?.trim() || 'Passenger';
  }

  getReservationBoardingPoint(reservation: Reservation): string {
    return getCompactLocationText(reservation.transportDeparturePoint || reservation.boardingPoint) || 'Boarding point unavailable';
  }

  formatDateTime(value?: string | null): string {
    const parsedDate = this.toDate(value);
    if (!parsedDate) {
      return 'Date unavailable';
    }

    return new Intl.DateTimeFormat('fr-TN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(parsedDate);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND',
      maximumFractionDigits: 0
    }).format(value || 0);
  }

  trackByTransportId(_: number, transport: Transport): number | undefined {
    return transport.id;
  }

  trackByReservationId(_: number, reservation: Reservation): number {
    return reservation.id;
  }

  trackByAction(_: number, action: DashboardAction): string {
    return action.route;
  }

  trackByMetric(_: number, metric: DashboardMetric): string {
    return metric.label;
  }

  private loadOverview(): void {
    this.loading = true;
    this.errorMessage = '';
    this.partialNoticeMessage = '';

    const failedSources: string[] = [];
    const safeRequest = <T>(source$: Observable<T>, fallbackValue: T, sourceLabel: string) =>
      source$.pipe(
        catchError((error) => {
          console.error(`[HostOverviewComponent] ${sourceLabel} error:`, error);
          failedSources.push(sourceLabel);
          return of(fallbackValue);
        })
      );

    forkJoin({
      transports: safeRequest(this.transportService.getAllTransports(), [], 'transports'),
      reservations: safeRequest(this.transportService.getAllReservations(), [], 'reservations'),
      report: safeRequest(this.transportService.getHostAiReport(), null, 'operations summary')
    })
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: ({ transports, reservations, report }) => {
          this.transports = transports;
          this.reservations = reservations;
          this.aiReport = report;
          this.hasHydratedData = true;
          this.persistOverviewSnapshot();

          if (failedSources.length) {
            this.partialNoticeMessage = `Some overview sections could not be loaded: ${failedSources.join(', ')}.`;
          }
        },
        error: (error) => {
          console.error('[HostOverviewComponent] overview load error:', error);
          this.errorMessage = 'Unable to load the host overview right now.';
        }
      });
  }

  private restoreCachedOverview(): void {
    try {
      const rawSnapshot = localStorage.getItem(this.cacheStorageKey);
      if (!rawSnapshot) {
        return;
      }

      const snapshot = JSON.parse(rawSnapshot) as HostOverviewSnapshot;
      if (!snapshot || !Array.isArray(snapshot.transports) || !Array.isArray(snapshot.reservations)) {
        return;
      }

      this.transports = snapshot.transports;
      this.reservations = snapshot.reservations;
      this.aiReport = snapshot.aiReport ?? null;
      this.hasHydratedData = true;
    } catch (error) {
      console.warn('[HostOverviewComponent] unable to restore cached snapshot', error);
    }
  }

  private persistOverviewSnapshot(): void {
    try {
      const snapshot: HostOverviewSnapshot = {
        transports: this.transports,
        reservations: this.reservations,
        aiReport: this.aiReport,
        cachedAt: new Date().toISOString()
      };

      localStorage.setItem(this.cacheStorageKey, JSON.stringify(snapshot));
    } catch (error) {
      console.warn('[HostOverviewComponent] unable to persist overview snapshot', error);
    }
  }

  private get totalRevenueValue(): number {
    return this.activeReservations.reduce((total, reservation) => total + (reservation.totalPrice || 0), 0);
  }

  private formatInteger(value: number): string {
    return new Intl.NumberFormat('fr-TN', {
      maximumFractionDigits: 0
    }).format(value || 0);
  }

  private getOperationalDate(reservation: Reservation): Date | null {
    return this.toDate(reservation.transportDepartureDate || reservation.reservationDate);
  }

  private isToday(date: Date | null): boolean {
    if (!date) {
      return false;
    }

    const now = new Date();
    return date.getFullYear() === now.getFullYear()
      && date.getMonth() === now.getMonth()
      && date.getDate() === now.getDate();
  }

  private toDate(value?: string | null): Date | null {
    if (!value) {
      return null;
    }

    const parsedDate = new Date(value);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }
}
