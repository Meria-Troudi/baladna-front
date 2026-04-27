import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { RecommendationService } from '../../../services/recommendation.service';
import { Recommendation } from '../../../models/recommendation.model';

@Component({
  selector: 'app-similar-recommendations',
  templateUrl: './similar-recommendations.component.html',
  styleUrls: ['./similar-recommendations.component.css']
})
export class SimilarRecommendationsComponent implements OnInit, OnChanges {
  @Input() itineraryId: string = '';
  @Input() limit: number = 5;

  recommendations: Recommendation[] = [];
  isLoading = false;
  error = '';

  constructor(
    private recommendationService: RecommendationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.itineraryId) {
      this.loadSimilarRecommendations();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['itineraryId'] &&
      !changes['itineraryId'].firstChange &&
      this.itineraryId
    ) {
      this.loadSimilarRecommendations();
    }
  }

  loadSimilarRecommendations(): void {
    this.isLoading = true;
    this.error = '';

    this.recommendationService
      .getSimilarRecommendations(this.itineraryId, this.limit)
      .subscribe({
        next: (response: any) => {
          this.recommendations = response.recommendations;
          this.isLoading = false;
        },
        error: (error: any) => {
          this.error = 'Could not load similar recommendations';
          this.isLoading = false;
          console.error('Similar recommendations error:', error);
        }
      });
  }

  viewItinerary(itineraryId: string): void {
    this.router.navigate(['/itinerary/detail', itineraryId]);
  }

  trackByItineraryId(index: number, rec: Recommendation): string {
    return rec.itineraryId;
  }

  getSimilarityPercentage(score: number): number {
    return Math.round(score * 100);
  }

  getSimilarityClass(score: number): string {
    if (score >= 0.9) return 'excellent';
    if (score >= 0.7) return 'good';
    if (score >= 0.5) return 'fair';
    return 'low';
  }
}

