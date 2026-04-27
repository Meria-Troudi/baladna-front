import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CartItem {
  productName: string;
  price: number;
  category: string;
}

export interface ProductDiscount {
  productName: string;
  originalPrice: number;
  finalPrice: number;
  discountPercent: number;
  savings: number;
  reasons: string[];
}

export interface NegotiationResponse {
  success: boolean;
  totalOriginal: number;
  totalNegotiated: number;
  totalSavings: number;
  discounts: ProductDiscount[];
  message: string;
}

@Injectable({ providedIn: 'root' })
export class NegotiationService {
  private apiUrl = 'http://localhost:8081/api/negotiate';

  constructor(private http: HttpClient) {}

  negotiate(items: CartItem[], orderCount: number): Observable<NegotiationResponse> {
    return this.http.post<NegotiationResponse>(this.apiUrl, {
      items: items,
      customerOrdersCount: orderCount
    });
  }
}