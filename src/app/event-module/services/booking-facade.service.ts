// booking-facade.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Reservation } from './reservation.service';
import { ReservationService } from './reservation.service';

export type ReservationActionState = 'NONE' | 'PENDING_PAYMENT' | 'CONFIRMED' | 'WAITLISTED' | 'CANCELLED' | 'FULL';

@Injectable({ providedIn: 'root' })
export class BookingFacadeService {
  private reservations$ = new BehaviorSubject<Reservation[]>([]);
  private myReservationsMap: { [eventId: number]: Reservation } = {};

  constructor(private reservationService: ReservationService) {}

  loadMyReservations(): void {
    this.reservationService.getMyReservations().subscribe(res => {
      this.reservations$.next(res);
      this.myReservationsMap = {};
      res.forEach(r => {
        if (r.event && r.event.id != null) {
          const eid = typeof r.event.id === 'string' ? parseInt(r.event.id, 10) : r.event.id;
          this.myReservationsMap[eid] = r;
        }
      });
      console.log('myReservationsMap', this.myReservationsMap);
    });
  }

  getReservationForEvent(eventId: number): Reservation | undefined {
    return this.myReservationsMap[eventId];
  }

  getActionState(eventId: number): ReservationActionState {
    const r = this.getReservationForEvent(eventId);
    if (!r) return 'NONE';
    if (r.status === 'WAITLISTED') return 'WAITLISTED';
    if (r.status === 'CANCELLED') return 'CANCELLED';
    if (r.status === 'CONFIRMED' && r.paymentStatus === 'PAID') return 'CONFIRMED';
    if (r.status === 'PENDING' && r.paymentStatus === 'PENDING') return 'PENDING_PAYMENT';
    return 'NONE';
  }

  canEdit(reservation: Reservation | undefined): boolean {
    return !!reservation && reservation.status === 'PENDING' && reservation.paymentStatus === 'PENDING';
  }

  canCancel(reservation: Reservation | undefined): boolean {
    return !!reservation && (
      reservation.status === 'CONFIRMED' ||
      reservation.status === 'WAITLISTED' ||
      (reservation.status === 'PENDING' && reservation.paymentStatus === 'PENDING')
    );
  }

  canPay(reservation: Reservation | undefined): boolean {
    return !!reservation && reservation.status === 'PENDING' && reservation.paymentStatus === 'PENDING';
  }

  getReservations$(): Observable<Reservation[]> {
    return this.reservations$.asObservable();
  }
}