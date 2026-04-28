import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Router, ActivatedRoute } from '@angular/router';
import { EventService } from '../../../services/event.service';
import { CategoryService } from '../../../services/category.service';
import { Event } from '../../../models/event.model';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

interface HostEventFilter {
  search: string;
  status: string;
  category: string;
  dateFrom: string;
  dateTo: string;
}

interface HostStats {
  totalEvents: number;
  upcomingEvents: number;
  totalBookings: number;
  totalRevenue: number;
}

@Component({
  selector: 'app-host-events',
  templateUrl: './host-events.component.html',
  styleUrl: './host-events.component.css'
})
export class HostEventsComponent implements OnInit, OnDestroy {
  events: Event[] = [];
  filteredEvents: Event[] = [];
  categories: string[] = [];
  loading: boolean = false;
  error: string = '';
  
  // Modal properties
  selectedEvent: Event | null = null;
  isViewModalVisible: boolean = false;
  selectedEventForAnalytics: any = null;
  // Dashboard stats
  hostStats: HostStats = {
    totalEvents: 0,
    upcomingEvents: 0,
    totalBookings: 0,
    totalRevenue: 0
  };

  // Filters
  filters: HostEventFilter = {
    search: '',
    status: '',
    category: '',
    dateFrom: '',
    dateTo: ''
  };

  // View options
  viewMode: 'grid' | 'list' = 'grid';
  currentPage: number = 1;
  itemsPerPage: number = 12;
  totalPages: number = 1;
  
  // Math object for template usage
  Math = Math;

  // Search debounce
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private eventService: EventService,
    private categoryService: CategoryService
  ) {
    // Setup search debounce
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.applyFilters();
      });
  }

  ngOnInit(): void {
    this.loadHostEvents();
    this.loadCategories();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  viewEventDetails(event: Event): void {
    this.selectedEvent = event;
    this.isViewModalVisible = false;
  }

  closeViewModal(): void {
    this.selectedEvent = null;
    this.isViewModalVisible = false;
  }

  loadHostEvents(): void {
    this.loading = true;
    this.error = '';
    
    // Fetch only current host's events from backend
    this.eventService.getMyEvents().subscribe(events => {
      this.events = events || [];
      this.calculateHostStats();
      this.applyFilters();
      this.loading = false;
    }, error => {
    });
  }

  loadCategories(): void {
    // Fetch categories from backend service (no static data)
    this.categoryService.getCategories().subscribe(categories => {
      this.categories = categories;
    });
  }

  calculateHostStats(): void {
    if (!this.events) {
      this.hostStats = {
        totalEvents: 0,
        upcomingEvents: 0,
        totalBookings: 0,
        totalRevenue: 0
      };
      return;
    }

    const now = new Date();
    this.hostStats = {
      totalEvents: this.events.length,
      upcomingEvents: this.events.filter(event => 
        event.startAt && new Date(event.startAt) > now
      ).length,
      totalBookings: this.events.reduce((sum, event) => sum + (event.bookedSeats || 0), 0),
      totalRevenue: this.events.reduce((sum, event) => 
        sum + ((event.price || 0) * (event.bookedSeats || 0)), 0
      )
    };
  }

  applyFilters(): void {
    let filtered = [...this.events];

    // Search filter
    if (this.filters.search) {
      const searchTerm = this.filters.search.toLowerCase();
      filtered = filtered.filter(event =>
        event.title?.toLowerCase().includes(searchTerm) ||
        event.description?.toLowerCase().includes(searchTerm)
      );
    }

    // Status filter
    if (this.filters.status) {
      filtered = filtered.filter(event => event.status === this.filters.status);
    }

    // Category filter
    if (this.filters.category) {
      filtered = filtered.filter(event => 
        event.category === this.filters.category
      );
    }

    // Date range filter
    if (this.filters.dateFrom) {
      const startDate = new Date(this.filters.dateFrom);
      filtered = filtered.filter(event => 
        event.startAt && new Date(event.startAt) >= startDate
      );
    }

    if (this.filters.dateTo) {
      const endDate = new Date(this.filters.dateTo);
      filtered = filtered.filter(event => 
        event.startAt && new Date(event.startAt) <= endDate
      );
    }

    this.filteredEvents = filtered;
    this.totalPages = Math.ceil(this.filteredEvents.length / this.itemsPerPage);
    this.currentPage = Math.min(this.currentPage, this.totalPages || 1);
  }

  onSearchChange(searchTerm: string): void {
    this.searchSubject.next(searchTerm);
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
  }

  createEvent(): void {
    this.router.navigate(['/host/my-events/create']);
  }

  editEvent(event: any): void {
    this.router.navigate(['/host/my-events/edit', event.id]);
  }

  editEventFromModal(event: Event): void {
    this.closeViewModal();
    this.router.navigate(['/host/my-events/edit', event.id]);
  }

  deleteEvent(event: Event): void {
    if (confirm(`Are you sure you want to delete "${event.title}"?`)) {
      this.eventService.deleteEvent(event.id.toString()).subscribe(() => {
        this.loadHostEvents();
      });
    }
  }

  getStatusColor(status: string | undefined): string {
    if (!status) return 'secondary';
    
    switch (status) {
      case 'UPCOMING': return 'primary';
      case 'ONGOING': return 'success';
      case 'FINISHED': return 'info';
      case 'CANCELED': return 'danger';
      case 'FULL': return 'warning';
      default: return 'secondary';
    }
  }

  getEventStatus(status: string | undefined): string {
    if (!status) return 'Unknown';
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  getEventsForCurrentPage(): Event[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredEvents.slice(startIndex, endIndex);
  }

  changePage(page: number): void {
    this.currentPage = page;
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  clearFilters(): void {
    this.filters = {
      search: '',
      status: '',
      category: '',
      dateFrom: '',
      dateTo: ''
    };
    this.applyFilters();
  }

  getStatusOptions(): string[] {
    return ['UPCOMING', 'ONGOING', 'FULL', 'FINISHED', 'CANCELED'];
  }

  getPaginationPages(): number[] {
    const pages: number[] = [];
    const startPage = Math.max(1, this.currentPage - 2);
    const endPage = Math.min(this.totalPages, this.currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  goToEventsList(): void {
    this.router.navigate(['/host/my-events']);
  }
}
