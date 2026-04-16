export interface Reservation {
  id: number;
  ticketCode?: string;
  reservedSeats: number;
  totalPrice: number;
  pricePerSeat: number;
  reservationDate: string;
  boardingPoint: string;
  status: string;
  transportId: number;
  transportDeparturePoint?: string;
  transportRoute?: string;
  userId?: number;
  userFullName?: string;
  userEmail?: string;
}

export interface ReservationRequest {
  transportId: number;
  boardingPoint: string;
  seatsCount: number;
}
