import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface EventStats {
  total: number;
  active: number;
  pending: number;
  cancelled: number;
  completed: number;
  thisMonth: number;
}

interface Event {
  id: number;
  title: string;
  location: string;
  date: string;
  status: string;
  participants: number;
  price: number;
  hostName: string;
}

@Component({
  selector: 'app-events-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './events-dashboard.component.html',
  styleUrls: ['./events-dashboard.component.css']
})
export class EventsDashboardComponent implements OnInit {
  stats: EventStats = {
    total: 0,
    active: 0,
    pending: 0,
    cancelled: 0,
    completed: 0,
    thisMonth: 0
  };
  
  events: Event[] = [];
  filteredEvents: Event[] = [];
  loading = false;
  
  searchTerm = '';
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
      total: 156,
      active: 42,
      pending: 28,
      cancelled: 12,
      completed: 74,
      thisMonth: 23
    };

    this.events = [
      { id: 1, title: 'Festival des Arts Berbères', location: ' Marrakech', date: '2026-04-15', status: 'ACTIVE', participants: 245, price: 150, hostName: 'Ahmed Bennani' },
      { id: 2, title: 'Randonnée dans l\'Atlas', location: 'Ifrane', date: '2026-04-20', status: 'ACTIVE', participants: 18, price: 200, hostName: 'Fatima Zahra' },
      { id: 3, title: 'Cours de Cuisine Marocaine', location: 'Fès', date: '2026-04-18', status: 'PENDING', participants: 8, price: 350, hostName: 'Karim Tazi' },
      { id: 4, title: 'Excursion Désert Sahara', location: 'Merzouga', date: '2026-04-25', status: 'ACTIVE', participants: 32, price: 450, hostName: 'Youssef Amrani' },
      { id: 5, title: 'Tournoi de Padel', location: 'Casablanca', date: '2026-03-10', status: 'COMPLETED', participants: 64, price: 100, hostName: 'Sara Idrissi' },
      { id: 6, title: 'Atelier Poterie Traditionnelle', location: 'Safé', date: '2026-04-22', status: 'ACTIVE', participants: 12, price: 180, hostName: 'Nadia Chraibi' },
      { id: 7, title: 'Surf et Plage', location: 'Taghazout', date: '2026-05-01', status: 'PENDING', participants: 15, price: 250, hostName: 'Omar Berrada' },
      { id: 8, title: 'Dégustation Vins Marocains', location: 'Meknès', date: '2026-04-12', status: 'CANCELLED', participants: 0, price: 0, hostName: 'Lina Alaoui' },
      { id: 9, title: 'Balade en Montgolfière', location: 'Essaouira', date: '2026-05-10', status: 'ACTIVE', participants: 6, price: 800, hostName: 'Hamza Kettani' },
      { id: 10, title: 'Marché Artisanal Nocturne', location: 'Chefchaouen', date: '2026-04-30', status: 'ACTIVE', participants: 180, price: 0, hostName: 'Imane Fassi' },
    ];
    
    this.filteredEvents = [...this.events];
    this.applyFilters();
    this.loading = false;
  }

  applyFilters(): void {
    let result = [...this.events];

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(e => 
        e.title.toLowerCase().includes(term) ||
        e.location.toLowerCase().includes(term) ||
        e.hostName.toLowerCase().includes(term)
      );
    }

    if (this.statusFilter) {
      result = result.filter(e => e.status === this.statusFilter);
    }

    this.filteredEvents = result;
    this.totalPages = Math.ceil(this.filteredEvents.length / this.pageSize) || 1;
    if (this.currentPage > this.totalPages) this.currentPage = 1;
  }

  get paginatedEvents(): Event[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredEvents.slice(start, start + this.pageSize);
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
  filterByStatus(): void { this.currentPage = 1; this.applyFilters(); }
  
  resetFilters(): void {
    this.searchTerm = '';
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
}
