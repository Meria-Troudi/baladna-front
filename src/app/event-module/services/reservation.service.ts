import { Injectable } from '@angular/core';
import { ReviewEligibility } from '../models/event-review.model';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface Reservation {
  id: number;
  event: any;
  touristUserId: number;
  personsCount: number;
  totalPrice: number;
  status: 'CONFIRMED' | 'WAITLISTED' | 'CANCELLED' | 'PENDING';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
  qrCode?: string;
  qrCodeImageBase64?: string;
  createdAt: string;
  cancelledAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReservationService {

  getEligibility(eventId: number): Observable<ReviewEligibility> {
    return this.http.get<ReviewEligibility>(`http://localhost:8081/api/events/event-review/eligibility/${eventId}/me`);
  }
  private api = 'http://localhost:8081/api/events/event-reservation';

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

  create(eventId: string | number, persons: number): Observable<Reservation> {
    if (persons < 1 || persons > 10) {
      return throwError(() => new Error('Number of persons must be between 1 and 10'));
    }

    return this.http
      .post<Reservation>(`${this.api}/events/${eventId}/reserve?persons=${persons}`, {})
      .pipe(catchError(this.handleError));
  }

  cancel(reservationId: number): Observable<void> {
    return this.http
      .put<void>(`${this.api}/reservations/${reservationId}/cancel`, {})
      .pipe(catchError(this.handleError));
  }

  getMyReservations(): Observable<Reservation[]> {
    return this.http
      .get<Reservation[]>(`${this.api}/users/me/reservations`)
      .pipe(catchError(this.handleError));
  }

  getEventReservations(eventId: string | number): Observable<Reservation[]> {
    return this.http
      .get<Reservation[]>(`${this.api}/events/${eventId}/reservations`)
      .pipe(catchError(this.handleError));
  }

  getPaidEventIds(): Observable<number[]> {
    return this.http
      .get<number[]>(`${this.api}/users/me/paid-event-ids`)
      .pipe(catchError(this.handleError));
  }

  update(eventId: string | number, reservationId: number, persons: number): Observable<Reservation> {
    if (persons < 1 || persons > 10) {
      return throwError(() => new Error('Number of persons must be between 1 and 10'));
    }

    return this.http
      .put<Reservation>(`${this.api}/events/${eventId}/reservations/${reservationId}?persons=${persons}`, {})
      .pipe(catchError(this.handleError));
  }

  getReservation(reservationId: number): Observable<Reservation> {
    return this.http
      .get<Reservation>(`${this.api}/get/${reservationId}`)
      .pipe(catchError(this.handleError));
  }

  getReservationWithEvent(reservationId: number): Observable<Reservation> {
    return this.http
      .get<Reservation>(`${this.api}/with-event/${reservationId}`)
      .pipe(catchError(this.handleError));
  }

  getAllReservations(): Observable<Reservation[]> {
    return this.http
      .get<Reservation[]>(`${this.api}/all`)
      .pipe(catchError(this.handleError));
  }

  // --- PAYMENT FLOW METHODS ---
  createPayment(reservationId: number): Observable<string> {
    return this.http.post(
      `http://localhost:8081/api/events/payments/create/${reservationId}`, {},
      { responseType: 'text' }
    );
  }

  confirmPayment(paymentIntentId: string): Observable<Reservation> {
    return this.http.post<Reservation>(
      `http://localhost:8081/api/events/payments/confirm/${paymentIntentId}`, {}
    );
  }
}
