import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';

import { TouristTransportComponent } from './tourist-transport.component';
import { Reservation } from '../../models/reservation.model';
import { Transport } from '../../models/transport.model';
import { TransportService } from '../../services/transport.service';
import { TransportTicketService } from '../../../../shared/services/transport-ticket.service';

describe('TouristTransportComponent reservation statuses', () => {
  let component: TouristTransportComponent;
  let transportService: jasmine.SpyObj<TransportService>;
  let transportTicketService: jasmine.SpyObj<TransportTicketService>;
  let router: jasmine.SpyObj<Router>;

  const createReservation = (status: string, overrides: Partial<Reservation> = {}): Reservation => ({
    id: overrides.id ?? Math.floor(Math.random() * 10000),
    reservedSeats: overrides.reservedSeats ?? 1,
    totalPrice: overrides.totalPrice ?? 15,
    pricePerSeat: overrides.pricePerSeat ?? 15,
    reservationDate: overrides.reservationDate ?? '2026-04-20T09:00:00.000Z',
    boardingPoint: overrides.boardingPoint ?? 'Bousaada',
    status,
    transportId: overrides.transportId ?? 7,
    transportRoute: overrides.transportRoute ?? 'Bousaada -> El Ghraba',
    ...overrides
  });

  const createTransport = (overrides: Partial<Transport> = {}): Transport => ({
    id: overrides.id ?? 7,
    departurePoint: overrides.departurePoint ?? 'Bousaada',
    departureDate: overrides.departureDate ?? '2026-04-21T09:00:00.000Z',
    totalCapacity: overrides.totalCapacity ?? 20,
    availableSeats: overrides.availableSeats ?? 12,
    status: overrides.status ?? 'SCHEDULED',
    basePrice: overrides.basePrice ?? 15,
    ...overrides
  });

  beforeEach(() => {
    transportService = jasmine.createSpyObj<TransportService>('TransportService', [
      'createReservation',
      'getAvailableTransports',
      'getTrajets',
      'getStations',
      'getMyReservations',
      'cancelReservation',
      'deleteMyReservation'
    ]);
    transportTicketService = jasmine.createSpyObj<TransportTicketService>('TransportTicketService', [
      'getTicketCode',
      'getTicketQrCodeDataUrl',
      'openTicketPdf'
    ]);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    component = new TouristTransportComponent(
      transportService,
      new FormBuilder(),
      router,
      transportTicketService
    );
  });

  it('maps every reservation status to a readable tourist label', () => {
    expect(component.getReservationStatusLabel('PENDING_APPROVAL')).toBe('Pending Approval');
    expect(component.getReservationStatusLabel('CONFIRMED')).toBe('Confirmed');
    expect(component.getReservationStatusLabel('BOARDED')).toBe('Boarded');
    expect(component.getReservationStatusLabel('CANCELLED')).toBe('Cancelled');
    expect(component.getReservationStatusLabel('REJECTED')).toBe('Rejected');
  });

  it('exposes tourist actions according to the reservation status', () => {
    const pending = createReservation('PENDING_APPROVAL');
    const confirmed = createReservation('CONFIRMED');
    const boarded = createReservation('BOARDED');
    const cancelled = createReservation('CANCELLED');
    const rejected = createReservation('REJECTED');

    expect(component.canCancelReservation(pending)).toBeTrue();
    expect(component.canViewTicket(pending)).toBeFalse();
    expect(component.canDeleteReservation(pending)).toBeFalse();

    expect(component.canCancelReservation(confirmed)).toBeTrue();
    expect(component.canViewTicket(confirmed)).toBeTrue();
    expect(component.canDeleteReservation(confirmed)).toBeFalse();

    expect(component.canCancelReservation(boarded)).toBeFalse();
    expect(component.canViewTicket(boarded)).toBeTrue();
    expect(component.canDeleteReservation(boarded)).toBeFalse();

    expect(component.canCancelReservation(cancelled)).toBeFalse();
    expect(component.canViewTicket(cancelled)).toBeFalse();
    expect(component.canDeleteReservation(cancelled)).toBeTrue();

    expect(component.canCancelReservation(rejected)).toBeFalse();
    expect(component.canViewTicket(rejected)).toBeFalse();
    expect(component.canDeleteReservation(rejected)).toBeTrue();
  });

  it('counts active and closed reservations with the current tourist rules', () => {
    component.myReservations = [
      createReservation('PENDING_APPROVAL', { reservedSeats: 1 }),
      createReservation('CONFIRMED', { reservedSeats: 2 }),
      createReservation('BOARDED', { reservedSeats: 3 }),
      createReservation('CANCELLED', { reservedSeats: 4 }),
      createReservation('REJECTED', { reservedSeats: 5 })
    ];

    expect(component.activeReservationCount).toBe(3);
    expect(component.cancelledReservationCount).toBe(2);
    expect(component.reservedSeatCount).toBe(6);
  });

  it('prevents booking the same transport again while an active reservation already exists', () => {
    const transport = createTransport({ id: 99, availableSeats: 5, status: 'SCHEDULED' });

    component.myReservations = [createReservation('PENDING_APPROVAL', { transportId: 99 })];
    expect(component.hasActiveReservationForTransport(99)).toBeTrue();
    expect(component.canReserve(transport)).toBeFalse();

    component.myReservations = [createReservation('CANCELLED', { transportId: 99 })];
    expect(component.hasActiveReservationForTransport(99)).toBeFalse();
    expect(component.canReserve(transport)).toBeTrue();
  });
});
