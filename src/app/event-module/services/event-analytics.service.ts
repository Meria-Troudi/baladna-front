import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EventAnalytics } from '../models/event-analytics.model';

@Injectable({
  providedIn: 'root'
})
export class EventAnalyticsService {
  private static readonly API = 'http://localhost:8081/api';
  private apiUrl = `${EventAnalyticsService.API}/events/analytics`;

  constructor(private http: HttpClient) {}

  getAdminSummary(): Observable<EventAnalytics> {
    return this.http.get<EventAnalytics>(`${this.apiUrl}/admin`);
  }

  getHostSummary(hostId: string): Observable<EventAnalytics> {
    return this.http.get<EventAnalytics>(`${this.apiUrl}/host/${hostId}`);
  }

  getEventAnalytics(eventId: string): Observable<EventAnalytics> {
    return this.http.get<EventAnalytics>(`${this.apiUrl}/event/${eventId}`);
  }

  getMonthlyStats(year: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/monthly/${year}`);
  }
}
