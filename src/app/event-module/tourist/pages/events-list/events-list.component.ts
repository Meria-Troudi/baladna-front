import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EventService } from '../../../services/event.service';
import { CategoryService } from '../../../services/category.service';
import { ReservationService, Reservation } from '../../../services/reservation.service';
import { Event, EventStatus } from '../../../models/event.model';

@Component({
  selector: 'app-events-list',
  templateUrl: './events-list.component.html',
  styleUrls: ['./events-list.component.css']
})
export class EventsListComponent implements OnInit {

  Math = Math; // Expose Math to template
  events: Event[] = [];
  confirmedReservations: { [eventId: number]: boolean } = {};
  selectedCategory: string = '';
  loading: boolean = false;
  error: string = '';

  categories: string[] = [];
  allEvents: Event[] = [];

  // Search and Sort
  searchTerm: string = '';
  sortBy: string = 'date';

  // Advanced Filters Toggle
  showAdvanced: boolean = false;

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 8; // 4 columns × 2 rows
  totalItems: number = 0;
  totalPages: number = 0;
  maxPageButtons: number = 5;

  // Detail view state (like host-events)
  selectedEvent: Event | null = null;

  // Reservations Modal
  showReservationsModal = false;

  // Removed reservedEventIds/paidEventIds logic: use reservation.status and paymentStatus from backend only

  // Reservation form modal
  showReservationFormModal = false;
  selectedEventForReservation: Event | null = null;


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventService: EventService,
    private categoryService: CategoryService,
    private reservationService: ReservationService
  ) { }

  ngOnInit() {
    // Load categories from backend
    this.loadCategories();

    // Fetch confirmed reservations for user
    this.reservationService.getMyReservations().subscribe({
      next: (reservations: Reservation[]) => {
        this.confirmedReservations = {};
        reservations.forEach(r => {
          if (r.status === 'CONFIRMED' && r.event?.id) {
            this.confirmedReservations[r.event.id] = true;
          }
        });
      },
      error: () => {
        this.confirmedReservations = {};
      }
    });

    // Subscribe to query params changes (for back/forward navigation and external links)
    this.route.queryParams.subscribe(params => {
      const category = params['category'];
      // Only load events if category changed or if this is the initial load
      if (category !== this.selectedCategory || this.allEvents.length === 0) {
        this.selectedCategory = category || '';
        this.currentPage = 1; // Reset to first page when category changes
        this.loadEvents(category);
      }
    });
  }

  loadEvents(category: string) {
    this.loading = true;
    this.error = '';

    // Get events from backend
    this.eventService.getAllEvents().subscribe({
      next: (events: Event[]) => {
        console.log('Events loaded from backend:', events);
        this.allEvents = events;
        
        // Apply filters and sorting
        this.applyFiltersAndSort();
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error loading events:', err);
        this.error = 'Failed to load events. Please try again.';
        this.loading = false;
      }
    });
  }

  loadCategories() {
    this.categoryService.getCategories().subscribe({
      next: (categories: string[]) => {
        console.log('Categories loaded for filter:', categories);
        this.categories = categories;
      },
      error: (err: any) => {
        console.error('Error loading categories:', err);
      }
    });
  }

  selectCategory(category: string) {
    this.selectedCategory = category;
    this.currentPage = 1; // Reset to first page when category changes
    this.router.navigate(['/tourist/events/list'], {
      queryParams: { category },
      queryParamsHandling: 'merge',
      skipLocationChange: false
    });
    // Force reload of events with the new category
    this.loadEvents(category);
  }

  // Search and Sort functionality
  onSearchChange(): void {
    this.currentPage = 1; // Reset to first page when search changes
    this.applyFiltersAndSort();
  }

  onSortChange(): void {
    this.currentPage = 1; // Reset to first page when sort changes
    this.applyFiltersAndSort();
  }

  private applyFiltersAndSort(): void {
    let filtered = [...this.allEvents];

    // Filter only upcoming events (prevent booking past events)
    filtered = filtered.filter(event => event.status === EventStatus.UPCOMING);

    // Filter by category
    if (this.selectedCategory) {
      filtered = filtered.filter(event => event.category === this.selectedCategory);
    }

    // Filter by search term
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(event =>
        event.title?.toLowerCase().includes(term) ||
        event.description?.toLowerCase().includes(term) ||
        event.location?.toLowerCase().includes(term)
      );
    }

    // Sort
    switch (this.sortBy) {
      case 'date':
        filtered.sort((a, b) => {
          const dateA = a.startAt ? new Date(a.startAt).getTime() : 0;
          const dateB = b.startAt ? new Date(b.startAt).getTime() : 0;
          return dateA - dateB;
        });
        break;
      case 'price':
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'rating':
        filtered.sort((a, b) => ((b as any).avgRating || 0) - ((a as any).avgRating || 0));
        break;
    }

    // Update total counts for pagination
    this.totalItems = filtered.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);

    // Apply pagination
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.events = filtered.slice(startIndex, endIndex);
  }

  // Pagination methods
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.applyFiltersAndSort();
    // Scroll to top of page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.goToPage(this.currentPage + 1);
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  // Get page numbers to display
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.currentPage - Math.floor(this.maxPageButtons / 2));
    const end = Math.min(this.totalPages, start + this.maxPageButtons - 1);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  // Toggle advanced filters
  toggleAdvanced(): void {
    this.showAdvanced = !this.showAdvanced;
  }

  // Clear search
  clearSearch(): void {
    this.searchTerm = '';
    this.onSearchChange();
  }

  // Check if any filter is active
  hasActiveFilters(): boolean {
    return this.selectedCategory !== '' || this.searchTerm !== '';
  }

  // Clear all filters
  clearAllFilters(): void {
    this.selectedCategory = '';
    this.searchTerm = '';
    this.sortBy = 'date';
    this.showAdvanced = false;
    this.currentPage = 1;
    this.router.navigate(['.'], {
      relativeTo: this.route,
      queryParams: {}
    });
    this.loadEvents('');
  }

  // Handle viewing event details (like host-events pattern)
  viewEventDetails(event: Event): void {
    this.selectedEvent = event;
  }

  // Close detail view and return to list
  closeDetailView(): void {
    this.selectedEvent = null;
    // Filters and pagination state are preserved in component properties
  }

  // Go back to home page (tourist events)
  goBackToHome(): void {
    this.router.navigate(['/tourist/events']);
  }

  // Removed reservedEventIds/paidEventIds logic: use reservation.status and paymentStatus from backend only

  // Open reservations modal
  goToMyReservations(): void {
    this.showReservationsModal = true;
  }

  // Close reservations modal
  closeReservationsModal(): void {
    this.showReservationsModal = false;
    // Reload reservations to update reserved event IDs
    // this.loadUserPaidEvents(); // removed, now handled by backend-driven reservation status
  }

  // Handle book event click
  onBookEvent(event: Event): void {
    this.selectedEventForReservation = event;
    this.showReservationFormModal = true;
  }

  // Handle successful reservation
  onReservationSuccess(reservation: Reservation): void {
    this.showReservationFormModal = false;
    this.selectedEventForReservation = null;
  }

  // Close reservation form modal
  closeReservationFormModal(): void {
    this.showReservationFormModal = false;
    this.selectedEventForReservation = null;
  }
}
