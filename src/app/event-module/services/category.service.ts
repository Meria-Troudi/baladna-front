import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private static readonly API = 'http://localhost:8081/api';
  private apiUrl = `${CategoryService.API}/events/event`;

  constructor(private http: HttpClient) {}

  getCategories(): Observable<string[]> {
    console.log('getCategories called, trying backend endpoint:', `${this.apiUrl}/categories/enum`);
    // Fetch enum values dynamically from backend ONLY
    return this.http.get<string[]>(`${this.apiUrl}/categories/enum`);
  }

  getEventCountByCategory(category: string): Observable<number> {
    // Try to get count from backend, fallback to 0 if endpoint doesn't exist
    return this.http.get<number>(`${this.apiUrl}/count/category/${category}`).pipe(
      map(count => count || 0)
    );
  }

  getAllCategoriesWithCounts(): Observable<Array<{name: string, count: number}>> {
    console.log('getAllCategoriesWithCounts called');
    return this.getCategories().pipe(
      switchMap(categories => {
        console.log('Got categories from getCategories():', categories);
        // Get events from backend to count real events per category
        return this.http.get<any[]>(`${this.apiUrl}/list`).pipe(
          map(events => {
            console.log('Got events from backend:', events);
            const categoryCounts: { [key: string]: number } = {};
            
            // Initialize all categories with 0
            categories.forEach(cat => {
              categoryCounts[cat] = 0;
            });
            
            // Count events by category
            events.forEach(event => {
              if (event.category && categoryCounts.hasOwnProperty(event.category)) {
                categoryCounts[event.category]++;
              }
            });
            
            // Convert to array format
            const result = categories.map(category => ({
              name: category,
              count: categoryCounts[category]
            }));
            console.log('Returning categories with real counts:', result);
            return result;
          })
        );
      })
    );
  }

  getCategoryIcon(categoryValue: string): string {
    const icons: { [key: string]: string } = {
      'MUSIC': '🎵',
      'FOOD': '🍽️',
      'OUTDOOR': '🏕️',
      'CULTURE': '🏛️',
      'ART': '🎨',
      'WORKSHOP': '🛠️',
      'SPORT': '⚽',
      'FESTIVAL': '🎉',
      'TOUR': '🚌',
      'FAMILY': '👨‍👩‍👧‍👦',
      'NIGHTLIFE': '🌃',
      'THEATER': '🎭',
      'OTHER': '📅'
    };
    return icons[categoryValue] || '📅';
  }

  getCategoryLabel(categoryValue: string): string {
    const labels: { [key: string]: string } = {
      'MUSIC': 'Music',
      'FOOD': 'Food',
      'OUTDOOR': 'Outdoor',
      'CULTURE': 'Culture',
      'ART': 'Art',
      'WORKSHOP': 'Workshop',
      'SPORT': 'Sport',
      'FESTIVAL': 'Festival',
      'TOUR': 'Tour',
      'FAMILY': 'Family',
      'NIGHTLIFE': 'Nightlife',
      'THEATER': 'Theater',
      'OTHER': 'Other'
    };
    return labels[categoryValue] || 'Other';
  }
}
