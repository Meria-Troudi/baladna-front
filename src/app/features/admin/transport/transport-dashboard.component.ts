import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface TransportStats {
  totalBookings: number;
  activeBookings: number;
  completedTrips: number;
  totalRevenue: number;
  avgRating: number;
  pendingRequests: number;
}

interface TransportBooking {
  id: number;
  type: string;
  departure: string;
  arrival: string;
  date: string;
  price: number;
  status: string;
  seats: number;
  providerName: string;
  vehicleType: string;
}

@Component({
  selector: 'app-transport-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transport-dashboard.component.html',
  styleUrls: ['./transport-dashboard.component.css']
})
export class TransportDashboardComponent implements OnInit {
  stats: TransportStats = {
    totalBookings: 0,
    activeBookings: 0,
    completedTrips: 0,
    totalRevenue: 0,
    avgRating: 0,
    pendingRequests: 0
  };
  
  bookings: TransportBooking[] = [];
  filteredBookings: TransportBooking[] = [];
  loading = false;
  
  searchTerm = '';
  typeFilter = '';
  statusFilter = '';
  
  currentPage = 1;
  pageSize = 8;
  totalPages = 1;

  ngOnInit(): void {
    this.loadMockData();
  }

  loadMockData(): void {
    this.loading = true;
    
    this.stats = {
      totalBookings: 234,
      activeBookings: 28,
      completedTrips: 198,
      totalRevenue: 45680,
      avgRating: 4.4,
      pendingRequests: 8
    };

    this.bookings = [
      { id: 1, type: 'taxi', departure: 'Marrakech Aéroport', arrival: 'Marrakech Médina', date: '2026-04-05 14:30', price: 150, status: 'ACTIVE', seats: 4, providerName: 'Ahmed Bennani', vehicleType: 'Toyota Camry' },
      { id: 2, type: 'bus', departure: 'Casablanca', arrival: 'Rabat', date: '2026-04-06 08:00', price: 80, status: 'PENDING', seats: 45, providerName: 'CTM', vehicleType: 'Autocar Climatisé' },
      { id: 3, type: 'voiture', departure: 'Fès', arrival: 'Meknès', date: '2026-04-07 10:00', price: 200, status: 'ACTIVE', seats: 5, providerName: 'Karim Tazi', vehicleType: 'Renault Duster' },
      { id: 4, type: 'taxi', departure: 'Essadouira Port', arrival: 'Essaouira Centre', date: '2026-04-04 16:00', price: 100, status: 'COMPLETED', seats: 4, providerName: 'Youssef Amrani', vehicleType: 'Mercedes Classe E' },
      { id: 5, type: 'bus', departure: 'Marrakech', arrival: 'Essaouira', date: '2026-04-08 09:00', price: 120, status: 'ACTIVE', seats: 50, providerName: 'Supratours', vehicleType: 'Bus Premium' },
      { id: 6, type: 'voiture', departure: 'Agadir', arrival: 'Tiznit', date: '2026-04-09 07:30', price: 350, status: 'PENDING', seats: 5, providerName: 'Fatima Zahra', vehicleType: 'Peugeot 3008' },
      { id: 7, type: 'taxi', departure: 'Chefchaouen', arrival: 'Tétouan', date: '2026-04-10 11:00', price: 180, status: 'ACTIVE', seats: 4, providerName: 'Omar Berrada', vehicleType: 'Skoda Octavia' },
      { id: 8, type: 'bus', departure: 'Tanger', arrival: 'Casablanca', date: '2026-04-11 06:00', price: 150, status: 'CANCELLED', seats: 45, providerName: 'ONCF', vehicleType: 'Train Express' },
      { id: 9, type: 'voiture', departure: 'Merzouga', arrival: 'Erfoud', date: '2026-04-12 15:00', price: 100, status: 'ACTIVE', seats: 4, providerName: 'Nadia Chraibi', vehicleType: '4x4 Land Cruiser' },
      { id: 10, type: 'taxi', departure: 'Ifrane', arrival: 'Azrou', date: '2026-04-13 09:00', price: 80, status: 'COMPLETED', seats: 4, providerName: 'Lina Alaoui', vehicleType: 'Dacia Logan' },
    ];
    
    this.filteredBookings = [...this.bookings];
    this.applyFilters();
    this.loading = false;
  }

  applyFilters(): void {
    let result = [...this.bookings];

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(b => 
        b.departure.toLowerCase().includes(term) ||
        b.arrival.toLowerCase().includes(term) ||
        b.providerName.toLowerCase().includes(term)
      );
    }

    if (this.typeFilter) {
      result = result.filter(b => b.type === this.typeFilter);
    }

    if (this.statusFilter) {
      result = result.filter(b => b.status === this.statusFilter);
    }

    this.filteredBookings = result;
    this.totalPages = Math.ceil(this.filteredBookings.length / this.pageSize) || 1;
    if (this.currentPage > this.totalPages) this.currentPage = 1;
  }

  get paginatedBookings(): TransportBooking[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredBookings.slice(start, start + this.pageSize);
  }

  get paginationRange(): number[] {
    const range: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);
    for (let i = start; i <= end; i++) range.push(i);
    return range;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) this.currentPage = page;
  }

  search(): void { this.currentPage = 1; this.applyFilters(); }
  filterByType(): void { this.currentPage = 1; this.applyFilters(); }
  filterByStatus(): void { this.currentPage = 1; this.applyFilters(); }
  
  resetFilters(): void {
    this.searchTerm = '';
    this.typeFilter = '';
    this.statusFilter = '';
    this.currentPage = 1;
    this.applyFilters();
  }

  getStatusBadgeClass(status: string): string {
    const map: { [key: string]: string } = {
      'ACTIVE': 'active',
      'PENDING': 'pending',
      'COMPLETED': 'completed',
      'CANCELLED': 'cancelled'
    };
    return map[status] || '';
  }

  getTypeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'taxi': 'bi-taxi-front',
      'bus': 'bi-bus-front',
      'voiture': 'bi-car-front'
    };
    return icons[type] || 'bi-car-front';
  }
}
