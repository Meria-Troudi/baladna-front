import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EventService } from '../../../services/event.service';
import { CategoryService } from '../../../services/category.service';
import { ReservationService, Reservation } from '../../../services/reservation.service';
import { RecommendationService, RecommendationResult } from '../../../services/recommendation.service';
import { Event, EventStatus } from '../../../models/event.model';

@Component({
  selector: 'app-events-list',
  templateUrl: './events-list.component.html',
  styleUrls: ['./events-list.component.css']
})
export class EventsListComponent implements OnInit {

  Math = Math;
  events: Event[] = [];
  confirmedReservations: { [key: string]: boolean } = {};
  
  private isReserved(event: Event): boolean {
    const key = event.id?.toString() || '';
    return !!this.confirmedReservations[key];
  }
  selectedCategory: string = '';
  loading: boolean = false;
  error: string = '';

  categories: string[] = [];
  allEvents: Event[] = [];

  // Search and Sort
  searchTerm: string = '';
  sortBy: string = 'date';

  // Advanced filters
  showAdvanced: boolean = false;
  locationFilter: string = '';
  dateFrom: string = '';
  dateTo: string = '';
  minPrice: number = 0;
  maxPrice: number = 500;
  globalMaxPrice: number = 500;
  showAvailableOnly: boolean = false;
  showReservedOnly: boolean = false;

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 8;
  totalItems: number = 0;
  totalPages: number = 0;
  maxPageButtons: number = 5;

  // Detail view & modals
  selectedEvent: Event | null = null;
  showReservationsModal = false;
  showReservationFormModal = false;
  selectedEventForReservation: Event | null = null;

  // Recommendation scores
  recommendationScores = new Map<number, number>();
  recommendedLoading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventService: EventService,
    private categoryService: CategoryService,
    private reservationService: ReservationService,
    private recommendationService: RecommendationService
  ) { }

  ngOnInit() {
    this.loadCategories();
    this.loadUserReservations();
    this.route.queryParams.subscribe(params => {
      const category = params['category'];
      if (category !== this.selectedCategory || this.allEvents.length === 0) {
        this.selectedCategory = category || '';
        this.currentPage = 1;
        this.loadEvents(category);
      }
    });
    this.loadRecommendationScores();
  }

  loadUserReservations() {
    this.reservationService.getMyReservations().subscribe({
      next: (reservations: Reservation[]) => {
        this.confirmedReservations = {};
        reservations.forEach(r => {
          if (r.status === 'CONFIRMED' && r.event?.id) {
            this.confirmedReservations[r.event.id] = true;
          }
        });
        this.applyFiltersAndSort(); // refresh if needed
      },
      error: () => this.confirmedReservations = {}
    });
  }

  loadRecommendationScores(): void {
    this.recommendedLoading = true;
    this.recommendationService.getPersonalizedRecommendations().subscribe({
      next: (recs: RecommendationResult[]) => {
        this.recommendationScores = new Map(recs.map(r => [r.eventId, r.score]));
        this.recommendedLoading = false;
        this.applyFiltersAndSort();
      },
      error: () => {
        this.recommendedLoading = false;
        this.applyFiltersAndSort();
      }
    });
  }

  loadEvents(category: string) {
    this.loading = true;
    this.error = '';
    this.eventService.getAllEvents().subscribe({
      next: (events: Event[]) => {
        this.allEvents = events;
        // Calculate global max price for slider
        const prices = events.map(e => e.price || 0);
        this.globalMaxPrice = Math.max(...prices, 500);
        this.maxPrice = this.globalMaxPrice;
        this.applyFiltersAndSort();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load events. Please try again.';
        this.loading = false;
      }
    });
  }

  loadCategories() {
    this.categoryService.getCategories().subscribe({
      next: (categories) => this.categories = categories,
      error: (err) => console.error(err)
    });
  }

  selectCategory(category: string) {
    this.selectedCategory = category;
    this.currentPage = 1;
    this.router.navigate(['/tourist/events/list'], { queryParams: { category }, queryParamsHandling: 'merge' });
    this.loadEvents(category);
  }

  onSearchChange() { this.currentPage = 1; this.applyFiltersAndSort(); }
  onSortChange() { this.currentPage = 1; this.applyFiltersAndSort(); }
  onFilterChange() { this.currentPage = 1; this.applyFiltersAndSort(); }

  private applyFiltersAndSort(): void {
    let filtered = [...this.allEvents];
    filtered = filtered.filter(event => event.status === EventStatus.UPCOMING);

    // Category filter (if selected)
    if (this.selectedCategory) {
      filtered = filtered.filter(event => event.category === this.selectedCategory);
    }

    // Search term
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(event =>
        event.title?.toLowerCase().includes(term) ||
        event.description?.toLowerCase().includes(term) ||
        event.location?.toLowerCase().includes(term)
      );
    }

    // Location filter (partial match)
    if (this.locationFilter) {
      const loc = this.locationFilter.toLowerCase();
      filtered = filtered.filter(event => event.location?.toLowerCase().includes(loc));
    }

    // Date range
    if (this.dateFrom) {
      const from = new Date(this.dateFrom);
      filtered = filtered.filter(event => event.startAt && new Date(event.startAt) >= from);
    }
    if (this.dateTo) {
      const to = new Date(this.dateTo);
      filtered = filtered.filter(event => event.startAt && new Date(event.startAt) <= to);
    }

    // Price range
    filtered = filtered.filter(event => (event.price || 0) >= this.minPrice && (event.price || 0) <= this.maxPrice);

    // Available only (seats left)
    if (this.showAvailableOnly) {
      filtered = filtered.filter(event => (event.capacity || 0) > (event.bookedSeats || 0));
    }

  // Reserved only (user already booked)
  if (this.showReservedOnly) {
    filtered = filtered.filter(event => this.isReserved(event));
  }

    // Sorting
    switch (this.sortBy) {
      case 'date':
        filtered.sort((a, b) => (a.startAt ? new Date(a.startAt).getTime() : 0) - (b.startAt ? new Date(b.startAt).getTime() : 0));
        break;
      case 'price':
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'rating':
        filtered.sort((a, b) => ((b as any).avgRating || 0) - ((a as any).avgRating || 0));
        break;
      case 'recommended':
        filtered = filtered.filter(event => this.recommendationScores.has(Number(event.id)));
        filtered.sort((a, b) => (this.recommendationScores.get(Number(b.id)) || 0) - (this.recommendationScores.get(Number(a.id)) || 0));
        break;
    }

    this.totalItems = filtered.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.events = filtered.slice(start, start + this.itemsPerPage);
  }

  // Pagination (same as before)
  goToPage(page: number | string) { if (typeof page === 'number' && page >= 1 && page <= this.totalPages) { this.currentPage = page; this.applyFiltersAndSort(); window.scrollTo({ top: 0, behavior: 'smooth' }); } }
  nextPage() { if (this.currentPage < this.totalPages) this.goToPage(this.currentPage + 1); }
  prevPage() { if (this.currentPage > 1) this.goToPage(this.currentPage - 1); }
  getPageNumbers(): number[] {
    const pages = [];
    const start = Math.max(1, this.currentPage - Math.floor(this.maxPageButtons / 2));
    const end = Math.min(this.totalPages, start + this.maxPageButtons - 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  toggleAdvanced() { this.showAdvanced = !this.showAdvanced; }
  clearSearch() { this.searchTerm = ''; this.onSearchChange(); }
  clearFilters() {
    this.selectedCategory = '';
    this.searchTerm = '';
    this.locationFilter = '';
    this.dateFrom = '';
    this.dateTo = '';
    this.minPrice = 0;
    this.maxPrice = this.globalMaxPrice;
    this.showAvailableOnly = false;
    this.showReservedOnly = false;
    this.sortBy = 'date';
    this.showAdvanced = false;
    this.currentPage = 1;
    this.router.navigate(['.'], { relativeTo: this.route, queryParams: {} });
    this.loadEvents('');
  }
  hasActiveFilters(): boolean {
    return !!this.selectedCategory || !!this.searchTerm || !!this.locationFilter || !!this.dateFrom || !!this.dateTo ||
           this.minPrice > 0 || this.maxPrice < this.globalMaxPrice || this.showAvailableOnly || this.showReservedOnly;
  }

  viewEventDetails(event: Event) { this.selectedEvent = event; }
  closeDetailView() { this.selectedEvent = null; }
  goBackToHome() { this.router.navigate(['/tourist/events']); }
  goToMyReservations() { this.showReservationsModal = true; }
  closeReservationsModal() { this.showReservationsModal = false; }
  onBookEvent(event: Event) { this.selectedEventForReservation = event; this.showReservationFormModal = true; }
  onReservationSuccess(reservation: Reservation) { this.showReservationFormModal = false; this.selectedEventForReservation = null; this.loadUserReservations(); this.applyFiltersAndSort(); }
  closeReservationFormModal() { this.showReservationFormModal = false; this.selectedEventForReservation = null; }
}