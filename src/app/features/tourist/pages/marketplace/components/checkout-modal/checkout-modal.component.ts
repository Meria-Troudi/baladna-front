import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { loadStripe, Stripe, StripeCardElement } from '@stripe/stripe-js';
import { MarketplaceApiService } from '../../../../../../features/marketplace/services/marketplace-api.service';
import { MarketplaceCheckoutRequest, MarketplaceOrder, STATUT_LABELS, STATUT_TIMELINE } from '../../../../../../features/marketplace/models/marketplace.models';
import { MarketplaceCartService } from '../../../../../../features/marketplace/services/marketplace-cart.service';
import { STRIPE_PUBLISHABLE_KEY } from '../../../../../../features/marketplace/services/stripe.config';

@Component({
  selector: 'app-checkout-modal',
  templateUrl: './checkout-modal.component.html',
  styleUrls: ['./checkout-modal.component.scss']
})
export class CheckoutModalComponent implements OnInit {

  @Input() userId!: number;
  @Input() cartTotal: number = 0;
  @Output() closed = new EventEmitter<void>();
  @Output() orderSuccess = new EventEmitter<MarketplaceOrder>();

  checkoutForm!: FormGroup;
  paymentMethod: 'CASH_ON_DELIVERY' | 'CARD' = 'CASH_ON_DELIVERY';

  isLoading = false;
  errorMessage = '';
  successMessage = '';
  currentTransactionId: string | null = null;

  STATUT_LABELS = STATUT_LABELS;
  STATUT_TIMELINE = STATUT_TIMELINE;

  factureReady = false;
  userEmail = '';
  lastOrder: MarketplaceOrder | null = null;

  stripe: Stripe | null = null;
  cardElement: StripeCardElement | null = null;
  stripeLoaded = false;

  private readonly FACTURE_API = 'http://localhost:8081/api/factures';
  private readonly PAYMENT_API = 'http://localhost:8081/payment';

  constructor(
    private fb: FormBuilder,
    private marketplaceApi: MarketplaceApiService,
    private cartService: MarketplaceCartService,
    private http: HttpClient
  ) {}

  async ngOnInit(): Promise<void> {
    this.checkoutForm = this.fb.group({
      nomClient: ['', Validators.required],
      telephone: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      adresseLivraison: ['', Validators.required]
    });

    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try { const user = JSON.parse(userStr); this.userEmail = user.email || ''; } catch (e) {}
    }

    try {
      this.stripe = await loadStripe(STRIPE_PUBLISHABLE_KEY);
      this.stripeLoaded = true;
      console.log('✅ Stripe loaded');
    } catch (e) {
      console.error('❌ Stripe failed to load', e);
    }
  }

  selectPaymentMethod(method: 'CASH_ON_DELIVERY' | 'CARD'): void {
    this.paymentMethod = method;
    this.errorMessage = '';
    if (method === 'CARD') {
      setTimeout(() => this.initStripeCard(), 200);
    }
  }

  initStripeCard(): void {
    if (!this.stripe) { this.errorMessage = 'Stripe not loaded'; return; }

    const el = document.getElementById('card-element');
    if (!el) { console.error('card-element not found'); return; }

    el.innerHTML = '';

    const elements = this.stripe.elements();
    this.cardElement = elements.create('card', {
      style: {
        base: {
          color: '#ffffff',
          fontSize: '16px',
          fontFamily: 'Arial, sans-serif',
          '::placeholder': { color: '#9ca3af' }
        }
      }
    });

    this.cardElement.mount('#card-element');
    console.log('✅ Stripe card mounted');
  }

  confirm(): void {
    this.errorMessage = '';
    if (!this.checkoutForm.get('nomClient')?.value) { this.errorMessage = 'Name required'; return; }
    if (!this.checkoutForm.get('telephone')?.value) { this.errorMessage = 'Phone required'; return; }
    if (!this.checkoutForm.get('adresseLivraison')?.value) { this.errorMessage = 'Address required'; return; }

    if (this.paymentMethod === 'CASH_ON_DELIVERY') {
      this.isLoading = true;
      this.createOrder('');
    } else {
      this.processStripePayment();
    }
  }

  async processStripePayment(): Promise<void> {
    if (!this.stripe || !this.cardElement) { this.errorMessage = 'Payment not ready'; return; }

    this.isLoading = true;
    const { error, paymentMethod } = await this.stripe.createPaymentMethod({ type: 'card', card: this.cardElement });

    if (error) { this.isLoading = false; this.errorMessage = error.message || 'Card error'; return; }

    this.http.post(`${this.PAYMENT_API}/create-payment-intent`, {
      amount: this.cartTotal,
      paymentMethodId: paymentMethod.id
    }).subscribe({
      next: (res: any) => {
        if (res.status === 'SUCCESS') {
          this.currentTransactionId = res.transactionId;
          this.createOrder(res.transactionId);
        } else {
          this.isLoading = false;
          this.errorMessage = res.message || 'Payment failed';
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message || 'Payment error';
      }
    });
  }

  createOrder(txId: string): void {
    const payload: MarketplaceCheckoutRequest = {
      userId: this.userId,
      total: this.cartTotal,
      paymentMethod: this.paymentMethod === 'CASH_ON_DELIVERY' ? 'CASH' : 'CARD',
      nomClient: this.checkoutForm.get('nomClient')?.value || '',
      telephone: this.checkoutForm.get('telephone')?.value || '',
      adresseLivraison: this.checkoutForm.get('adresseLivraison')?.value || ''
    };

    this.marketplaceApi.checkout(payload).subscribe({
      next: (order: MarketplaceOrder) => {
        this.isLoading = false;
        this.lastOrder = order;
        const id = order.idCommande || (order as any).id;
        this.successMessage = 'Order #' + id + ' created!';

        this.http.post(`${this.FACTURE_API}/generer/${id}`, {}).subscribe({
          next: (facture: any) => {
            if (facture.pdfBase64) {
              const b = atob(facture.pdfBase64);
              const arr = new Uint8Array(b.length);
              for (let i = 0; i < b.length; i++) arr[i] = b.charCodeAt(i);
              const blob = new Blob([arr], { type: 'application/pdf' });
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = `Invoice_${facture.numeroFacture}.pdf`;
              a.click();
            }
            this.userEmail = facture.emailTouriste || this.userEmail;
            this.factureReady = true;
          }
        });

        this.cartService.loadCart().subscribe();
        setTimeout(() => { this.orderSuccess.emit(order); this.closed.emit(); }, 2000);
      },
      error: (err: any) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message || 'Order error';
      }
    });
  }

  isFieldInvalid(f: string): boolean { const c = this.checkoutForm.get(f); return !!(c && c.touched && c.invalid); }
  close(): void { this.closed.emit(); }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }
}
