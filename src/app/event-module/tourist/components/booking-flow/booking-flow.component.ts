import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  AfterViewInit
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Event } from '../../../models/event.model';
import { ReservationService, Reservation } from '../../../services/reservation.service';
import { BookingFacadeService } from '../../../services/booking-facade.service';
import { ModalComponent } from '../../../shared/modal/modal.component';

import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';
import { firstValueFrom } from 'rxjs';

type Step = 'RESERVATION' | 'PAYMENT' | 'SUCCESS';

@Component({
  selector: 'app-booking-flow',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './booking-flow.component.html',
  styleUrls: ['./booking-flow.component.css']
})
export class BookingFlowComponent implements OnChanges, AfterViewInit {

  @Input() event: Event | null = null;
  @Input() reservation: Reservation | null = null;
  @Input() editMode = false;
  @Input() userId!: number;

  @Output() close = new EventEmitter<void>();
  @Output() completed = new EventEmitter<Reservation>();

  // FLOW STATE
  step: Step = 'RESERVATION';

  // FORM STATE
  personsCount = 1;
  loading = false;
  error = '';
  success = '';

  // PAYMENT STATE
  stripe!: Stripe;
  elements!: StripeElements;
  paymentElement: any;
  clientSecret!: string;

  constructor(
    private reservationService: ReservationService,
    private bookingFacade: BookingFacadeService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['reservation'] && this.reservation) {
      this.personsCount = this.reservation.personsCount;

      if (this.reservation.paymentStatus === 'PENDING') {
        this.step = 'PAYMENT';
        setTimeout(() => this.initPayment(), 0);
      }
    }
  }

  ngAfterViewInit(): void {}

  get totalPrice(): number {
    return (this.event?.price || 0) * this.personsCount;
  }

  /* =========================
      STEP 1 → CREATE RESERVATION
     ========================= */
  async submitReservation() {
    if (!this.event?.id) {
      this.error = 'Event not found';
      return;
    }

    if (this.personsCount < 1 || this.personsCount > 10) {
      this.error = 'Persons must be between 1 and 10';
      return;
    }

    this.loading = true;
    this.error = '';

    this.reservationService.create(this.event.id, this.personsCount).subscribe({
      next: async (res) => {
        this.reservation = res;
        this.bookingFacade.loadMyReservations();

        // FREE EVENT → skip payment
        if ((!this.event?.price || this.event.price === 0) && res.status === 'CONFIRMED') {
          this.step = 'SUCCESS';
          this.completed.emit(res);
          this.loading = false;
          return;
        }

        // PAID EVENT → go payment
        this.step = 'PAYMENT';
        await this.initPayment();
        this.loading = false;
      },
      error: () => {
        this.error = 'Reservation failed';
        this.loading = false;
      }
    });
  }

  /* =========================
      STEP 2 → INIT STRIPE
     ========================= */
  async initPayment() {
    try {
      this.loading = true;

      this.clientSecret = await firstValueFrom(
        this.reservationService.createPayment(this.reservation!.id)
      );

      console.log('Received clientSecret from backend:', this.clientSecret);

      // Use publishable key that matches backend's stripe.api.key (same Stripe account)
      // Backend uses stripe.api.key=sk_test_51TN0AJ..., so use corresponding publishable key
      this.stripe = await loadStripe('pk_test_51TPmUlRA6EnTES9P74BKd32bGrVBrOjLdrsia2EF6sClJWpR80zGL9w6scG1cNKob73DwW005IqBXZpeb0jzeoVn00z2joAGrT') as Stripe;

      this.elements = this.stripe.elements({
        clientSecret: this.clientSecret
      });

      this.paymentElement = this.elements.create('payment', {
        layout: 'tabs'
      });

      // Handle payment element errors
      this.paymentElement.on('loaderror', (event: any) => {
        console.error('Payment Element load error:', event.error);
        this.error = 'Payment form failed to load. Please refresh and try again.';
        this.loading = false;
      });

      this.paymentElement.on('ready', () => {
        console.log('Payment Element is ready');
        this.loading = false;
      });

      setTimeout(() => {
        const container = document.getElementById('payment-element');
        if (container) {
          this.paymentElement.mount('#payment-element');
        } else {
          console.error('Payment element container not found');
          this.error = 'Payment form container not found. Please refresh the page.';
          this.loading = false;
        }
      }, 100);

    } catch (err) {
      console.error('initPayment error:', err);
      this.error = 'Payment initialization failed. Please check your connection and try again.';
      this.loading = false;
    }
  }

  /* =========================
      STEP 2 → PAY
     ========================= */
  async pay() {
    if (!this.stripe) return;

    this.loading = true;
    this.error = '';

    const { error, paymentIntent } = await this.stripe.confirmPayment({
      elements: this.elements,
      redirect: 'if_required'
    });

    if (error) {
      this.error = error.message || 'Payment failed';
      this.loading = false;
      return;
    }

    if (paymentIntent?.status === 'succeeded') {
      this.reservationService.confirmPayment(paymentIntent.id)
        .subscribe(res => {
          this.reservation = res;
          this.bookingFacade.loadMyReservations();

          // Ensure event card updates to "Reserved" after payment
          setTimeout(() => this.bookingFacade.loadMyReservations(), 300);

          // Move to step 3 (success) after payment, do not close automatically
          this.step = 'SUCCESS';
          this.loading = false;
          // Only emit completed if you want to notify parent, but do not close modal
        });
    }
  }

  /* =========================
      CLOSE
     ========================= */
  onClose() {
    this.close.emit();
  }
}