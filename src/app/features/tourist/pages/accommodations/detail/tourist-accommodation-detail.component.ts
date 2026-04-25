import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AccommodationApiService } from '../../../../accommodation/services/accommodation-api.service';
import {
  Accommodation,
  BookingResponse,
  PayResponse,
  QuoteResponse
} from '../../../../accommodation/models/accommodation.types';

@Component({
  selector: 'app-tourist-accommodation-detail',
  templateUrl: './tourist-accommodation-detail.component.html',
  styleUrls: ['./tourist-accommodation-detail.component.css']
})
export class TouristAccommodationDetailComponent implements OnInit {
  acc: Accommodation | null = null;
  loading = true;
  err: string | null = null;

  checkIn = '';
  checkOut = '';
  guestCount = 2;
  selectedRoomIds = new Set<string>();
  quoting = false;
  quote: QuoteResponse | null = null;
  quoteErr: string | null = null;

  bookingBusy = false;
  bookingErr: string | null = null;
  pendingBooking: BookingResponse | null = null;

  payBusy = false;
  payErr: string | null = null;
  cardNumber = '';
  cardHolder = '';
  payResult: PayResponse | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: AccommodationApiService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/tourist/accommodations']);
      return;
    }
    this.api.getOne(id).subscribe({
      next: (a) => {
        this.acc = a;
        this.guestCount = Math.max(1, Math.min(2, a.maxGuests || 2));
        this.loading = false;
        for (const r of a.rooms) {
          if (r.id) this.selectedRoomIds.add(r.id);
        }
      },
      error: () => {
        this.err = 'Listing not found or no longer active.';
        this.loading = false;
      }
    });
  }

  toggleRoom(id: string): void {
    if (this.selectedRoomIds.has(id)) this.selectedRoomIds.delete(id);
    else this.selectedRoomIds.add(id);
  }

  isSelected(id: string): boolean {
    return this.selectedRoomIds.has(id);
  }

  selectAll(): void {
    this.selectedRoomIds.clear();
    for (const r of this.acc?.rooms ?? []) {
      if (r.id) this.selectedRoomIds.add(r.id);
    }
  }

  requestQuote(): void {
    if (!this.acc || !this.checkIn || !this.checkOut || this.selectedRoomIds.size === 0) {
      return;
    }
    this.quoting = true;
    this.quote = null;
    this.quoteErr = null;
    this.pendingBooking = null;
    this.payResult = null;
    this.payErr = null;
    this.api
      .quote({
        accommodationId: this.acc.id,
        checkIn: this.checkIn,
        checkOut: this.checkOut,
        roomIds: [...this.selectedRoomIds]
      })
      .subscribe({
        next: (q) => {
          this.quote = q;
          this.quoting = false;
        },
        error: (e) => {
          this.quoting = false;
          this.quoteErr =
            e?.error?.message || 'Could not compute quote for these dates.';
        }
      });
  }

  confirmBooking(): void {
    if (!this.acc || !this.checkIn || !this.checkOut || this.selectedRoomIds.size === 0 || !this.quote) {
      return;
    }
    this.bookingBusy = true;
    this.bookingErr = null;
    this.pendingBooking = null;
    this.payResult = null;
    this.api
      .bookStay({
        accommodationId: this.acc.id,
        checkIn: this.checkIn,
        checkOut: this.checkOut,
        roomIds: [...this.selectedRoomIds],
        guests: this.guestCount
      })
      .subscribe({
        next: (b) => {
          this.pendingBooking = b;
          this.bookingBusy = false;
        },
        error: (e) => {
          this.bookingBusy = false;
          this.bookingErr =
            e?.error?.message ||
            e?.message ||
            'Could not create booking. Sign in as a tourist and try again.';
        }
      });
  }

  submitPayment(): void {
    if (!this.pendingBooking) return;
    this.payBusy = true;
    this.payErr = null;
    this.payResult = null;
    this.api
      .payBooking({
        bookingGroupId: this.pendingBooking.bookingGroupId,
        cardNumber: this.cardNumber,
        cardHolder: this.cardHolder || undefined
      })
      .subscribe({
        next: (p) => {
          this.payResult = p;
          this.payBusy = false;
        },
        error: (e) => {
          this.payBusy = false;
          this.payErr = e?.error?.message || 'Payment failed.';
        }
      });
  }

  typeLabel(type: string): string {
    const map: Record<string, string> = {
      GUEST_HOUSE: 'Guest house',
      CAMPING: 'Camping',
      APARTMENT: 'Apartment',
      FARM: 'Farm stay',
      OTHER: 'Other'
    };
    return map[type] || type;
  }

  back(): void {
    this.router.navigate(['/tourist/accommodations']);
  }
}
