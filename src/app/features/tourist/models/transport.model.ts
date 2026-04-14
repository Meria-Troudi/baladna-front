export interface Transport {
  id: number;
  departurePoint: string;
  departureDate: string;
  realDepartureDate?: string;
  totalCapacity: number;
  availableSeats: number;
  status: string;
  basePrice: number;
  trafficJam?: boolean;
  weather?: string;
  trajetId?: number;
  trajetDescription?: string;
  delayMinutes?: number;
}