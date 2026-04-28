import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface RecommendationResult {
  eventId: number;
  score: number;
}

export interface AiHealth {
  available: boolean;
  modelName: string;
  features?: number;
  status?: string;
  error?: string;
}

export interface FillRatePrediction {
  eventId: number;
  predictedFillRate: number;
}

export interface RevenueForecast {
  eventId: number;
  currentRevenue: number;
  forecastRevenue: number;
}

export interface RatingPrediction {
  eventId: number;
  predictedRating: number;
}

export interface ActionableTips {
  eventId: number;
  tips: string[];
}

@Injectable({
  providedIn: 'root'
})
export class RecommendationService {
  private apiUrl = 'http://localhost:8081/api/recommendations';

  constructor(private http: HttpClient) {}

  getPersonalizedRecommendations(): Observable<RecommendationResult[]> {
    return this.http.get<any>(
      `${this.apiUrl}/personalized`,
      { withCredentials: true }
    ).pipe(
      map(response => {
        // Handle both wrapped {recommendations: [...]} and direct array responses
        return response.recommendations || response;
      })
    );
  }

  explainRecommendation(eventId: number): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/explain?eventId=${eventId}`,
      { withCredentials: true }
    );
  }

  getTrending(): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/trending`,
      { withCredentials: true }
    );
  }

  getHealth(): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/health`,
      {withCredentials: true}
    );
  }

  getCategories(): Observable<string[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/categories`,
      {withCredentials: true}
    );
  }

  getEventsByIds(ids: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/events?ids=${ids}`,
      {withCredentials: true}
    );
  }

  getFillRatePrediction(eventId: number): Observable<FillRatePrediction> {
    return this.http.get<FillRatePrediction>(
      `${this.apiUrl}/host/fill-rate/${eventId}`,
      { withCredentials: true }
    );
  }

  getRevenueForecast(eventId: number): Observable<RevenueForecast> {
    return this.http.get<RevenueForecast>(
      `${this.apiUrl}/host/revenue-forecast/${eventId}`,
      { withCredentials: true }
    );
  }

  getRatingPrediction(eventId: number): Observable<RatingPrediction> {
    return this.http.get<RatingPrediction>(
      `${this.apiUrl}/host/rating-prediction/${eventId}`,
      { withCredentials: true }
    );
  }

  getActionableTips(eventId: number): Observable<ActionableTips> {
    return this.http.get<ActionableTips>(
      `${this.apiUrl}/host/tips/${eventId}`,
      { withCredentials: true }
    );
  }
}
