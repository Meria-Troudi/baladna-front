import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { Reservation } from '../../tourist/models/reservation.model';
import { Station } from '../../tourist/models/station.model';
import { Trajet } from '../../tourist/models/trajet.model';
import { Transport } from '../../tourist/models/transport.model';
import { TransportService } from '../../tourist/services/transport.service';

interface TransportStatCard {
  label: string;
  value: string;
  icon: string;
}

interface ChartBar {
  label: string;
  value: number;
  ratio: number;
}

interface PieSlice {
  label: string;
  value: number;
  color: string;
  ratio: number;
}

@Component({
  selector: 'app-host-dashboard',
  templateUrl: './host-dashboard.component.html',
  styleUrls: ['./host-dashboard.component.css']
})
export class HostDashboardComponent implements OnInit {
  loadingTransportStats = false;
  transportStats: TransportStatCard[] = [];
  routeUsageBars: ChartBar[] = [];
  stationDepartureBars: ChartBar[] = [];
  reservationTrendBars: ChartBar[] = [];
  statusSlices: PieSlice[] = [];

  constructor(
    private router: Router,
    private transportService: TransportService
  ) {}

  ngOnInit(): void {
    this.loadTransportDashboard();
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  private loadTransportDashboard(): void {
    this.loadingTransportStats = true;

    forkJoin({
      stations: this.transportService.getStations(),
      routes: this.transportService.getTrajets(),
      transports: this.transportService.getAllTransports(),
      reservations: this.transportService.getAllReservations()
    }).subscribe({
      next: ({ stations, routes, transports, reservations }) => {
        this.buildTransportStats(stations, routes, transports, reservations);
        this.loadingTransportStats = false;
      },
      error: () => {
        this.loadingTransportStats = false;
      }
    });
  }

  private buildTransportStats(
    stations: Station[],
    routes: Trajet[],
    transports: Transport[],
    reservations: Reservation[]
  ): void {
    const activeReservations = reservations.filter((reservation) => reservation.status !== 'CANCELLED');
    const totalSeats = transports.reduce((sum, transport) => sum + (transport.totalCapacity || 0), 0);
    const availableSeats = transports.reduce((sum, transport) => sum + (transport.availableSeats || 0), 0);
    const occupiedSeats = Math.max(0, totalSeats - availableSeats);
    const occupancyRate = totalSeats ? Math.round((occupiedSeats / totalSeats) * 100) : 0;
    const cancelledReservations = reservations.filter((reservation) => reservation.status === 'CANCELLED').length;
    const cancellationRate = reservations.length ? Math.round((cancelledReservations / reservations.length) * 100) : 0;

    this.transportStats = [
      { label: 'Stations', value: `${stations.length}`, icon: 'bi-geo-alt-fill' },
      { label: 'Routes', value: `${routes.length}`, icon: 'bi-signpost-split-fill' },
      { label: 'Transports', value: `${transports.length}`, icon: 'bi-bus-front-fill' },
      { label: 'Reservations', value: `${activeReservations.length}`, icon: 'bi-ticket-perforated-fill' },
      { label: 'Occupancy Rate', value: `${occupancyRate}%`, icon: 'bi-people-fill' },
      { label: 'Cancellation Rate', value: `${cancellationRate}%`, icon: 'bi-pie-chart-fill' }
    ];

    this.routeUsageBars = this.buildBarsFromCounts(
      this.countBy(reservations, (reservation) => reservation.transportRoute || 'Unknown route'),
      5
    );

    this.stationDepartureBars = this.buildBarsFromCounts(
      this.countBy(transports, (transport) => transport.departurePoint || 'Unknown station'),
      5
    );

    this.reservationTrendBars = this.buildBarsFromCounts(
      this.countBy(reservations, (reservation) => this.getDateKey(reservation.reservationDate)),
      7
    ).reverse();

    this.statusSlices = this.buildPieSlices(transports);
  }

  private countBy<T>(items: T[], keySelector: (item: T) => string): Record<string, number> {
    return items.reduce<Record<string, number>>((acc, item) => {
      const key = keySelector(item);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  private buildBarsFromCounts(counts: Record<string, number>, limit: number): ChartBar[] {
    const entries = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

    const max = entries[0]?.[1] || 1;

    return entries.map(([label, value]) => ({
      label,
      value,
      ratio: Math.max(10, Math.round((value / max) * 100))
    }));
  }

  private buildPieSlices(transports: Transport[]): PieSlice[] {
    const colors: Record<string, string> = {
      SCHEDULED: '#f7971e',
      IN_PROGRESS: '#4f75ba',
      COMPLETED: '#16a34a',
      CANCELLED: '#ef4444'
    };

    const counts = this.countBy(transports, (transport) => transport.status || 'UNKNOWN');
    const total = transports.length || 1;

    return Object.entries(counts).map(([label, value]) => ({
      label,
      value,
      color: colors[label] || '#64748b',
      ratio: Math.round((value / total) * 100)
    }));
  }

  private getDateKey(value: string): string {
    if (!value) return 'Unknown';
    return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  }
}
