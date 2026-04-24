import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { StarRatingComponent } from '../star-rating/star-rating.component';
import { EventReview, ReviewSummary } from '../../models/event-review.model';
import { ReviewService } from '../../services/review.service';

@Component({
  selector: 'app-event-reviews-preview',
  templateUrl: './event-reviews-preview.component.html',
  styleUrls: ['./event-reviews-preview.component.css']
})
export class EventReviewsPreviewComponent implements OnInit {
  @Input() eventId!: number | string;
  @Input() userId?: number;

  reviews: EventReview[] = [];
  summary: ReviewSummary = { averageRating: 0, totalReviews: 0 };
  isLoading: boolean = true;
  error: string | null = null;

  constructor(
    private reviewService: ReviewService
  ) {}

  ngOnInit(): void {
    this.loadReviews();
  }

  loadReviews(): void {
    this.isLoading = true;
    this.error = null;

    const eventId = typeof this.eventId === 'string' ? parseInt(this.eventId, 10) : this.eventId;

    // Load summary and top reviews in parallel
    Promise.all([
      this.reviewService.getReviewSummary(eventId).toPromise(),
      this.reviewService.getTopReviews(eventId, 2).toPromise()
    ]).then(([summaryData, reviewsData]) => {
      this.summary = summaryData as ReviewSummary;
      this.reviews = reviewsData as EventReview[];
      this.isLoading = false;
    }).catch((error) => {
      console.error('Error loading reviews:', error);
      this.isLoading = false;
      this.error = 'Failed to load reviews';
    });
  }

  getSentimentLabel(score?: number): string {
    if (score === undefined || score === null) return '';
    if (score > 0.3) return '😊 Positive';
    if (score < -0.3) return '😡 Negative';
    return '😐 Neutral';
  }

  getSentimentClass(score?: number): string {
    if (score === undefined || score === null) return '';
    if (score > 0.3) return 'positive';
    if (score < -0.3) return 'negative';
    return 'neutral';
  }
}
