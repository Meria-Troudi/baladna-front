import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { Station } from '../models/station.model';
import { Trajet } from '../models/trajet.model';
import { Transport } from '../models/transport.model';
import { Reservation, ReservationRequest } from '../models/reservation.model';


export interface GeoLocationResult {
  name: string;
  city: string;
  displayName: string;
  latitude: number;
  longitude: number;
}

export interface RoutePreview {
  distanceKm: number;
  estimatedDurationMinutes: number;
  routeGeoJson: string | null;
}

export interface WeatherPreview {
  weather: string;
  weatherSource: string;
  weatherTemperature?: number | null;
  weatherWindSpeed?: number | null;
  weatherPrecipitation?: number | null;
  delayMinutes?: number | null;
}
export interface ReservationTicketValidationResponse {
  valid: boolean;
  message: string;
  reservationId?: number;
  transportId?: number;
  ticketCode?: string;
  passengerName?: string;
  passengerEmail?: string;
  transportRoute?: string;
  boardingPoint?: string;
  reservedSeats?: number;
  totalPrice?: number;
  reservationDate?: string;
  status?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TransportService {
  private readonly apiUrl = 'http://localhost:8081/api';

  constructor(private http: HttpClient) {}

  // =========================
  // STATIONS (HOST)
  // =========================
  getStations(): Observable<Station[]> {
    console.log('[TransportService] GET /stations');

    return this.http.get<Station[]>(`${this.apiUrl}/stations`).pipe(
      tap((response) => console.log('[TransportService] stations received:', response)),
      catchError((error) => this.handleError(error))
    );
  }

  createStation(payload: Partial<Station>): Observable<Station> {
    console.log('[TransportService] POST /stations', payload);

    return this.http.post<Station>(`${this.apiUrl}/stations`, payload).pipe(
      tap((response) => console.log('[TransportService] station created:', response)),
      catchError((error) => this.handleError(error))
    );
  }

  updateStation(id: number, payload: Partial<Station>): Observable<Station> {
    console.log(`[TransportService] PUT /stations/${id}`, payload);

    return this.http.put<Station>(`${this.apiUrl}/stations/${id}`, payload).pipe(
      tap((response) => console.log('[TransportService] station updated:', response)),
      catchError((error) => this.handleError(error))
    );
  }

  deleteStation(id: number): Observable<any> {
    console.log(`[TransportService] DELETE /stations/${id}`);

    return this.http.delete(`${this.apiUrl}/stations/${id}`, { responseType: 'text' }).pipe(
      tap((response) => console.log('[TransportService] station deleted:', response)),
      catchError((error) => this.handleError(error))
    );
  }

  // =========================
  // TRAJETS (HOST)
  // =========================
  getTrajets(): Observable<Trajet[]> {
    console.log('[TransportService] GET /trajets');

    return this.http.get<Trajet[]>(`${this.apiUrl}/trajets`).pipe(
      tap((response) => console.log('[TransportService] trajets received:', response)),
      catchError((error) => this.handleError(error))
    );
  }

  createTrajet(payload: Partial<Trajet>): Observable<Trajet> {
    console.log('[TransportService] POST /trajets', payload);

    return this.http.post<Trajet>(`${this.apiUrl}/trajets`, payload).pipe(
      tap((response) => console.log('[TransportService] trajet created:', response)),
      catchError((error) => this.handleError(error))
    );
  }

  updateTrajet(id: number, payload: Partial<Trajet>): Observable<Trajet> {
    console.log(`[TransportService] PUT /trajets/${id}`, payload);

    return this.http.put<Trajet>(`${this.apiUrl}/trajets/${id}`, payload).pipe(
      tap((response) => console.log('[TransportService] trajet updated:', response)),
      catchError((error) => this.handleError(error))
    );
  }

  deleteTrajet(id: number): Observable<any> {
    console.log(`[TransportService] DELETE /trajets/${id}`);

    return this.http.delete(`${this.apiUrl}/trajets/${id}`, { responseType: 'text' }).pipe(
      tap((response) => console.log('[TransportService] trajet deleted:', response)),
      catchError((error) => this.handleError(error))
    );
  }

  geocodeLocation(query: string): Observable<GeoLocationResult[]> {
    console.log('[TransportService] GET /stations/geocode', { query });

    return this.http.get<GeoLocationResult[]>(`${this.apiUrl}/stations/geocode`, {
      params: { query }
    }).pipe(
      tap((response) => console.log('[TransportService] geocoding results received:', response)),
      catchError((error) => this.handleError(error))
    );
  }

  reverseGeocodeLocation(latitude: number, longitude: number): Observable<GeoLocationResult> {
    console.log('[TransportService] GET /stations/reverse-geocode', { latitude, longitude });

    return this.http.get<GeoLocationResult>(`${this.apiUrl}/stations/reverse-geocode`, {
      params: {
        lat: latitude,
        lng: longitude
      }
    }).pipe(
      tap((response) => console.log('[TransportService] reverse geocoding result received:', response)),
      catchError((error) => this.handleError(error))
    );
  }

  previewRoute(departureStationId: number, arrivalStationId: number): Observable<RoutePreview> {
    return this.http.get<RoutePreview>(`${this.apiUrl}/trajets/preview`, {
      params: {
        departureStationId,
        arrivalStationId
      }
    }).pipe(
      tap((response) => console.log('[TransportService] route preview received:', response)),
      catchError((error) => this.handleError(error))
    );
  }
  getWeatherPreview(trajetId: number, departureDate: string): Observable<WeatherPreview> {
  return this.http.get<WeatherPreview>(`${this.apiUrl}/transports/weather-preview`, {
    params: {
      trajetId,
      departureDate
    }
  }).pipe(
    tap((response) => console.log('[TransportService] weather preview received:', response)),
    catchError((error) => this.handleError(error))
  );
}

  // =========================
  // TRANSPORTS (HOST + TOURIST)
  // =========================
  getAllTransports(): Observable<Transport[]> {
    console.log('[TransportService] GET /transports');

    return this.http.get<Transport[]>(`${this.apiUrl}/transports`).pipe(
      tap((response) => console.log('[TransportService] all transports received:', response)),
      catchError((error) => this.handleError(error))
    );
  }

  getAvailableTransports(): Observable<Transport[]> {
    console.log('[TransportService] GET /transports/available');

    return this.http.get<Transport[]>(`${this.apiUrl}/transports/available`).pipe(
      tap((response) => console.log('[TransportService] available transports received:', response)),
      catchError((error) => this.handleError(error))
    );
  }

  searchTransports(departureCity: string, arrivalCity: string): Observable<Transport[]> {
    console.log('[TransportService] GET /transports/search', { departureCity, arrivalCity });

    return this.http.get<Transport[]>(`${this.apiUrl}/transports/search`, {
      params: { departureCity, arrivalCity }
    }).pipe(
      tap((response) => console.log('[TransportService] transport search result:', response)),
      catchError((error) => this.handleError(error))
    );
  }

  createTransport(payload: Partial<Transport>): Observable<Transport> {
    console.log('[TransportService] POST /transports', payload);

    return this.http.post<Transport>(`${this.apiUrl}/transports`, payload).pipe(
      tap((response) => console.log('[TransportService] transport created:', response)),
      catchError((error) => this.handleError(error))
    );
  }

  updateTransport(id: number, payload: Partial<Transport>): Observable<Transport> {
    console.log(`[TransportService] PUT /transports/${id}`, payload);

    return this.http.put<Transport>(`${this.apiUrl}/transports/${id}`, payload).pipe(
      tap((response) => console.log('[TransportService] transport updated:', response)),
      catchError((error) => this.handleError(error))
    );
  }

  deleteTransport(id: number): Observable<any> {
    console.log(`[TransportService] DELETE /transports/${id}`);

    return this.http.delete(`${this.apiUrl}/transports/${id}`, { responseType: 'text' }).pipe(
      tap((response) => console.log('[TransportService] transport deleted:', response)),
      catchError((error) => this.handleError(error))
    );
  }

  // =========================
  // RESERVATIONS (TOURIST)
  // =========================
  createReservation(payload: ReservationRequest): Observable<Reservation> {
    console.log('[TransportService] POST /reservations', payload);

    return this.http.post<Reservation>(`${this.apiUrl}/reservations`, payload).pipe(
      tap((response) => console.log('[TransportService] reservation created:', response)),
      catchError((error) => this.handleError(error))
    );
  }

  getMyReservations(): Observable<Reservation[]> {
    console.log('[TransportService] GET /reservations/me');

    return this.http.get<Reservation[]>(`${this.apiUrl}/reservations/me`).pipe(
      tap((response) => console.log('[TransportService] my reservations received:', response)),
      catchError((error) => this.handleError(error))
    );
  }

  getAllReservations(): Observable<Reservation[]> {
    console.log('[TransportService] GET /reservations');

    return this.http.get<Reservation[]>(`${this.apiUrl}/reservations`).pipe(
      tap((response) => console.log('[TransportService] all reservations received:', response)),
      catchError((error) => this.handleError(error))
    );
  }

  cancelReservation(id: number): Observable<Reservation> {
    console.log(`[TransportService] PUT /reservations/${id}/cancel`);

    return this.http.put<Reservation>(`${this.apiUrl}/reservations/${id}/cancel`, {}).pipe(
      tap((response) => console.log('[TransportService] reservation cancelled:', response)),
      catchError((error) => this.handleError(error))
    );
  }
  approveReservation(id: number): Observable<Reservation> {
  console.log(`[TransportService] PUT /reservations/${id}/approve`);
  return this.http.put<Reservation>(`${this.apiUrl}/reservations/${id}/approve`, {}).pipe(
    tap((response) => console.log('[TransportService] reservation approved:', response)),
    catchError((error) => this.handleError(error))
  );
}

rejectReservation(id: number): Observable<Reservation> {
  console.log(`[TransportService] PUT /reservations/${id}/reject`);
  return this.http.put<Reservation>(`${this.apiUrl}/reservations/${id}/reject`, {}).pipe(
    tap((response) => console.log('[TransportService] reservation rejected:', response)),
    catchError((error) => this.handleError(error))
  );
}

getPendingReservations(): Observable<Reservation[]> {
  console.log('[TransportService] GET /reservations/pending');
  return this.http.get<Reservation[]>(`${this.apiUrl}/reservations/pending`).pipe(
    tap((response) => console.log('[TransportService] pending reservations received:', response)),
    catchError((error) => this.handleError(error))
  );
}

  validateReservationTicket(ticketCode: string): Observable<ReservationTicketValidationResponse> {
    console.log('[TransportService] POST /reservations/validate-ticket', { ticketCode });

    return this.http.post<ReservationTicketValidationResponse>(`${this.apiUrl}/reservations/validate-ticket`, {
      ticketCode
    }).pipe(
      tap((response) => console.log('[TransportService] ticket validation response:', response)),
      catchError((error) => this.handleError(error))
    );
  }

  private handleError(error: HttpErrorResponse) {
    console.error('[TransportService] API error', {
      status: error.status,
      message: error.message,
      url: error.url,
      error: error.error
    });

    return throwError(() => error);
  }
}
