import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, SimpleChanges, OnChanges } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Reservation, ReservationService } from '../../../services/reservation.service';
import { TableColumn, TableAction, TableFilter } from '../../pages/dynamic-table/dynamic-table.component';

@Component({
  selector: 'app-bookings-management',
  templateUrl: './bookings-management.component.html',
  styleUrls: ['./bookings-management.component.css']
})
export class BookingsManagementComponent implements OnInit {

  @Input() bookings: Reservation[] = [];
  @Output() openBookingDrawer = new EventEmitter<Reservation>();
  loading: boolean = false;
  keyword: string = '';
  selectedStatus: string = '';
  selectedRole: string = '';

  // Filtered data
  filteredBookings: Reservation[] = [];

  bookingsColumns: TableColumn[] = [];
  bookingsActions: TableAction[] = [];
  bookingsFilters: TableFilter[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    public router: Router,
    private reservationService: ReservationService
  ) {}

  ngOnInit(): void {
    this.initializeTableConfigs();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['bookings']) {
      this.filteredBookings = [...(this.bookings || [])];
    }
  }

  initializeTableConfigs(): void {
    // Bookings table config
    this.bookingsColumns = [
      { header: 'ID', key: 'id', width: '80px', sortable: true },
      { header: 'Event', key: 'event', width: '150px', sortable: true, cellRenderer: (value) => value?.title || 'N/A' },
      { header: 'Tourist', key: 'touristUserId', width: '120px', sortable: true },
      { header: 'Persons', key: 'personsCount', width: '80px', sortable: true },
      { header: 'Total Price', key: 'totalPrice', width: '100px', sortable: true, cellRenderer: (value) => `${value || 0} EUR` },
      { header: 'Status', key: 'status', width: '100px', sortable: true, filterable: true, cellRenderer: (value) => `<span class="status-badge status-${value?.toLowerCase()}">${value}</span>` },
      { header: 'Payment', key: 'paymentStatus', width: '100px', sortable: true, filterable: true, cellRenderer: (value) => `<span class="status-badge status-${value?.toLowerCase()}">${value}</span>` }
    ];

    this.bookingsActions = [
      { label: 'Cancel', icon: '❌', class: 'btn-action btn-danger', action: (row) => this.cancelBooking(row) },
      { label: 'View Details', icon: '📱', class: 'btn-action btn-info', action: (row) => this.viewBookingDetails(row) }
    ];

    this.bookingsFilters = [
      { key: 'status', placeholder: 'Status', type: 'select', options: [
        { value: 'CONFIRMED', label: 'Confirmed' },
        { value: 'WAITLISTED', label: 'Waitlisted' },
        { value: 'CANCELLED', label: 'Cancelled' }
      ]},
      { key: 'paymentStatus', placeholder: 'Payment', type: 'select', options: [
        { value: 'PAID', label: 'Paid' },
        { value: 'PENDING', label: 'Pending' },
        { value: 'FAILED', label: 'Failed' }
      ]}
    ];
  }

  // Helper methods referenced in template
  getConfirmedBookingsCount(): number {
    return this.bookings.filter(b => b.status === 'CONFIRMED').length;
  }

  getPaidBookingsCount(): number {
    return this.bookings.filter(b => b.paymentStatus === 'PAID').length;
  }

  getPendingBookingsCount(): number {
    return this.bookings.filter(b => b.paymentStatus === 'PENDING').length;
  }

  search(): void {
    this.applyFilters();
  }

  filterByStatus(): void {
    this.applyFilters();
  }

  resetFilters(): void {
    this.keyword = '';
    this.selectedStatus = '';
    this.selectedRole = '';
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredBookings = [...this.bookings];

    if (this.keyword) {
      const term = this.keyword.toLowerCase().trim();
      this.filteredBookings = this.filteredBookings.filter(b =>
        b.id?.toString().includes(term) ||
        b.event?.title?.toLowerCase().includes(term) ||
        b.touristUserId?.toString().includes(term)
      );
    }

    if (this.selectedStatus) {
      this.filteredBookings = this.filteredBookings.filter(b => b.status === this.selectedStatus);
    }
  }

  cancelBooking(booking: Reservation) {
    if (confirm(`Are you sure you want to cancel booking #${booking.id}?`)) {
      this.reservationService.cancel(booking.id).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          alert('Booking cancelled successfully');
          // PARENT WILL REFRESH DATA
        },
        error: (err) => alert('Failed to cancel booking')
      });
    }
  }

viewedBooking: Reservation | null = null;

  viewBookingDetails(booking: Reservation) {
    this.openBookingDrawer.emit(booking);
  }

closeBookingDetails() {
  this.viewedBooking = null;
}

  onTableActionClick(event: { action: TableAction; row: any }) {
    event.action.action(event.row);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}