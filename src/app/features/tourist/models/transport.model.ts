export type TrafficCongestionLevel = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';

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
  trafficCongestionLevel?: TrafficCongestionLevel;
  weather?: string;
  weatherSource?: string;
  trajetId?: number;
  trajetDescription?: string;
  delayMinutes?: number;
  actualDelayMinutes?: number | null;
  weatherTemperature?: number;
  weatherWindSpeed?: number;
  weatherPrecipitation?: number;
}
