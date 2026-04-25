export type AccommodationType =
  | 'GUEST_HOUSE'
  | 'CAMPING'
  | 'APARTMENT'
  | 'FARM'
  | 'OTHER';
export type AccommodationStatus = 'ACTIVE' | 'INACTIVE' | 'DRAFT';
export type RoomType = 'STANDARD' | 'DOUBLE' | 'SUITE' | 'DORM' | 'FAMILY' | 'OTHER';

export interface RoomDto {
  id?: string;
  type: RoomType;
  capacity: number;
  pricePerNight: number;
  amenities?: string;
}

export interface Accommodation {
  id: string;
  title: string;
  description?: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  maxGuests: number;
  amenities?: string;
  rules?: string;
  type: AccommodationType;
  status: AccommodationStatus;
  hostId: number;
  coverImageUrl?: string | null;
  rooms: RoomDto[];
  fromPricePerNight?: number | null;
}

export interface RoomRequest {
  id?: string;
  type: RoomType;
  capacity: number;
  pricePerNight: number;
  amenities?: string;
}

export interface AccommodationRequest {
  title: string;
  description?: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  maxGuests: number;
  amenities?: string;
  rules?: string;
  type: AccommodationType;
  status?: AccommodationStatus;
  rooms: RoomRequest[];
}

export interface QuoteRequest {
  accommodationId: string;
  checkIn: string;
  checkOut: string;
  roomIds: string[];
}

export interface QuoteResponse {
  nights: number;
  subtotalBeforeAdjustments: number;
  lastRoomPremiumPercent: number | null;
  fullPropertyDiscountPercent: number | null;
  total: number;
  appliedRules: string[];
}

export interface BookingRequest {
  accommodationId: string;
  checkIn: string;
  checkOut: string;
  roomIds: string[];
  guests: number;
}

export interface BookingResponse {
  bookingGroupId: string;
  invoiceNumber: string;
  confirmationCode: string;
  totalAmount: number;
  reservationIds: string[];
  paymentPending: boolean;
  message: string;
}

export interface PayRequest {
  bookingGroupId: string;
  cardNumber: string;
  cardHolder?: string;
}

export interface PayResponse {
  invoiceNumber: string;
  confirmationCode: string;
  qrImageBase64: string;
  confirmationEmailSent: boolean;
  message: string;
}

export interface TouristReservationRow {
  reservationId: string;
  bookingGroupId: string | null;
  accommodationId: string;
  accommodationTitle: string;
  coverImageUrl: string | null;
  checkIn: string;
  checkOut: string;
  status: string;
  paymentStatus: string;
  invoiceNumber: string | null;
  confirmationCode: string | null;
  priceTotal: number | null;
  roomSummary: string;
  canSubmitReview: boolean;
  existingReviewStars: number | null;
  existingReviewComment: string | null;
}

export interface ReviewRequest {
  reservationId: string;
  stars: number;
  comment?: string;
}

export interface ClientReviewRow {
  reviewId: string;
  stars: number;
  comment: string | null;
  createdAt: string;
  accommodationTitle: string;
  guestDisplayName: string;
  reservationId: string;
}

/** Host view: bookings on their listings (one row per reserved room line). */
export interface TripDescribeRequest {
  description: string;
}

export interface TripSuggestionResponse {
  accommodations: Accommodation[];
  note: string | null;
  mode: 'gemini' | 'keyword';
}

export interface HostReservationRow {
  reservationId: string;
  bookingGroupId: string | null;
  accommodationId: string;
  accommodationTitle: string;
  guestDisplayName: string;
  guestEmail: string | null;
  checkIn: string;
  checkOut: string;
  guests: number;
  status: string;
  paymentStatus: string;
  invoiceNumber: string | null;
  confirmationCode: string | null;
  priceTotal: number | null;
  roomSummary: string;
}
