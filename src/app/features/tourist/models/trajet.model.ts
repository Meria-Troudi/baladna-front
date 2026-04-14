export interface Trajet {
  id: number;
  departureStationId?: number;
  departureStationName?: string;
  arrivalStationId?: number;
  arrivalStationName?: string;
  distanceKm?: number;
  estimatedDurationMinutes?: number;
  pricePerKm?: number;
  basePrice?: number;
}