import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-host-analytics-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" (click)="close.emit()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header"><h3>🤖 AI Analytics: {{ event?.title }}</h3><button class="close-btn" (click)="close.emit()">✕</button></div>
        <div *ngIf="loading" class="loading"><div class="loading-spinner"></div><p>Loading predictions...</p></div>
        <div *ngIf="!loading && error" class="error">{{ error }}</div>
        <div *ngIf="!loading && !error" class="analytics-grid">
          
          <!-- Fill Rate Card with Progress Bar & Urgency -->
          <div class="card">
            <div class="label">📊 Fill Rate</div>
            <div class="value">{{ (fillRate * 100).toFixed(0) }}%</div>
            <div class="progress-bar"><div class="progress-fill" [ngClass]="{'progress-green': fillRate > 0.7, 'progress-yellow': fillRate > 0.4 && fillRate <= 0.7, 'progress-red': fillRate <= 0.4}" [style.width.%]="fillRate * 100"></div></div>
            <div class="sub">Capacity: {{ event?.capacity }} seats</div>
            <div class="urgency-badge" [ngClass]="{'badge-green': fillRate > 0.7, 'badge-yellow': fillRate > 0.4, 'badge-red': fillRate <= 0.4}">{{ getUrgencyLabel() }}</div>
          </div>

          <!-- Revenue Forecast -->
          <div class="card">
            <div class="label">💰 Revenue Forecast</div>
            <div class="value">{{ forecastRevenue | currency:'TND' }}</div>
            <div class="sub">Current: {{ currentRevenue | currency:'TND' }}</div>
            <div class="mini-trend" [ngClass]="{'positive': forecastRevenue > currentRevenue, 'negative': forecastRevenue < currentRevenue}">{{ forecastRevenue > currentRevenue ? '↑ +' + ((forecastRevenue - currentRevenue) | currency:'TND') : '↓ ' + ((currentRevenue - forecastRevenue) | currency:'TND') }}</div>
          </div>

          <!-- Predicted Rating -->
          <div class="card">
            <div class="label">⭐ Predicted Rating</div>
            <div class="value">{{ predictedRating }}/5</div>
            <div class="stars">★★★★{{ '★'.repeat(5 - Math.floor(predictedRating)) }}</div>
            <div class="sub">Based on price & category</div>
          </div>

          <!-- Actionable Tips -->
          <div class="card tips">
            <div class="label">💡 AI Actionable Tips</div>
            <ul><li *ngFor="let tip of tips">{{ tip }}</li></ul>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay { position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; z-index:1000; }
    .modal-container { background:white; border-radius:32px; width:90%; max-width:700px; max-height:85vh; overflow-y:auto; box-shadow:0 25px 50px rgba(0,0,0,0.3); }
    .modal-header { display:flex; justify-content:space-between; align-items:center; padding:20px 24px; border-bottom:1px solid #eee; }
    .close-btn { background:none; border:none; font-size:1.8rem; cursor:pointer; }
    .analytics-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:20px; padding:24px; }
    .card { background:#f8f9fa; border-radius:20px; padding:20px; transition:0.2s; border:1px solid #e9ecef; }
    .card:hover { transform:translateY(-4px); box-shadow:0 12px 24px rgba(0,0,0,0.08); }
    .label { font-size:0.85rem; color:#6c757d; margin-bottom:8px; letter-spacing:0.05em; }
    .value { font-size:2rem; font-weight:800; color:#2c7da0; }
    .progress-bar { height:8px; background:#e9ecef; border-radius:10px; margin:12px 0 8px; overflow:hidden; }
    .progress-fill { height:100%; border-radius:10px; transition:width 0.4s; }
    .progress-green { background:#22c55e; }
    .progress-yellow { background:#f59e0b; }
    .progress-red { background:#ef4444; }
    .urgency-badge { display:inline-block; padding:4px 12px; border-radius:30px; font-size:0.7rem; font-weight:700; margin-top:8px; }
    .badge-green { background:#22c55e20; color:#15803d; border:1px solid #22c55e40; }
    .badge-yellow { background:#f59e0b20; color:#b45309; border:1px solid #f59e0b40; }
    .badge-red { background:#ef444420; color:#b91c1c; border:1px solid #ef444440; }
    .stars { color:#fbbf24; font-size:1rem; margin-top:4px; letter-spacing:2px; }
    .mini-trend { font-size:0.8rem; margin-top:8px; font-weight:600; }
    .positive { color:#22c55e; }
    .negative { color:#ef4444; }
    .tips ul { margin-top:8px; padding-left:20px; }
    .tips li { margin:8px 0; color:#495057; }
    .loading, .error { text-align:center; padding:60px; }
    .loading-spinner { width:40px; height:40px; border:3px solid #e9ecef; border-top-color:#d4a843; border-radius:50%; animation:spin 1s linear infinite; margin:0 auto 16px; }
    @keyframes spin { to { transform:rotate(360deg); } }
  `]
})
export class HostAnalyticsModalComponent implements OnInit {
  @Input() event: any;
  @Output() close = new EventEmitter<void>();

  fillRate = 0;
  forecastRevenue = 0;
  currentRevenue = 0;
  predictedRating = 0;
  tips: string[] = [];
  loading = true;
  error = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    const base = 'http://localhost:5000/host';
    Promise.all([
      this.http.get<any>(`${base}/fill-rate-prediction/${this.event.id}`).toPromise(),
      this.http.get<any>(`${base}/revenue-forecast/${this.event.id}`).toPromise(),
      this.http.get<any>(`${base}/rating-prediction/${this.event.id}`).toPromise(),
      this.http.get<any>(`${base}/actionable-tips/${this.event.id}`).toPromise()
    ]).then(([fill, revenue, rating, tips]) => {
      this.fillRate = fill.predictedFillRate;
      this.forecastRevenue = revenue.forecastRevenue;
      this.currentRevenue = revenue.currentRevenue;
      this.predictedRating = rating.predictedRating;
      this.tips = tips.tips;
      this.loading = false;
    }).catch(() => { this.error = 'Failed to load AI analytics'; this.loading = false; });
  }

  getUrgencyLabel(): string {
    if (this.fillRate > 0.8) return 'Almost Full – act now';
    if (this.fillRate > 0.5) return 'Filling fast – promote';
    return 'Low demand – consider price adjustment';
  }
}