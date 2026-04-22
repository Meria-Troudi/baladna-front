export interface Event {
  id: number | string;
  createdByUserId: number;
  title: string;
  description?: string;
  category?: string; // Now a string (enum value) instead of EventCategory object
  startAt?: string;
  endAt?: string;
  startAtStr?: string; // Backend string format for dates
  endAtStr?: string; // Backend string format for dates
  location?: string;
  latitude?: number;
  longitude?: number;
  capacity?: number;
  bookedSeats?: number;
  price?: number;
  status?: EventStatus;
  createdAt?: string;
  updatedAt?: string;
  reservations?: EventReservation[];
  imageUrl?: string; // Media URL from backend
  videoUrl?: string; // Video URL from backend
  additionalImages?: string[]; // Additional images from backend
  media?: EventMedia[]; // Media items with metadata
}

export interface EventMedia {
  eventId: string;
  url: string;
  type: 'IMAGE' | 'VIDEO';
  isCover: boolean;
  orderIndex: number;
}

export interface EventCategory {
  id: number;
  name: string;
  description?: string;
}

export interface EventReservation {
  id: number;
  event: Event;
  userId: number;
  numberOfSeats: number;
  totalPrice: number;
  status: ReservationStatus;
  createdAt?: string;
}

export enum EventStatus {
  UPCOMING = 'UPCOMING',
  ONGOING = 'ONGOING',
  FINISHED = 'FINISHED',
  CANCELED = 'CANCELED',
  FULL = 'FULL'
}

export enum ReservationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED'
}

export interface EventFilter {
  status?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  size?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}
