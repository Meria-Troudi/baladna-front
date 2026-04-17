import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { EventService } from '../../../services/event.service';
import { CategoryService } from '../../../services/category.service';
import { ReservationService, Reservation } from '../../../services/reservation.service';
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

  get today(): Date {
    return new Date();
  }

  constructor(
    public router: Router,
    private eventService: EventService,
    private categoryService: CategoryService,
    private reservationService: ReservationService
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

    setTimeout(() => {
      this.loading = false;
    }, 1500);
  }

  // ✅ ONLY Tab navigation - that's all parent does
  setTab(tab: 'overview' | 'events' | 'bookings' | 'reviews'): void {
    this.activeTab = tab;
  }

}