import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Accommodation,
  AccommodationRequest,
  BookingRequest,
  BookingResponse,
  ClientReviewRow,
  HostReservationRow,
  PayRequest,
  PayResponse,
  QuoteRequest,
  QuoteResponse,
  ReviewRequest,
  TouristReservationRow,
  TripDescribeRequest,
  TripSuggestionResponse
} from '../models/accommodation.types';

@Injectable({ providedIn: 'root' })
export class AccommodationApiService {
  private readonly base = 'http://localhost:8081/api/accommodations';

  constructor(private http: HttpClient) {}

  listForMap(): Observable<Accommodation[]> {
    return this.http.get<Accommodation[]>(`${this.base}/public/map`);
  }

  listAll(): Observable<Accommodation[]> {
    return this.http.get<Accommodation[]>(`${this.base}/public/list`);
  }

  getOne(id: string): Observable<Accommodation> {
    return this.http.get<Accommodation>(`${this.base}/public/${id}`);
  }

  suggestions(destination?: string, intention?: string): Observable<Accommodation[]> {
    let params = new HttpParams();
    if (destination) params = params.set('destination', destination);
    if (intention) params = params.set('intention', intention);
    return this.http.get<Accommodation[]>(`${this.base}/public/suggestions`, { params });
  }

  quote(body: QuoteRequest): Observable<QuoteResponse> {
    return this.http.post<QuoteResponse>(`${this.base}/public/quote`, body);
  }

  /** AI / keyword trip matcher — only suggests existing listings from the database. */
  tripSuggest(body: TripDescribeRequest): Observable<TripSuggestionResponse> {
    return this.http.post<TripSuggestionResponse>(`${this.base}/public/trip-suggest`, body);
  }

  listMine(): Observable<Accommodation[]> {
    return this.http.get<Accommodation[]>(`${this.base}/host/mine`);
  }

  create(body: AccommodationRequest): Observable<Accommodation> {
    return this.http.post<Accommodation>(this.base, body);
  }

  update(id: string, body: AccommodationRequest): Observable<Accommodation> {
    return this.http.put<Accommodation>(`${this.base}/${id}`, body);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  uploadCover(id: string, file: File): Observable<void> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<void>(`${this.base}/${id}/cover`, fd);
  }

  bookStay(body: BookingRequest): Observable<BookingResponse> {
    return this.http.post<BookingResponse>(`${this.base}/tourist/book`, body);
  }

  payBooking(body: PayRequest): Observable<PayResponse> {
    return this.http.post<PayResponse>(`${this.base}/tourist/pay`, body);
  }

  myReservations(): Observable<TouristReservationRow[]> {
    return this.http.get<TouristReservationRow[]>(`${this.base}/tourist/reservations`);
  }

  submitReview(body: ReviewRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/tourist/reviews`, body);
  }

  hostClientReviews(): Observable<ClientReviewRow[]> {
    return this.http.get<ClientReviewRow[]>(`${this.base}/host/client-reviews`);
  }

  hostReservations(): Observable<HostReservationRow[]> {
    return this.http.get<HostReservationRow[]>(`${this.base}/host/reservations`);
  }
}
