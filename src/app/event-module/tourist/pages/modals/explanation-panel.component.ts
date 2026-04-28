import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-explanation-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="explanation-panel">
      <div class="panel-header">
        <div class="panel-title">
          <h3><i class="bi bi-robot"></i> Why we recommended this</h3>
          <span class="model-tag">LightGBM Ranker</span>
        </div>
        <button class="close-btn" (click)="close.emit()">✕</button>
      </div>

      <div class="event-summary" *ngIf="data?.eventTitle">
        <div class="event-title-line">{{ data.eventTitle }}</div>
        <div class="score-line" *ngIf="data?.score != null">
          <span class="score-pill">
            <i class="bi bi-stars"></i>
            {{ (data.score * 100) | number:'1.0-0' }}% Match
          </span>
          <span class="raw-score" *ngIf="data?.rawScore != null">
            raw model score:
            <code>{{ data.rawScore | number:'1.4-4' }}</code>
          </span>
        </div>
      </div>

      <div class="panel-body">
        <div *ngIf="loading" class="loading">
          <div class="spinner"></div>
          <span>Asking the model…</span>
        </div>

        <div *ngIf="!loading">
          <p class="lead">The model considered your past bookings, price habits, and event features. It picked this one because:</p>
          <ul *ngIf="data?.reasons?.length">
            <li *ngFor="let reason of data.reasons">{{ reason }}</li>
          </ul>
          <p *ngIf="!data?.reasons?.length" class="empty">No specific reasons returned.</p>
        </div>
      </div>

      <div class="panel-footer">
        <i class="bi bi-info-circle"></i>
        Computed live from a 23-feature vector (user history, event price, weekend, popularity, …).
      </div>
    </div>
  `,
  styles: [`
    .explanation-panel {
      padding: 20px 22px;
      min-width: 360px;
      max-width: 520px;
      background: white;
      border-radius: 12px;
      font-family: 'Sora', sans-serif;
    }
    .panel-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      border-bottom: 1px solid #eef0f5; padding-bottom: 12px;
    }
    .panel-title h3 {
      margin: 0; font-size: 1.05rem; color: #1B3A6B; font-weight: 700;
      font-family: 'Playfair Display', serif;
    }
    .panel-title h3 i { color: #C0503A; margin-right: 6px; }
    .model-tag {
      display: inline-block; margin-top: 4px;
      font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase;
      color: #B38B2D; background: rgba(212,168,67,0.12);
      padding: 2px 8px; border-radius: 12px; font-weight: 700;
    }
    .close-btn { background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #8896B0; }
    .event-summary { margin: 14px 0 6px; }
    .event-title-line { font-weight: 600; color: #1B3A6B; margin-bottom: 6px; }
    .score-line { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; font-size: 12px; color: #6c7a93; }
    .score-pill {
      background: rgba(192,80,58,0.1); color: #C0503A;
      padding: 4px 10px; border-radius: 20px; font-weight: 700; font-size: 11px;
    }
    .raw-score code {
      background: #f3f5f9; padding: 1px 6px; border-radius: 4px; color: #1B3A6B;
    }
    .panel-body { margin-top: 14px; min-height: 80px; }
    .lead { color: #4a5670; font-size: 13px; margin-bottom: 8px; }
    ul { padding-left: 1.1rem; margin: 0; }
    li { margin: 6px 0; color: #1B3A6B; font-size: 13.5px; }
    .empty { color: #8896B0; font-style: italic; }
    .loading { display: flex; align-items: center; gap: 10px; color: #6c7a93; font-size: 13px; }
    .spinner {
      width: 16px; height: 16px; border-radius: 50%;
      border: 2px solid #E0E5F0; border-top-color: #C0503A;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .panel-footer {
      margin-top: 18px; padding-top: 12px; border-top: 1px solid #eef0f5;
      font-size: 11px; color: #8896B0; line-height: 1.4;
    }
    .panel-footer i { color: #D4A843; margin-right: 4px; }
  `]
})
export class ExplanationPanelComponent {
  @Input() data: any;
  @Input() loading = false;
  @Output() close = new EventEmitter<void>();
}
