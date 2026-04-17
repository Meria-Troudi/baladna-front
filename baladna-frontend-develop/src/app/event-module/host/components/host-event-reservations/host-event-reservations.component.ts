import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ReservationService, Reservation } from '../../../services/reservation.service';
import { EventService } from '../../../services/event.service';
import { Event } from '../../../models/event.model';

@Component({
  selector: 'app-host-event-reservations',
  templateUrl: './host-event-reservations.component.html',
  styleUrls: ['./host-event-reservations.component.css']
})
export class HostEventReservationsComponent implements OnInit {
  @Input() eventId: number = 0;
  @Output() closed = new EventEmitter<void>();
  
  event: Event | null = null;
  reservations: Reservation[] = [];
  filteredReservations: Reservation[] = [];
  paginatedReservations: Reservation[] = [];
  loading = true;
  error = '';
  activeTab: 'ALL' | 'CONFIRMED' | 'WAITLISTED' | 'CANCELLED' = 'ALL';

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalItems: number = 0;
  totalPages: number = 1;

  // Stats
  stats = {
    confirmed: 0,
    waitlisted: 0,
    cancelled: 0,
    totalRevenue: 0
  };

  constructor(
    private route: ActivatedRoute,
    private reservationService: ReservationService,
    private eventService: EventService
  ) {}

  ngOnInit(): void {
    // If eventId is not provided via @Input, try to get it from route
    if (!this.eventId) {
      const routeId = this.route.snapshot.paramMap.get('id');
      if (routeId) {
        this.eventId = +routeId;
      }
    }
    this.loadEvent();
    this.loadReservations();
  }

  loadEvent(): void {
    this.eventService.getEventById(String(this.eventId)).subscribe({
      next: (event) => {
        this.event = event;
      },
      error: (err) => {
        console.error('Error loading event:', err);
      }
    });
  }

  loadReservations(): void {
    this.loading = true;
    this.error = '';
    this.reservationService.getEventReservations(this.eventId).subscribe({
      next: (reservations) => {
        this.reservations = reservations;
        this.calculateStats();
        this.filterReservations();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load reservations. Please try again.';
        this.loading = false;
        console.error('Error loading reservations:', err);
      }
    });
  }

  calculateStats(): void {
    this.stats.confirmed = this.reservations.filter(r => r.status === 'CONFIRMED').length;
    this.stats.waitlisted = this.reservations.filter(r => r.status === 'WAITLISTED').length;
    this.stats.cancelled = this.reservations.filter(r => r.status === 'CANCELLED').length;
    this.stats.totalRevenue = this.reservations
      .filter(r => r.status === 'CONFIRMED')
      .reduce((sum, r) => sum + (r.totalPrice || 0), 0);
  }

  filterReservations(): void {
    if (this.activeTab === 'ALL') {
      this.filteredReservations = this.reservations;
    } else {
      this.filteredReservations = this.reservations.filter(r => r.status === this.activeTab);
    }
  }

  selectTab(tab: 'ALL' | 'CONFIRMED' | 'WAITLISTED' | 'CANCELLED'): void {
    this.activeTab = tab;
    this.filterReservations();
    this.currentPage = 1;
    this.paginate();
  }

  paginate(): void {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedReservations = this.filteredReservations.slice(start, end);
    this.totalItems = this.filteredReservations.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.paginate();
    }
  }

  get paginationRange(): number[] {
    const range: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);
    
    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    
    return range;
  }

  getMinPageEnd(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'CONFIRMED': return 'status-badge confirmed';
      case 'WAITLISTED': return 'status-badge waitlisted';
      case 'CANCELLED': return 'status-badge cancelled';
      default: return 'status-badge';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getTabClass(tab: string): string {
    return this.activeTab === tab ? 'tab active' : 'tab';
  }

  closeModal(): void {
    this.closed.emit();
  }
}
