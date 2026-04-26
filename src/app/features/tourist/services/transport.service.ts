import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { Station } from '../models/station.model';
import { Trajet } from '../models/trajet.model';
import { TrafficCongestionLevel, Transport } from '../models/transport.model';
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
  routingSource?: string | null;
  weatherTemperature?: number | null;
  weatherWindSpeed?: number | null;
  weatherPrecipitation?: number | null;
  routeDistanceKm?: number | null;
  estimatedDurationMinutes?: number | null;
  trafficCongestionLevel?: TrafficCongestionLevel | null;
  weatherDelayMinutes?: number | null;
  trafficDelayMinutes?: number | null;
  delayMinutes?: number | null;
  confidencePercent?: number | null;
  primaryReason?: string | null;
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

export interface TransportAiOption {
  transportId: number;
  routeLabel: string;
  departurePoint: string;
  departureCity: string;
  arrivalCity: string;
  departureDate: string;
  availableSeats: number;
  totalCapacity: number;
  basePrice: number;
  weather?: string | null;
  predictedDelayMinutes?: number | null;
  aiScore: number;
  reasons: string[];
  warnings: string[];
}

export interface BestTransportRecommendation {
  generatedAt: string;
  departureQuery: string;
  arrivalQuery: string;
  analyzedCount: number;
  summary: string;
  recommendationFeedbackId?: number | null;
  recommended: TransportAiOption | null;
  alternatives: TransportAiOption[];
}

export interface TransportDelayPrediction {
  transportId: number;
  ruleBasedDelayMinutes: number;
  predictedDelayMinutes: number;
  riskLevel: string;
  confidencePercent?: number | null;
  primaryReason?: string | null;
  estimatedArrivalDate?: string | null;
  predictionSource?: string | null;
  trainedModelId?: number | null;
  trainedModelSampleCount?: number | null;
  trainedModelMeanAbsoluteError?: number | null;
  explanation: string;
  recommendation: string;
  factors: string[];
}

export interface TransportAiAlert {
  transportId: number;
  severity: string;
  title: string;
  message: string;
  suggestedAction: string;
  routeLabel: string;
  departureDate: string;
  predictedDelayMinutes?: number | null;
}

export interface HostTransportAiReport {
  generatedAt: string;
  totalUpcomingTransports: number;
  activeBookings: number;
  atRiskTransports: number;
  lowOccupancyTransports: number;
  averageOccupancyRate: number;
  estimatedRevenue: number;
  topRouteLabel: string;
  topRouteBookingCount: number;
  recommendations: string[];
}

export interface TransportAiDelayModelSummary {
  modelId?: number | null;
  trained: boolean;
  sampleCount?: number | null;
  meanAbsoluteError?: number | null;
  rootMeanSquaredError?: number | null;
  trainedAt?: string | null;
  predictionSource?: string | null;
  notes?: string | null;
}

export interface TransportAiDatasetSummary {
  hostEmail?: string | null;
  tripRecords?: number | null;
  trainingReadyTripRecords?: number | null;
  realTripRecords?: number | null;
  bootstrapTripRecords?: number | null;
  realTrainingReadyTripRecords?: number | null;
  bootstrapTrainingReadyTripRecords?: number | null;
  incidentRecords?: number | null;
  hostMetricRecords?: number | null;
  recommendationRecords?: number | null;
  generatedAt?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class TransportService {
  private readonly apiUrl = 'http://localhost:8081/api';

  constructor(private http: HttpClient) {}

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

  getWeatherPreview(trajetId: number, departureDate: string, trafficCongestionLevel: TrafficCongestionLevel = 'NONE'): Observable<WeatherPreview> {
    return this.http.get<WeatherPreview>(`${this.apiUrl}/transports/weather-preview`, {
      params: {
        trajetId,
        departureDate,
        trafficCongestionLevel
      }
    }).pipe(
      tap((response) => console.log('[TransportService] weather preview received:', response)),
      catchError((error) => this.handleError(error))
    );
  }

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

  getBestTransportRecommendation(departure?: string, arrival?: string): Observable<BestTransportRecommendation> {
    console.log('[TransportService] GET /transports/ai/recommendation', { departure, arrival });

    const params: Record<string, string> = {};
    if (departure?.trim()) {
      params['departure'] = departure.trim();
    }
    if (arrival?.trim()) {
      params['arrival'] = arrival.trim();
    }

    return this.http.get<BestTransportRecommendation>(`${this.apiUrl}/transports/ai/recommendation`, { params }).pipe(
      tap((response) => console.log('[TransportService] AI recommendation received:', response)),
      catchError((error) => this.handleError(error))
    );
  }

  getDelayPrediction(transportId: number): Observable<TransportDelayPrediction> {
    console.log(`[TransportService] GET /transports/ai/delay-prediction/${transportId}`);

    return this.http.get<TransportDelayPrediction>(`${this.apiUrl}/transports/ai/delay-prediction/${transportId}`).pipe(
      tap((response) => console.log('[TransportService] AI delay prediction received:', response)),
      catchError((error) => this.handleError(error))
    );
  }

  getHostAiAlerts(): Observable<TransportAiAlert[]> {
    console.log('[TransportService] GET /transports/ai/alerts');

    return this.http.get<TransportAiAlert[]>(`${this.apiUrl}/transports/ai/alerts`).pipe(
      tap((response) => console.log('[TransportService] host AI alerts received:', response)),
      catchError((error) => this.handleError(error))
    );
  }

  getHostAiReport(): Observable<HostTransportAiReport> {
    console.log('[TransportService] GET /transports/ai/report');

    return this.http.get<HostTransportAiReport>(`${this.apiUrl}/transports/ai/report`).pipe(
      tap((response) => console.log('[TransportService] host AI report received:', response)),
      catchError((error) => this.handleError(error))
    );
  }

  getHostAiModelSummary(): Observable<TransportAiDelayModelSummary> {
    console.log('[TransportService] GET /transports/ai/model/summary');

    return this.http.get<TransportAiDelayModelSummary>(`${this.apiUrl}/transports/ai/model/summary`).pipe(
      tap((response) => console.log('[TransportService] host AI model summary received:', response)),
      catchError((error) => this.handleError(error))
    );
  }

  getHostAiDatasetSummary(): Observable<TransportAiDatasetSummary> {
    console.log('[TransportService] GET /transports/ai/dataset/summary');

    return this.http.get<TransportAiDatasetSummary>(`${this.apiUrl}/transports/ai/dataset/summary`).pipe(
      tap((response) => console.log('[TransportService] host AI dataset summary received:', response)),
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

deleteMyReservation(id: number): Observable<string> {
  console.log(`[TransportService] DELETE /reservations/${id}`);

  return this.http.delete(`${this.apiUrl}/reservations/${id}`, {
    responseType: 'text'
  }).pipe(
    tap((response) => console.log('[TransportService] reservation deleted:', response)),
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

  markReservationAsBoarded(id: number): Observable<Reservation> {
    console.log(`[TransportService] PUT /reservations/${id}/board`);

    return this.http.put<Reservation>(`${this.apiUrl}/reservations/${id}/board`, {}).pipe(
      tap((response) => console.log('[TransportService] reservation marked as boarded:', response)),
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
  let readableMessage = 'Erreur API transport.';

  if (typeof error.error === 'string') {
    if (
      error.error.includes('<!DOCTYPE') ||
      error.error.includes('<html') ||
      error.error.includes('Please sign in')
    ) {
      readableMessage = 'Le backend a retourné une page HTML de login au lieu du JSON. Vérifie le token JWT ou SecurityConfig.';
    } else {
      readableMessage = error.error;
    }
  } else if (error.error?.message) {
    readableMessage = error.error.message;
  } else if (error.status === 0) {
    readableMessage = 'Backend inaccessible. Vérifie que Spring Boot tourne sur le bon port.';
  } else if (error.status === 401) {
    readableMessage = 'Non connecté. Connecte-toi avant d’utiliser cette partie.';
  } else if (error.status === 403) {
    readableMessage = 'Accès refusé. Cette action demande le rôle HOST.';
  }

  console.error('[TransportService] API error', {
    status: error.status,
    message: readableMessage,
    url: error.url,
    error: error.error
  });

  return throwError(() => new Error(readableMessage));
}
}
