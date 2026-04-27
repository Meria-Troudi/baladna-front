import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface RecommendationResult {
  eventId: number;
  score: number;
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
}
