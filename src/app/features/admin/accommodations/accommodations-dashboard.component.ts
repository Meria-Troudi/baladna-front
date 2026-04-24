import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface AccommodationStats {
  total: number;
  active: number;
  pending: number;
  booked: number;
  available: number;
  avgRating: number;
}

interface Accommodation {
  id: number;
  name: string;
  type: string;
  location: string;
  price: number;
  status: string;
  rooms: number;
  rating: number;
  hostName: string;
  image: string;
}

@Component({
  selector: 'app-accommodations-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './accommodations-dashboard.component.html',
  styleUrls: ['./accommodations-dashboard.component.css']
})
export class AccommodationsDashboardComponent implements OnInit {
  stats: AccommodationStats = {
    total: 0,
    active: 0,
    pending: 0,
    booked: 0,
    available: 0,
    avgRating: 0
  };
  
  accommodations: Accommodation[] = [];
  filteredAccommodations: Accommodation[] = [];
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
      total: 89,
      active: 72,
      pending: 17,
      booked: 34,
      available: 55,
      avgRating: 4.2
    };

    this.accommodations = [
      { id: 1, name: 'Riad традиционного Маrocan', type: 'riad', location: 'Marrakech Médina', price: 850, status: 'ACTIVE', rooms: 5, rating: 4.8, hostName: 'Ahmed Bennani', image: 'riad' },
      { id: 2, name: 'Villa avec Piscine', type: 'villa', location: 'Casablanca Marina', price: 2500, status: 'BOOKED', rooms: 8, rating: 4.6, hostName: 'Sara Idrissi', image: 'villa' },
      { id: 3, name: 'Appartement Centre-Ville', type: 'apartment', location: 'Rabat Agdal', price: 450, status: 'ACTIVE', rooms: 3, rating: 4.3, hostName: 'Karim Tazi', image: 'apt' },
      { id: 4, name: 'Maison d\'Hôte Authentique', type: 'guesthouse', location: 'Chefchaouen', price: 380, status: 'ACTIVE', rooms: 6, rating: 4.9, hostName: 'Lina Alaoui', image: 'house' },
      { id: 5, name: 'Dar традиционного avec Patio', type: 'dar', location: 'Fès Batha', price: 650, status: 'PENDING', rooms: 4, rating: 4.7, hostName: 'Youssef Amrani', image: 'dar' },
      { id: 6, name: ' Chalet Montagne', type: 'chalet', location: 'Ifrane', price: 950, status: 'BOOKED', rooms: 4, rating: 4.5, hostName: 'Fatima Zahra', image: 'chalet' },
      { id: 7, name: 'Bungalow Plage', type: 'bungalow', location: 'Taghazout', price: 550, status: 'ACTIVE', rooms: 2, rating: 4.2, hostName: 'Omar Berrada', image: 'bungalow' },
      { id: 8, name: 'Penthouse Luxe', type: 'penthouse', location: 'Marrakech Hivernage', price: 3500, status: 'ACTIVE', rooms: 5, rating: 4.9, hostName: 'Hamza Kettani', image: 'penthouse' },
      { id: 9, name: 'Auberge Traditionnelle', type: 'hostel', location: 'Essaouira', price: 120, status: 'ACTIVE', rooms: 12, rating: 4.1, hostName: 'Nadia Chraibi', image: 'hostel' },
      { id: 10, name: 'Maison Bleue', type: 'traditional', location: 'Chefchaouen', price: 420, status: 'PENDING', rooms: 3, rating: 4.8, hostName: 'Imane Fassi', image: 'bluehouse' },
    ];
    
    this.filteredAccommodations = [...this.accommodations];
    this.applyFilters();
    this.loading = false;
  }

  applyFilters(): void {
    let result = [...this.accommodations];

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(a => 
        a.name.toLowerCase().includes(term) ||
        a.location.toLowerCase().includes(term) ||
        a.hostName.toLowerCase().includes(term)
      );
    }

    if (this.typeFilter) {
      result = result.filter(a => a.type === this.typeFilter);
    }

    if (this.statusFilter) {
      result = result.filter(a => a.status === this.statusFilter);
    }

    this.filteredAccommodations = result;
    this.totalPages = Math.ceil(this.filteredAccommodations.length / this.pageSize) || 1;
    if (this.currentPage > this.totalPages) this.currentPage = 1;
  }

  get paginatedAccommodations(): Accommodation[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredAccommodations.slice(start, start + this.pageSize);
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
      'BOOKED': 'booked'
    };
    return map[status] || '';
  }

  getTypeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'riad': 'bi-building',
      'villa': 'bi-house-door',
      'apartment': 'bi-building',
      'guesthouse': 'bi-hospital',
      'dar': 'bi-house',
      'chalet': 'bi-snow',
      'bungalow': 'bi-umbrella',
      'penthouse': 'bi-star',
      'hostel': 'bi-bed',
      'traditional': 'bi-house-heart'
    };
    return icons[type] || 'bi-building';
  }
}
