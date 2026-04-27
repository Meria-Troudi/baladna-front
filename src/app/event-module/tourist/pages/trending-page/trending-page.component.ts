import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RecommendationService } from '../../../services/recommendation.service';
import { MinimalEventCardComponent } from '../tourist-events/minimal-event-card.component';
import { EventSharedModule } from '../../../event-shared.module';
import { Event } from '../../../models/event.model';

@Component({
  selector: 'app-trending-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MinimalEventCardComponent, EventSharedModule],
  template: `
    <div class="trending-page">

      <h2>🔥 Trending Events</h2>

      <!-- FILTER BAR -->
      <div class="filters-bar">

        <select [(ngModel)]="categoryFilter" (ngModelChange)="applyFilters()">
          <option value="">All Categories</option>
          <option *ngFor="let c of categories" [value]="c">{{ c }}</option>
        </select>

        <input type="date" [(ngModel)]="dateFrom" (ngModelChange)="applyFilters()">
        <input type="date" [(ngModel)]="dateTo" (ngModelChange)="applyFilters()">

        <div class="budget">
          <label>Max {{ budgetMax }} TND</label>
          <input type="range"
                 [max]="globalMaxPrice"
                 [(ngModel)]="budgetMax"
                 (ngModelChange)="applyFilters()">
        </div>

        <label><input type="checkbox" [(ngModel)]="showAvailableOnly" (ngModelChange)="applyFilters()"> Available</label>
        <label><input type="checkbox" [(ngModel)]="showRecommendedOnly" (ngModelChange)="applyFilters()"> Recommended</label>

      </div>

      <!-- GRID -->
      <div class="grid" *ngIf="!loading">
        <app-minimal-event-card
          *ngFor="let e of filteredEvents"
          [event]="e"
          [score]="recommendationScores.get(e.id)"
          (viewDetails)="openModal(e)"
          (bookEvent)="onBookEvent($event)">
        </app-minimal-event-card>
      </div>

      <div *ngIf="loading">Loading...</div>

      <!-- EVENT DETAIL MODAL -->
      <div *ngIf="selectedEvent" class="modal-body">
        <h2>{{ selectedEvent.title }}</h2>
        <p>{{ selectedEvent.description }}</p>

        <div *ngIf="recommendationScores.get(selectedEvent.id)">
          <h4>Why recommended?</h4>
          <p>Score: {{ recommendationScores.get(selectedEvent.id) }}</p>
        </div>

        <button (click)="selectedEvent=null">Close</button>
        <button (click)="onBookEvent(selectedEvent)">Book</button>
      </div>

      <!-- BOOKING FLOW MODAL -->
      <app-modal *ngIf="showBookingModal" (closed)="closeBookingModal()">
        <app-booking-flow
          [event]="selectedEventForBooking"
          (completed)="onReservationSuccess($event)"
          (close)="closeBookingModal()">
        </app-booking-flow>
      </app-modal>

    </div>
  `,
  styles: [`
    .trending-page { padding: 2rem; max-width: 1200px; margin: auto; }
    .filters-bar { display: flex; gap: 1rem; flex-wrap: wrap; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.5rem; }
    .modal-body { padding: 1rem; }
  `]
})
export class TrendingPageComponent implements OnInit {

  trendingEvents: any[] = [];
  filteredEvents: any[] = [];
  categories: string[] = [];

  selectedEvent: any = null;

  loading = true;

  categoryFilter = '';
  budgetMax = 200;
  globalMaxPrice = 200;
  dateFrom = '';
  dateTo = '';
  showRecommendedOnly = false;
  showAvailableOnly = false;

  recommendationScores = new Map<number, number>();

  // Booking flow modal state
  showBookingModal = false;
  selectedEventForBooking: any = null;

  constructor(private recommendationService: RecommendationService) {}

  ngOnInit() {
    this.loadTrending();
    this.loadScores();
    this.loadCategories();
  }

  loadTrending() {
    this.loading = true;
    this.recommendationService.getTrending().subscribe({
      next: (res) => {
        this.trendingEvents = res || [];
        if (this.trendingEvents.length > 0) {
          this.globalMaxPrice = Math.max(...this.trendingEvents.map(e => e.price || 0), 100);
          this.budgetMax = this.globalMaxPrice;
        }
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading trending events:', err);
        this.trendingEvents = [];
        this.filteredEvents = [];
        this.loading = false;
      }
    });
  }

  loadScores() {
    this.recommendationService.getPersonalizedRecommendations().subscribe(r => {
      this.recommendationScores = new Map(r.map(x => [x.eventId, x.score]));
    });
  }

  loadCategories() {
    this.recommendationService.getCategories().subscribe(c => this.categories = c);
  }

  applyFilters() {
    let data = [...this.trendingEvents];

    if (this.categoryFilter)
      data = data.filter(e => e.category === this.categoryFilter);

    data = data.filter(e => e.price <= this.budgetMax);

    if (this.dateFrom) {
      const from = new Date(this.dateFrom).getTime();
      data = data.filter(e => new Date(e.startAt).getTime() >= from);
    }

    if (this.dateTo) {
      const to = new Date(this.dateTo).getTime();
      data = data.filter(e => new Date(e.startAt).getTime() <= to);
    }

    if (this.showRecommendedOnly)
      data = data.filter(e => (this.recommendationScores.get(e.id) || 0) > 0.6);

    if (this.showAvailableOnly)
      data = data.filter(e => e.bookedSeats < e.capacity);

    this.filteredEvents = data;
  }

  openModal(e: any) {
    this.selectedEvent = e;
  }

  onBookEvent(e: any) {
    this.selectedEventForBooking = e;
    this.showBookingModal = true;
  }

  closeBookingModal() {
    this.showBookingModal = false;
    this.selectedEventForBooking = null;
  }

  onReservationSuccess(reservation: any) {
    this.showBookingModal = false;
    this.selectedEventForBooking = null;
    // Optionally refresh data
  }
}