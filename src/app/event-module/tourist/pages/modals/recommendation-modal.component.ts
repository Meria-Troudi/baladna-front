import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecommendationService } from '../../../services/recommendation.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-recommendation-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="recommendation-modal">
      <div class="modal-header">
        <h2>🎯 Recommended for you</h2>
        <button class="close-btn" (click)="close()">✕</button>
      </div>
      <div class="ranking-list">
        <div *ngFor="let rec of recommendations; let i = index" class="rec-card">
          <div class="rank">{{ i+1 }}</div>
          <div class="rec-details">
            <h3>{{ rec.title }}</h3>
            <div class="meta">
              <span class="category">{{ rec.category }}</span>
              <span class="price">{{ rec.price }} TND</span>
              <span class="score">AI Score: {{ rec.score.toFixed(2) }}</span>
            </div>
          </div>
          <div class="actions">
            <button class="btn-explain" (click)="explain(rec.eventId)">Why?</button>
            <button class="btn-detail" (click)="viewDetails(rec.eventId)">View</button>
            <button class="btn-book" (click)="book(rec.eventId)">Book</button>
          </div>
        </div>
      </div>
      <div class="explanation-drawer" *ngIf="explanation">
        <h3>Why this event?</h3>
        <ul>
          <li *ngFor="let reason of explanation.reasons">{{ reason }}</li>
        </ul>
        <button (click)="explanation = null">Close</button>
      </div>
    </div>
  `,
  styles: [`
    .recommendation-modal { padding: 1rem; max-width: 800px; min-width: 500px; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; margin-bottom: 1rem; }
    .close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; }
    .ranking-list { max-height: 500px; overflow-y: auto; }
    .rec-card { display: flex; align-items: center; gap: 1rem; padding: 1rem; border-bottom: 1px solid #f0f0f0; }
    .rank { font-size: 1.5rem; font-weight: bold; color: #ff6b35; width: 40px; }
    .rec-details { flex: 1; }
    .rec-details h3 { margin: 0 0 0.25rem; font-size: 1rem; }
    .meta { display: flex; gap: 1rem; font-size: 0.8rem; color: #666; }
    .score { background: #e9ecef; padding: 2px 6px; border-radius: 12px; }
    .actions { display: flex; gap: 0.5rem; }
    .btn-explain, .btn-detail, .btn-book { padding: 0.25rem 0.75rem; border-radius: 20px; border: none; cursor: pointer; }
    .btn-explain { background: #6c757d; color: white; }
    .btn-detail { background: #007bff; color: white; }
    .btn-book { background: #28a745; color: white; }
    .explanation-drawer { margin-top: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 8px; }
  `]
})
export class RecommendationModalComponent implements OnInit {
  recommendations: any[] = [];
  explanation: any = null;
  private modalCloseFn: (() => void) | null = null;

  constructor(
    private recommendationService: RecommendationService,
    private router: Router
  ) {}

  setCloseFn(fn: () => void) {
    this.modalCloseFn = fn;
  }

  ngOnInit() {
    this.recommendationService.getPersonalizedRecommendations().subscribe({
      next: (recs) => {
        this.recommendations = recs.map(r => ({ ...r, title: 'Loading...' }));
        this.loadEventDetails(recs);
      }
    });
  }

  loadEventDetails(recs: any[]) {
    const ids = recs.map(r => r.eventId).join(',');
    this.recommendationService.getEventsByIds(ids).subscribe({
      next: (events) => {
        this.recommendations = recs.map(rec => ({
          ...rec,
          title: events.find(e => e.id === rec.eventId)?.title || 'Event',
          category: events.find(e => e.id === rec.eventId)?.category,
          price: events.find(e => e.id === rec.eventId)?.price
        }));
      }
    });
  }

  explain(eventId: number) {
    this.recommendationService.explainRecommendation(eventId).subscribe({
      next: (exp) => { this.explanation = exp; }
    });
  }

  viewDetails(eventId: number) {
    this.router.navigate(['/tourist/events', eventId]);
    this.close();
  }

  book(eventId: number) {
    this.router.navigate(['/tourist/events', eventId, 'book']);
    this.close();
  }

  close() {
    if (this.modalCloseFn) {
      this.modalCloseFn();
    }
  }
}