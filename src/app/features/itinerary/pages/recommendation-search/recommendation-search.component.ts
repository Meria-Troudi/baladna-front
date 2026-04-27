import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { RecommendationService } from '../../services/recommendation.service';
import {
  RecommendationSearchRequest,
  Recommendation
} from '../../models/recommendation.model';

@Component({
  selector: 'app-recommendation-search',
  templateUrl: './recommendation-search.component.html',
  styleUrls: ['./recommendation-search.component.css'],
  animations: [
    trigger('slideUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(30px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class RecommendationSearchComponent implements OnInit {
  recommendations: Recommendation[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  searchForm = {
    maxBudget: null as number | null,
    location: '',
    limit: 5,
    minDuration: null as number | null,
    maxDuration: null as number | null,
    minRating: null as number | null,
    exactLocationMatch: false
  };

  locations = [
    'Tunis',
    'Sousse',
    'Sfax',
    'Djerba',
    'Hammamet',
    'Monastir',
    'Tozeur',
    'Kebili'
  ];

  minRatingOptions = [
    { label: 'Any Rating', value: null },
    { label: '3+ Star', value: 3 },
    { label: '4+ Star', value: 4 },
    { label: '4.5+ Star', value: 4.5 }
  ];

  constructor(
    private recommendationService: RecommendationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Optional: Load default recommendations on init
    // this.searchRecommendations();
  }

  searchRecommendations(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Filter out empty/null fields
    const criteria: RecommendationSearchRequest = {};

    if (this.searchForm.maxBudget !== null) {
      criteria.maxBudget = this.searchForm.maxBudget;
    }
    if (this.searchForm.location) {
      criteria.location = this.searchForm.location;
    }
    if (this.searchForm.limit) {
      criteria.limit = this.searchForm.limit;
    }
    if (this.searchForm.minDuration !== null) {
      criteria.minDuration = this.searchForm.minDuration;
    }
    if (this.searchForm.maxDuration !== null) {
      criteria.maxDuration = this.searchForm.maxDuration;
    }
    if (this.searchForm.minRating !== null) {
      criteria.minRating = this.searchForm.minRating;
    }
    if (this.searchForm.exactLocationMatch) {
      criteria.exactLocationMatch = this.searchForm.exactLocationMatch;
    }

    this.recommendationService.searchRecommendations(criteria).subscribe({
      next: (response) => {
        this.recommendations = response.recommendations;
        this.successMessage = `Found ${response.count} recommendations`;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage =
          error.error?.error || 'Error fetching recommendations';
        this.isLoading = false;
        console.error('Search error:', error);
      }
    });
  }

  resetFilters(): void {
    this.searchForm = {
      maxBudget: null,
      location: '',
      limit: 5,
      minDuration: null,
      maxDuration: null,
      minRating: null,
      exactLocationMatch: false
    };
    this.recommendations = [];
    this.successMessage = '';
    this.errorMessage = '';
  }

  viewItinerary(itineraryId: string): void {
    this.router.navigate(['/tourist/itineraries', itineraryId]);
  }

  getSimilarRecommendations(itineraryId: string): void {
    this.router.navigate(['/tourist/itineraries/similar', itineraryId]);
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
