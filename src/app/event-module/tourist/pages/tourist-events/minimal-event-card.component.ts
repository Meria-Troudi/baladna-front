import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-minimal-event-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="minimal-card" (click)="viewDetails.emit(event)">
      <div class="card-header">
        <span class="score-badge" *ngIf="score">
          <i class="bi bi-stars"></i> {{ (score * 100).toFixed(0) }}% Match
        </span>
        <button class="analytics-mini-btn" (click)="showAnalytics(event); $event.stopPropagation()">
          <i class="bi bi-bar-chart"></i>
        </button>
      </div>

      <div class="card-body">
        <span class="category-tag">{{ event.category || 'Experience' }}</span>
        <h3 class="event-title">{{ event.title }}</h3>
        
        <div class="event-details">
          <div class="detail-item">
            <i class="bi bi-calendar3"></i>
            <span>{{ event.startAt | date:'EEE, MMM d' }}</span>
          </div>
          <div class="detail-item">
            <i class="bi bi-geo-alt"></i>
            <span>{{ event.location || 'Tunisia' }}</span>
          </div>
        </div>
      </div>

      <div class="card-footer">
        <div class="price-section">
          <span class="currency">TND</span>
          <span class="amount">{{ event.price }}</span>
        </div>
        <div class="action-group">
          <button class="info-circle-btn" (click)="explain.emit(event); $event.stopPropagation()">
            <i class="bi bi-info-circle"></i>
          </button>
          <button class="book-now-btn" (click)="bookEvent.emit(event); $event.stopPropagation()">
            Book
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :root {
      --navy: #1B3A6B;
      --terra: #C0503A;
      --gold: #D4A843;
      --gray-4: #8896B0;
    }
.minimal-card::before {
  content: '';
  position: absolute;
  top: 0; right: 0;
  width: 60px; height: 60px;
  background: radial-gradient(circle at top right, rgba(212, 168, 67, 0.15), transparent);
  pointer-events: none;
}
    .minimal-card {
      background: #FFFFFF;
      border: 1.5px solid #E0E5F0;
      border-radius: 20px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      position: relative;
      overflow: hidden;
    }

    .minimal-card:hover {
      transform: translateY(-6px);
      border-color: var(--gold);
      box-shadow: 0 15px 35px rgba(15, 35, 71, 0.1);
    }

    /* Top Badges */
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .score-badge {
      background: rgba(212, 168, 67, 0.12);
      color: #B38B2D;
      padding: 4px 10px;
      border-radius: 30px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.05em;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .analytics-mini-btn {
      background: none;
      border: none;
      color: var(--gray-4);
      font-size: 16px;
      cursor: pointer;
      transition: color 0.2s;
    }

    .analytics-mini-btn:hover { color: var(--navy); }

    /* Typography */
    .category-tag {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--terra);
      font-weight: 800;
      margin-bottom: 4px;
      display: block;
    }

    .event-title {
      font-family: 'Playfair Display', serif;
      font-size: 1.25rem;
      color: var(--navy);
      margin: 0 0 12px 0;
      line-height: 1.3;
      font-weight: 700;
    }

    .event-details {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: var(--gray-4);
      font-family: 'Sora', sans-serif;
    }

    .detail-item i { color: var(--gold); }

    /* Footer Section */
    .card-footer {
      margin-top: auto;
      padding-top: 16px;
      border-top: 1px solid #F2F4F8;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .price-section { color: var(--navy); }
    .currency { font-size: 10px; font-weight: 600; margin-right: 2px; vertical-align: top; }
    .amount { font-family: 'Playfair Display', serif; font-size: 1.4rem; font-weight: 800; }

    .action-group {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .info-circle-btn {
      background: none;
      border: none;
      color: var(--gray-4);
      font-size: 18px;
      cursor: pointer;
      padding: 0;
    }

    .book-now-btn {
      background: linear-gradient(135deg, var(--navy), #2A4F8A);
      color: white;
      border: none;
      padding: 8px 18px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .book-now-btn:hover {
      background: var(--terra);
      box-shadow: 0 4px 12px rgba(192, 80, 58, 0.3);
    }
  `]
})
export class MinimalEventCardComponent {
  @Input() event: any;
  @Input() score?: number;
  @Output() viewDetails = new EventEmitter<any>();
  @Output() bookEvent = new EventEmitter<any>();
  @Output() explain = new EventEmitter<any>();

  showAnalytics(event: any): void {
    // Analytics logic here
  }
}