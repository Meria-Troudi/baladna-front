import { Component, OnInit, OnDestroy, Input, SimpleChanges, OnChanges } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { TableAction, TableColumn, TableFilter } from '../../pages/dynamic-table/dynamic-table.component';
import { EventService } from '../../../services/event.service';
import { CategoryService } from '../../../services/category.service';
import {Event, EventStatus } from '../../../models/event.model';

interface Filters {
  title: string;
  host: string;
  category: string;
  status: string;
  startDate: string;
  endDate: string;
}

interface AdminEvent extends Event {
  selected?: boolean;
}

@Component({
  selector: 'app-events-management',
  templateUrl: './events-management.component.html',
  styleUrls: ['./events-management.component.css']
})
export class EventsManagementComponent implements OnInit {

  @Input() set events(value: AdminEvent[]) {
    this._events = (value || []).map(event => ({ ...event, selected: false }));
    this.totalItems = this._events.length;
    this.applyFilters();
  }
  get events(): AdminEvent[] { return this._events; }
  private _events: AdminEvent[] = [];
  pagedEvents: AdminEvent[] = [];
  filteredEvents: AdminEvent[] = [];
  categories: any[] = [];
  filters: Filters = { title: '', host: '', category: '', status: '', startDate: '', endDate: '' };
  sortField: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalItems: number = 0;
  totalPages: number = 1;

  selectedEvent: AdminEvent | null = null;
  editingEvent: AdminEvent | null = null;
  deletingEvent: AdminEvent | null = null;
  isDetailModalVisible: boolean = false;
  loading: boolean = false;
  error: string = '';

  searchTerm: string = '';
  selectedCategory: string = 'All';
  selectedHost: string = 'All';

  viewMode: 'table' | 'calendar' = 'table';
  selectedEvents: AdminEvent[] = [];
  allSelected: boolean = false;

  keyword: string = '';
  selectedStatus: string = '';
  showDeleted: boolean = false;

  // Dynamic table configurations
  eventsColumns: TableColumn[] = [];
  eventsActions: TableAction[] = [];
  eventsFilters: TableFilter[] = [];

  // Search debounce
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    public router: Router,
    private eventService: EventService,
    private categoryService: CategoryService
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.initializeTableConfigs();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['events'] && !changes['events'].firstChange) {
      this.applyFilters();
    }
  }

  initializeTableConfigs(): void {
    // Events table config
    this.eventsColumns = [
      { header: 'Title', key: 'title', width: '200px', sortable: true },
      { header: 'Host', key: 'createdByUserId', width: '100px', sortable: true },
      { header: 'Category', key: 'category', width: '120px', sortable: true, filterable: true },
      { header: 'Date', key: 'startAt', width: '120px', sortable: true, cellRenderer: (value) => value ? new Date(value).toLocaleDateString() : '' },
      { header: 'Status', key: 'status', width: '100px', sortable: true, filterable: true, cellRenderer: (value) => `<span class="status-badge status-${value?.toLowerCase()}">${value}</span>` },
      { header: 'Capacity', key: 'capacity', width: '100px', sortable: true, cellRenderer: (value, row) => `${row.bookedSeats || 0}/${value}` },
      { header: 'Price', key: 'price', width: '80px', sortable: true, cellRenderer: (value) => `${value || 0} TND` }
    ];

    this.eventsActions = [
      { label: 'View', icon: '👁️', class: 'btn-action btn-view', action: (row) => this.viewEventDetails(row.id) },
      { label: 'Edit', icon: '✏️',  class: 'btn-action btn-edit',  action: (row) => this.editEvent(row) },
      { label: 'Delete', icon: '🗑️', class: 'btn-action btn-delete', action: (row) => this.confirmDeleteEvent(row) }
    ];

    this.eventsFilters = [
      { key: 'category', placeholder: 'Category', type: 'select', options: [] },
      { key: 'status', placeholder: 'Status', type: 'select', options: [
        { value: 'UPCOMING', label: 'Upcoming' },
        { value: 'ONGOING', label: 'Ongoing' },
        { value: 'FINISHED', label: 'Finished' },
        { value: 'CANCELED', label: 'Canceled' },
        { value: 'FULL', label: 'Full' }
      ]}
    ];
  }

  // DATA LOAD REMOVED - EVENTS NOW COME FROM PARENT COMPONENT VIA @Input()

  loadCategories() {
    this.categoryService.getCategories().pipe(takeUntil(this.destroy$)).subscribe(categories => {
      this.categories = [
        { id: '', name: 'All Categories' },
        ...categories.map(cat => ({ id: cat, name: cat }))
      ];
      
      // Update events filters with categories
      const categoryFilter = this.eventsFilters.find(f => f.key === 'category');
      if (categoryFilter) {
        categoryFilter.options = categories.map(cat => ({ value: cat, label: cat }));
      }
    });
  }

  confirmDeleteEvent(event: AdminEvent) {
    if (confirm(`Are you sure you want to delete "${event.title}"?`)) {
      this.eventService.deleteEvent(event.id.toString()).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          // PARENT WILL REFRESH DATA
        },
        error: (err) => alert('Failed to delete event')
      });
    }
  }

  onTableActionClick(event: { action: TableAction; row: any }) {
    event.action.action(event.row);
  }

  applyFilters() {
    let filtered = [...this.events];

    // Search filter
    if (this.filters.title) {
      filtered = filtered.filter(e => 
        e.title && e.title.toLowerCase().includes(this.filters.title.toLowerCase())
      );
    }

    // Host filter
    if (this.filters.host) {
      filtered = filtered.filter(e => 
        e.createdByUserId && e.createdByUserId.toString().toLowerCase().includes(this.filters.host.toLowerCase())
      );
    }

    // Category filter
    if (this.filters.category) {
      filtered = filtered.filter(e => 
        e.category && e.category === this.filters.category
      );
    }

    // Status filter
    if (this.filters.status) {
      filtered = filtered.filter(e => 
        e.status === this.filters.status
      );
    }

    // Date range filter
    if (this.filters.startDate) {
      const startDate = new Date(this.filters.startDate);
      filtered = filtered.filter(e => 
        e.startAt && new Date(e.startAt) >= startDate
      );
    }

    if (this.filters.endDate) {
      const endDate = new Date(this.filters.endDate);
      filtered = filtered.filter(e => 
        e.endAt && new Date(e.endAt) <= endDate
      );
    }

    // Sort
    if (this.sortField) {
      filtered.sort((a: any, b: any) => {
        const valA = (a as any)[this.sortField];
        const valB = (b as any)[this.sortField];
        
        if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    this.filteredEvents = filtered;
    this.totalItems = filtered.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    this.currentPage = Math.min(this.currentPage, this.totalPages || 1);
    this.pagedEvents = filtered.slice((this.currentPage - 1) * this.itemsPerPage, this.currentPage * this.itemsPerPage);
  }

  sort(field: string) {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.applyFilters();
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.applyFilters();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.applyFilters();
    }
  }

  editEvent(event: Event) {
    this.router.navigate(['/admin/events/edit', event.id]);
  }

  onSearchChange() {
    this.currentPage = 1;
    this.applyFilters();
  }

  onCategoryChange() {
    this.currentPage = 1;
    this.applyFilters();
  }

  onStatusChange() {
    this.currentPage = 1;
    this.applyFilters();
  }

  onHostChange() {
    this.currentPage = 1;
    this.applyFilters();
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.applyFilters();
  }

  get paginationPages() {
    const pages: number[] = [];
    const startPage = Math.max(1, this.currentPage - 2);
    const endPage = Math.min(this.totalPages, this.currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  get totalPagesCount() {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  min(a: number, b: number): number {
    return Math.min(a, b);
  }

  refreshData() {
    this.loading = true;
    this.error = '';
    // PARENT COMPONENT WILL HANDLE DATA REFRESH
    this.loading = false;
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedCategory = 'All';
    this.selectedStatus = 'All';
    this.selectedHost = 'All';
    this.currentPage = 1;
    this.applyFilters();
  }

  closeDetails() {
    this.selectedEvent = null;
    this.isDetailModalVisible = false;
  }

  openEdit(event: Event) {
    this.editingEvent = { ...event };
  }

  closeEdit() {
    this.editingEvent = null;
  }

  onEditSubmit() {
    if (this.editingEvent) {
      this.closeEdit();
      this.refreshData();
    }
  }

  openDelete(event: Event) {
    this.deletingEvent = { ...event };
  }

  closeDelete() {
    this.deletingEvent = null;
  }

  confirmDelete() {
    if (this.deletingEvent) {
      this.eventService.deleteEvent(this.deletingEvent.id.toString()).pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.events = this.events.filter(e => e.id !== this.deletingEvent!.id);
        this.totalItems = this.events.length;
        this.applyFilters();
        this.closeDelete();
      });
    }
  }

  getEventsByStatus(status: string): AdminEvent[] {
    return this.events.filter(event => event.status === status);
  }

  get hasSelectedEvents(): boolean {
    return this.selectedEvents.length > 0;
  }

  toggleSelectAll() {
    this.allSelected = !this.allSelected;
    this.pagedEvents.forEach(event => {
      event.selected = this.allSelected;
    });
    this.updateSelectedEvents();
  }

  updateSelectedEvents() {
    this.selectedEvents = this.pagedEvents.filter(event => event.selected);
    this.allSelected = this.selectedEvents.length === this.pagedEvents.length;
  }

  exportData() {
    console.log('Exporting data...');
  }

  forceDeleteSelected() {
    if (confirm(`Are you sure you want to delete ${this.selectedEvents.length} selected events?`)) {
      this.selectedEvents.forEach(event => {
        this.eventService.deleteEvent(event.id.toString()).pipe(takeUntil(this.destroy$)).subscribe();
      });
      this.refreshData();
    }
  }

  cancelEvent() {
    if (this.editingEvent && confirm('Are you sure you want to cancel this event?')) {
      this.editingEvent.status = EventStatus.CANCELED;
      this.onEditSubmit();
    }
  }

  approveEvent() {
    if (this.editingEvent) {
      this.editingEvent.status = EventStatus.UPCOMING;
      this.onEditSubmit();
    }
  }

  viewEventDetails(eventId: string | number) {
    this.router.navigate(['/admin/events', eventId]);
  }

  getObjectKeys(obj: any): string[] {
    return Object.keys(obj);
  }

  toLower(str: string): string {
    return str.toLowerCase();
  }

  getUpcomingCount(): number {
    return this.events.filter(e => e.status === 'UPCOMING').length;
  }

  getOngoingCount(): number {
    return this.events.filter(e => e.status === 'ONGOING').length;
  }

  getCanceledCount(): number {
    return this.events.filter(e => e.status === 'CANCELED').length;
  }

  getStatusOptions(): string[] {
    return Object.values(EventStatus);
  }

  formatStatusDisplay(status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  search(): void {
    this.keyword = this.keyword.trim().toLowerCase();
    this.applyFilters();
  }

  filterByStatus(): void {
    this.applyFilters();
  }

  toggleShowDeleted(): void {
    this.showDeleted = !this.showDeleted;
  }

  resetFilters(): void {
    this.keyword = '';
    this.selectedStatus = '';
    this.showDeleted = false;
    this.applyFilters();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}