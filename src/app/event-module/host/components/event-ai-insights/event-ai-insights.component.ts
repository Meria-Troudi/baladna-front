import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { catchError, of } from 'rxjs';
import {
  RecommendationService,
  FillRatePrediction,
  RevenueForecast,
  RatingPrediction,
  ActionableTips,
  AiHealth
} from '../../../services/recommendation.service';

@Component({
  selector: 'app-event-ai-insights',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './event-ai-insights.component.html',
  styleUrls: ['./event-ai-insights.component.css']
})
export class EventAiInsightsComponent implements OnChanges {
  @Input() eventId: number | string | null = null;

  loading = false;
  unavailable = false;

  fillRate: FillRatePrediction | null = null;
  revenue: RevenueForecast | null = null;
  rating: RatingPrediction | null = null;
  tips: ActionableTips | null = null;
  health: AiHealth | null = null;

  constructor(private rec: RecommendationService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['eventId'] && this.eventId) {
      this.fetch();
    }
  }

  fetch(): void {
    if (this.eventId == null) return;
    const id = Number(this.eventId);
    if (!Number.isFinite(id)) return;
    this.loading = true;
    this.unavailable = false;

    forkJoin({
      fillRate: this.rec.getFillRatePrediction(id).pipe(catchError(() => of(null))),
      revenue: this.rec.getRevenueForecast(id).pipe(catchError(() => of(null))),
      rating: this.rec.getRatingPrediction(id).pipe(catchError(() => of(null))),
      tips: this.rec.getActionableTips(id).pipe(catchError(() => of(null))),
      health: this.rec.getHealth().pipe(catchError(() => of(null)))
    }).subscribe(res => {
      this.fillRate = res.fillRate as FillRatePrediction | null;
      this.revenue = res.revenue as RevenueForecast | null;
      this.rating = res.rating as RatingPrediction | null;
      this.tips = res.tips as ActionableTips | null;
      this.health = res.health as AiHealth | null;
      this.unavailable = !this.fillRate && !this.revenue && !this.rating && !this.tips;
      this.loading = false;
    });
  }

  fillPct(): number {
    return this.fillRate ? Math.round(this.fillRate.predictedFillRate * 100) : 0;
  }

  ratingStars(): number[] {
    const v = Math.round(this.rating?.predictedRating ?? 0);
    return Array(5).fill(0).map((_, i) => (i < v ? 1 : 0));
  }

  revenueDelta(): number {
    if (!this.revenue) return 0;
    return this.revenue.forecastRevenue - this.revenue.currentRevenue;
  }

  revenueDeltaPct(): number {
    if (!this.revenue || !this.revenue.currentRevenue) return 0;
    return Math.round(
      ((this.revenue.forecastRevenue - this.revenue.currentRevenue) / this.revenue.currentRevenue) * 100
    );
  }
}
