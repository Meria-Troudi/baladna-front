import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RecommendationService } from '../../../services/recommendation.service';
import { MinimalEventCardComponent } from '../tourist-events/minimal-event-card.component';
import { EventSharedModule } from '../../../event-shared.module';

@Component({
  selector: 'app-trending-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MinimalEventCardComponent, EventSharedModule],
  template: `
    <div class="trending-page">

      <!-- FILTER BAR -->
      <div class="filters-bar">
        <div class="filter">
          <label>Category</label>
          <select [(ngModel)]="categoryFilter" (ngModelChange)="applyFilters()">
            <option value="">All categories</option>
            <option *ngFor="let c of categories" [value]="c">{{ c }}</option>
          </select>
        </div>

        <div class="filter">
          <label>From</label>
          <input type="date" [(ngModel)]="dateFrom" (ngModelChange)="applyFilters()">
        </div>

        <div class="filter">
          <label>To</label>
          <input type="date" [(ngModel)]="dateTo" (ngModelChange)="applyFilters()">
        </div>

        <div class="filter budget">
          <label>Max budget · <strong>{{ budgetMax }} TND</strong></label>
          <input type="range"
                 [min]="0"
                 [max]="globalMaxPrice"
                 [step]="5"
                 [(ngModel)]="budgetMax"
                 (ngModelChange)="applyFilters()">
        </div>

        <div class="filter toggles">
          <label class="toggle">
            <input type="checkbox" [(ngModel)]="showAvailableOnly" (ngModelChange)="applyFilters()">
            <span>Available only</span>
          </label>
          <label class="toggle">
            <input type="checkbox" [(ngModel)]="showRecommendedOnly" (ngModelChange)="applyFilters()">
            <span>Recommended for me</span>
          </label>
        </div>
      </div>

      <!-- META -->
      <div class="meta-row" *ngIf="!loading">
        <span class="count">
          Showing <strong>{{ filteredEvents.length }}</strong>
          of {{ trendingEvents.length }} trending event{{ trendingEvents.length === 1 ? '' : 's' }}
        </span>
        <span class="engine-tag">
          <i class="bi bi-fire"></i>
          Ranked by live booking activity
        </span>
      </div>

      <!-- LOADING -->
      <div class="state-block" *ngIf="loading">
        <div class="spinner"></div>
        <span>Loading trending events…</span>
      </div>

      <!-- EMPTY STATE -->
      <div class="state-block empty" *ngIf="!loading && filteredEvents.length === 0">
        <div class="empty-icon">📭</div>
        <h3 *ngIf="trendingEvents.length === 0">Nothing trending yet</h3>
        <h3 *ngIf="trendingEvents.length > 0">No events match your filters</h3>
        <p *ngIf="trendingEvents.length === 0">Trending data will appear here as events get bookings.</p>
        <p *ngIf="trendingEvents.length > 0">Try widening your budget or clearing the date range.</p>
        <button class="reset-btn" *ngIf="trendingEvents.length > 0" (click)="resetFilters()">
          Reset filters
        </button>
      </div>

      <!-- GRID -->
      <div class="grid" *ngIf="!loading && filteredEvents.length > 0">
        <div class="trending-cell" *ngFor="let e of filteredEvents; let i = index">
          <span class="rank-badge" [class.top]="i < 3">#{{ i + 1 }}</span>
          <span class="bookings-badge" *ngIf="e.bookings > 0">
            <i class="bi bi-people-fill"></i> {{ e.bookings }} booking{{ e.bookings === 1 ? '' : 's' }}
          </span>
          <app-minimal-event-card
            [event]="e"
            [score]="recommendationScores.get(e.id)"
            (viewDetails)="openModal(e)"
            (bookEvent)="onBookEvent($event)">
          </app-minimal-event-card>
        </div>
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
    :host { display: block; }

    .trending-page {
      padding: 8px 4px 24px;
      color: #f4f6fb;
      font-family: 'Sora', sans-serif;
    }

    /* Filters */
    .filters-bar {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 14px;
      padding: 16px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      margin-bottom: 18px;
    }

    .filter { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
    .filter label {
      font-size: 11px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.65);
      font-weight: 600;
    }
    .filter label strong { color: #D4A843; font-weight: 700; }

    .filter select,
    .filter input[type="date"] {
      background: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #1B3A6B;
      padding: 8px 10px;
      border-radius: 8px;
      font-size: 13px;
      font-family: inherit;
      width: 100%;
      box-sizing: border-box;
    }

    .filter input[type="range"] {
      width: 100%;
      accent-color: #D4A843;
    }

    .toggles { display: flex; flex-direction: column; gap: 4px; }
    .toggle {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: rgba(255, 255, 255, 0.85);
      cursor: pointer;
      font-weight: 500;
      text-transform: none;
      letter-spacing: 0;
    }
    .toggle input { accent-color: #C0503A; width: 16px; height: 16px; }

    /* Meta row */
    .meta-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 14px;
      font-size: 12.5px;
      color: rgba(255, 255, 255, 0.7);
    }
    .meta-row strong { color: #fff; }
    .engine-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #1B3A6B;
      background: rgba(212, 168, 67, 0.95);
      padding: 4px 10px;
      border-radius: 30px;
      font-weight: 700;
    }

    /* States */
    .state-block {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 16px;
      gap: 10px;
      color: rgba(255, 255, 255, 0.7);
      text-align: center;
    }
    .state-block h3 {
      font-family: 'Playfair Display', serif;
      font-size: 1.2rem;
      color: #fff;
      margin: 8px 0 0;
    }
    .state-block p { margin: 0; font-size: 13px; max-width: 360px; }
    .empty-icon { font-size: 2rem; }

    .reset-btn {
      margin-top: 6px;
      background: rgba(255, 255, 255, 0.08);
      color: #fff;
      border: 1px solid rgba(255, 255, 255, 0.18);
      padding: 8px 16px;
      border-radius: 10px;
      cursor: pointer;
      font-size: 13px;
    }
    .reset-btn:hover { background: rgba(255, 255, 255, 0.15); }

    .spinner {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      border: 2px solid rgba(255,255,255,0.2);
      border-top-color: #D4A843;
      animation: trend-spin 0.8s linear infinite;
    }
    @keyframes trend-spin { to { transform: rotate(360deg); } }

    /* Grid */
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 18px;
    }

    .trending-cell { position: relative; }

    .rank-badge {
      position: absolute;
      top: 12px; left: 12px;
      z-index: 2;
      background: rgba(255, 255, 255, 0.95);
      color: #1B3A6B;
      padding: 4px 10px;
      border-radius: 999px;
      font-weight: 800;
      font-size: 12px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.15);
    }
    .rank-badge.top {
      background: linear-gradient(135deg, #D4A843, #C0503A);
      color: #fff;
    }

    .bookings-badge {
      position: absolute;
      top: 12px; right: 12px;
      z-index: 2;
      background: rgba(27, 58, 107, 0.95);
      color: #fff;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .bookings-badge i { color: #D4A843; }
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
        this.trendingEvents = (res || []).map(e => ({
          ...e,
          // backend may return { eventId } only; normalise to id for downstream code
          id: e.id ?? e.eventId,
          price: e.price ?? 0,
          bookedSeats: e.bookedSeats ?? 0,
          capacity: e.capacity ?? 0,
          bookings: e.bookings ?? 0
        }));
        if (this.trendingEvents.length > 0) {
          this.globalMaxPrice = Math.max(
            ...this.trendingEvents.map(e => Number(e.price) || 0),
            100
          );
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
    this.recommendationService.getPersonalizedRecommendations().subscribe({
      next: (r) => {
        this.recommendationScores = new Map(r.map(x => [x.eventId, x.score]));
      },
      error: () => { /* AI down — recommended-only filter just stays empty */ }
    });
  }

  loadCategories() {
    this.recommendationService.getCategories().subscribe({
      next: (c) => this.categories = c || [],
      error: () => { this.categories = []; }
    });
  }

  applyFilters() {
    let data = [...this.trendingEvents];

    if (this.categoryFilter) {
      data = data.filter(e => e.category === this.categoryFilter);
    }

    data = data.filter(e => (Number(e.price) || 0) <= this.budgetMax);

    if (this.dateFrom) {
      const from = new Date(this.dateFrom).getTime();
      data = data.filter(e => e.startAt && new Date(e.startAt).getTime() >= from);
    }

    if (this.dateTo) {
      const to = new Date(this.dateTo).getTime();
      data = data.filter(e => e.startAt && new Date(e.startAt).getTime() <= to);
    }

    if (this.showRecommendedOnly) {
      data = data.filter(e => this.recommendationScores.has(e.id));
    }

    if (this.showAvailableOnly) {
      data = data.filter(e => (e.capacity || 0) === 0 || (e.bookedSeats || 0) < (e.capacity || 0));
    }

    this.filteredEvents = data;
  }

  resetFilters() {
    this.categoryFilter = '';
    this.dateFrom = '';
    this.dateTo = '';
    this.budgetMax = this.globalMaxPrice;
    this.showAvailableOnly = false;
    this.showRecommendedOnly = false;
    this.applyFilters();
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

  onReservationSuccess(_reservation: any) {
    this.showBookingModal = false;
    this.selectedEventForBooking = null;
  }
}
