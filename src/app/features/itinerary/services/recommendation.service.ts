import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import {
  RecommendationSearchRequest,
  RecommendationSearchResponse,
  TrainingStatistics,
  TrainingDataResponse
} from '../models/recommendation.model';

@Injectable({
  providedIn: 'root'
})
export class RecommendationService {
  private baseUrl = '/api/itinerary/recommendations';
  private cache = new Map<string, RecommendationSearchResponse>();

  constructor(private http: HttpClient) {}

  /**
   * Search recommendations based on criteria
   */
  searchRecommendations(
    criteria: RecommendationSearchRequest
  ): Observable<RecommendationSearchResponse> {
    const key = JSON.stringify(criteria);

    // Return cached result if available
    if (this.cache.has(key)) {
      return of(this.cache.get(key)!);
    }

    return this.http.post<RecommendationSearchResponse>(
      `${this.baseUrl}/search`,
      criteria
    ).pipe(
      tap(response => this.cache.set(key, response))
    );
  }

  /**
   * Get recommendations similar to a specific itinerary
   */
  getSimilarRecommendations(
    itineraryId: string,
    limit: number = 5
  ): Observable<RecommendationSearchResponse> {
    const params = new HttpParams().set('limit', limit.toString());
    
    return this.http.get<RecommendationSearchResponse>(
      `${this.baseUrl}/similar/${itineraryId}`,
      { params }
    );
  }

  /**
   * Admin: Generate training data from existing itineraries
   */
  generateTrainingData(): Observable<TrainingDataResponse> {
    return this.http.post<TrainingDataResponse>(
      `${this.baseUrl}/train/generate`,
      {}
    );
  }

  /**
   * Admin: Normalize training data
   */
  normalizeTrainingData(): Observable<TrainingDataResponse> {
    return this.http.post<TrainingDataResponse>(
      `${this.baseUrl}/train/normalize`,
      {}
    );
  }

  /**
   * Admin: Get statistics
   */
  getStatistics(): Observable<TrainingStatistics> {
    return this.http.get<TrainingStatistics>(
      `${this.baseUrl}/train/statistics`
    );
  }

  /**
   * Admin: Export training data
   */
  exportTrainingData(): void {
    const link = document.createElement('a');
    link.href = `${this.baseUrl}/train/export`;
    link.download = 'training_data.csv';
    link.click();
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.cache.clear();
  }
}
