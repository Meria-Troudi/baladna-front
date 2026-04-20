import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of } from 'rxjs';

import { HostBookingsComponent } from './host-bookings.component';
import { Reservation } from '../../../tourist/models/reservation.model';
import { TransportService } from '../../../tourist/services/transport.service';
import { TransportTicketService } from '../../../../shared/services/transport-ticket.service';

describe('HostBookingsComponent reservation statuses', () => {
  let component: HostBookingsComponent;
  let transportService: jasmine.SpyObj<TransportService>;
  let transportTicketService: jasmine.SpyObj<TransportTicketService>;
  let router: jasmine.SpyObj<Router>;

  const route = {
    queryParamMap: of(convertToParamMap({}))
  } as ActivatedRoute;

  const createReservation = (status: string, overrides: Partial<Reservation> = {}): Reservation => ({
    id: overrides.id ?? Math.floor(Math.random() * 10000),
    reservedSeats: overrides.reservedSeats ?? 1,
    totalPrice: overrides.totalPrice ?? 12,
    pricePerSeat: overrides.pricePerSeat ?? 12,
    reservationDate: overrides.reservationDate ?? '2026-04-20T09:00:00.000Z',
    boardingPoint: overrides.boardingPoint ?? 'Bousaada',
    status,
    transportId: overrides.transportId ?? 1,
    transportRoute: overrides.transportRoute ?? 'Bousaada -> El Ghraba',
    userFullName: overrides.userFullName ?? 'Fatma Esprit',
    userEmail: overrides.userEmail ?? 'fatma@example.com',
    ...overrides
  });

  beforeEach(() => {
    transportService = jasmine.createSpyObj<TransportService>('TransportService', [
      'markReservationAsBoarded',
      'deleteMyReservation',
      'approveReservation',
      'rejectReservation',
      'validateReservationTicket',
      'getAllReservations'
    ]);
    transportTicketService = jasmine.createSpyObj<TransportTicketService>('TransportTicketService', [
      'getTicketCode',
      'getTicketQrCodeDataUrl',
      'openTicketPdf'
    ]);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    component = new HostBookingsComponent(transportService, transportTicketService, route, router);
  });

  it('maps every reservation status to a readable host label', () => {
    expect(component.getStatusLabel('PENDING_APPROVAL')).toBe('Pending approval');
    expect(component.getStatusLabel('CONFIRMED')).toBe('Confirmed');
    expect(component.getStatusLabel('BOARDED')).toBe('Boarded');
    expect(component.getStatusLabel('CANCELLED')).toBe('Cancelled');
    expect(component.getStatusLabel('REJECTED')).toBe('Rejected');
  });

  it('counts pending, active, and cancelled reservations with the expected status rules', () => {
    component.reservations = [
      createReservation('PENDING_APPROVAL', { id: 1 }),
      createReservation('CONFIRMED', { id: 2 }),
      createReservation('BOARDED', { id: 3 }),
      createReservation('CANCELLED', { id: 4 }),
      createReservation('REJECTED', { id: 5 })
    ];

    expect(component.pendingReservations.map((reservation) => reservation.id)).toEqual([1]);
    expect(component.activeReservationsCount).toBe(3);
    expect(component.cancelledReservationsCount).toBe(2);
  });

  it('keeps separate pending reservations when the same passenger books more than once', () => {
    component.reservations = [
      createReservation('PENDING_APPROVAL', { id: 101, transportId: 10, userEmail: 'fatma@example.com' }),
      createReservation('PENDING_APPROVAL', { id: 102, transportId: 11, userEmail: 'fatma@example.com' }),
      createReservation('CONFIRMED', { id: 103, transportId: 12, userEmail: 'fatma@example.com' })
    ];

    expect(component.pendingReservations.map((reservation) => reservation.id)).toEqual([101, 102]);
  });

  it('allows the host to mark a reservation as boarded only when it is confirmed', () => {
    expect(component.canMarkAsBoarded(createReservation('PENDING_APPROVAL'))).toBeFalse();
    expect(component.canMarkAsBoarded(createReservation('CONFIRMED'))).toBeTrue();
    expect(component.canMarkAsBoarded(createReservation('BOARDED'))).toBeFalse();
    expect(component.canMarkAsBoarded(createReservation('CANCELLED'))).toBeFalse();
    expect(component.canMarkAsBoarded(createReservation('REJECTED'))).toBeFalse();
  });

  it('calls the board endpoint only for confirmed reservations', () => {
    const confirmed = createReservation('CONFIRMED', { id: 10 });
    const pending = createReservation('PENDING_APPROVAL', { id: 11 });

    transportService.markReservationAsBoarded.and.returnValue(of(createReservation('BOARDED', { id: 10 })));
    spyOn(component, 'loadReservations');

    component.markAsBoarded(pending);
    expect(transportService.markReservationAsBoarded).not.toHaveBeenCalled();

    component.markAsBoarded(confirmed);
    expect(transportService.markReservationAsBoarded).toHaveBeenCalledOnceWith(10);
    expect(component.loadReservations).toHaveBeenCalled();
  });

  it('extracts the ticket code from legacy JSON QR payloads before validation', () => {
    expect(component['normalizeTicketCodeInput']('{"ticketCode":"BLD-0010-ABC123"}')).toBe('BLD-0010-ABC123');
    expect(component['normalizeTicketCodeInput']('BLD-0010-ABC123')).toBe('BLD-0010-ABC123');
    expect(component['normalizeTicketCodeInput']('   ')).toBe('');
  });

  it('filters and paginates the pending reservation list with the shared page size', () => {
    component.reservations = [
      createReservation('PENDING_APPROVAL', { id: 1, userFullName: 'Fatma One', userEmail: 'fatma.one@example.com' }),
      createReservation('PENDING_APPROVAL', { id: 2, userFullName: 'Fatma Two', userEmail: 'fatma.two@example.com' }),
      createReservation('PENDING_APPROVAL', { id: 3, userFullName: 'Amal Three', userEmail: 'amal.three@example.com' })
    ];

    component.setListPageSize(2);
    expect(component.paginatedPendingReservations.map((reservation) => reservation.id)).toEqual([1, 2]);
    expect(component.pendingTotalPages).toBe(2);

    component.goToPendingPage(2);
    expect(component.paginatedPendingReservations.map((reservation) => reservation.id)).toEqual([3]);

    component.pendingSearchTerm = 'fatma';
    component.applyPendingFilter();
    expect(component.filteredPendingReservations.map((reservation) => reservation.id)).toEqual([1, 2]);
    expect(component.pendingCurrentPage).toBe(1);
  });
});
