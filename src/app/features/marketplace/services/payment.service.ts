import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { MarketplacePaymentRequest, MarketplacePaymentResponse } from '../models/marketplace.models';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly baseUrl = 'http://localhost:8081';

  constructor(private readonly http: HttpClient) {}

  processPayment(request: MarketplacePaymentRequest): Observable<MarketplacePaymentResponse> {
    const endpoint = `${this.baseUrl}/payment/process`;
    
    console.log('[PaymentService] Sending payment request to:', endpoint);
    console.log('[PaymentService] Request data:', {
      idUser: request.idUser,
      amount: request.amount,
      cardNumber: request.cardNumber ? '****' + request.cardNumber.slice(-4) : 'N/A',
      expiryDate: request.expiryDate,
      cardHolderName: request.cardHolderName
    });

    return this.http.post<MarketplacePaymentResponse>(endpoint, request).pipe(
      tap({
        next: (response) => {
          console.log('[PaymentService] ✅ SUCCESS response:', response);
        },
        error: (error) => {
          console.error('[PaymentService] ❌ HTTP ERROR:', error);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('[PaymentService] Error details:', {
          status: error.status,
          message: error.message,
          error: error.error
        });
        
        return of({
          status: 'FAILED' as const,
          message: error.status === 0 
            ? 'Impossible de se connecter au serveur de paiement' 
            : `Erreur: ${error.status} - ${error.message}`
        } as MarketplacePaymentResponse);
      })
    );
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }
}