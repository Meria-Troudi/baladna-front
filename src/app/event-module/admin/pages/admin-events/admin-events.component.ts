import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { EventService } from '../../../services/event.service';
import { CategoryService } from '../../../services/category.service';
import { ReservationService, Reservation } from '../../../services/reservation.service';
import { ReviewService } from '../../../services/review.service';
import { Event } from '../../../models/event.model';

@Component({
  selector: 'app-admin-events',
  templateUrl: './admin-events.component.html',
  styleUrls: ['./admin-events.component.css']
})
export class AdminEventsComponent implements OnInit {

  // ✅ PARENT ONLY FETCHES DATA ONCE - NO BUSINESS LOGIC HERE
  events: Event[] = [];
  bookings: Reservation[] = [];
  reviews: any[] = [];
  categories: any[] = [];

  loading: boolean = false;
  activeTab: 'overview' | 'events' | 'bookings' | 'reviews' = 'overview';

  // ✅ UNIFIED GLOBAL DRAWER STATE
  selectedEntity: { type: string, data: any } | null = null;

  get today(): Date {
    return new Date();
  }

constructor(
    public router: Router,
    private eventService: EventService,
    private categoryService: CategoryService,
    private reservationService: ReservationService,
    private reviewService: ReviewService
  ) {}

  ngOnInit(): void {
    this.refreshData();
  }

  // ✅ PARENT ONLY: Load ALL data ONCE for ALL tabs
  refreshData(): void {
    this.loading = true;

    this.eventService.getAllEvents().subscribe({
      next: events => { this.events = events; },
      error: err => console.error('Events failed:', err)
    });

    this.reservationService.getAllReservations().subscribe({
      next: bookings => { this.bookings = bookings; },
      error: err => console.error('Bookings failed:', err)
    });

    this.categoryService.getCategories().subscribe({
      next: cats => { this.categories = cats; },
      error: err => console.error('Categories failed:', err)
    });

this.reviewService.getAllReviews().subscribe({
  next: reviews => { this.reviews = reviews; },
  error: err => console.error('Reviews failed:', err)
});

setTimeout(() => {
  this.loading = false;
}, 1500);
  }

  // ✅ ONLY Tab navigation - that's all parent does
  setTab(tab: 'overview' | 'events' | 'bookings' | 'reviews'): void {
    this.activeTab = tab;
  }

  // ✅ UNIFIED DRAWER HANDLER METHODS
  openDrawer(type: string, data: any): void {
    this.selectedEntity = { type, data };
  }

  getDrawerTitle(): string {
    if (!this.selectedEntity) return '';
    switch (this.selectedEntity.type) {
      case 'event': return this.selectedEntity.data.title;
      case 'booking': return `Booking #${this.selectedEntity.data.id}`;
      case 'review': return `Review`;
    }
    return '';
  }

  getDrawerStatus(): string {
    if (!this.selectedEntity) return '';
    switch (this.selectedEntity.type) {
      case 'event': return this.selectedEntity.data.status || '';
      case 'booking': return this.selectedEntity.data.status || '';
      case 'review': return this.selectedEntity.data.rating + ' Stars';
    }
    return '';
  }

  closeDrawer(): void {
    this.selectedEntity = null;
  }

}
