import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  EventReview,
  ReviewEligibility,
  ReviewSummary,
  CreateReviewPayload,
  UpdateReviewPayload
} from '../models/event-review.model';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private api = 'http://localhost:8081/api/events/event-review';

  constructor(private http: HttpClient) {}

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    return throwError(() => new Error(errorMessage));
  }

  getByEvent(eventId: number): Observable<EventReview[]> {
    return this.http.get<EventReview[]>(`${this.api}/by-event/${eventId}`).pipe(catchError(this.handleError));
  }

  getMyReview(eventId: number): Observable<EventReview | null> {
    return this.http.get<EventReview>(`${this.api}/by-event-user/${eventId}/me`).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 204 || error.status === 404) {
          return new Observable<EventReview | null>((observer) => {
            observer.next(null);
            observer.complete();
          });
        }
        return this.handleError(error);
      })
    );
  }

  checkMyEligibility(eventId: number): Observable<ReviewEligibility> {
    return this.http.get<ReviewEligibility>(`${this.api}/eligibility/${eventId}/me`).pipe(catchError(this.handleError));
  }

  getReviewSummary(eventId: number): Observable<ReviewSummary> {
    return this.http.get<ReviewSummary>(`${this.api}/summary/${eventId}`).pipe(catchError(this.handleError));
  }

  getAverageRating(eventId: number): Observable<{ averageRating: number; totalReviews: number }> {
    return this.http
      .get<{ averageRating: number; totalReviews: number }>(`${this.api}/average/${eventId}`)
      .pipe(catchError(this.handleError));
  }

  getTopReviews(eventId: number, limit: number = 2): Observable<EventReview[]> {
    return this.http.get<EventReview[]>(`${this.api}/top/${eventId}?limit=${limit}`).pipe(catchError(this.handleError));
  }

  create(payload: CreateReviewPayload): Observable<EventReview> {
    return this.http.post<EventReview>(`${this.api}/add`, payload).pipe(catchError(this.handleError));
  }

  update(reviewId: number, payload: UpdateReviewPayload): Observable<EventReview> {
    const updatePayload = {
      id: reviewId,
      ...payload
    };
    return this.http.put<EventReview>(`${this.api}/update`, updatePayload).pipe(catchError(this.handleError));
  }

  delete(reviewId: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/delete/${reviewId}`).pipe(catchError(this.handleError));
  }

  addHostResponse(reviewId: number, hostResponse: string): Observable<EventReview> {
    return this.http
      .post<EventReview>(`${this.api}/host-response/${reviewId}`, { hostResponse })
      .pipe(catchError(this.handleError));
  }

  getReview(reviewId: number): Observable<EventReview> {
    return this.http.get<EventReview>(`${this.api}/get/${reviewId}`).pipe(catchError(this.handleError));
  }
}