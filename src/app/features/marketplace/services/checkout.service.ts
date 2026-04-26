import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CheckoutRequest, CheckoutResponse, Commande } from '../../../models/commande.model';

@Injectable({ providedIn: 'root' })
export class CheckoutService {
  private readonly API = 'http://localhost:8081';

  constructor(private http: HttpClient) {}

  processCheckout(request: CheckoutRequest): Observable<CheckoutResponse> {
    return this.http.post<CheckoutResponse>(`${this.API}/orders/checkout`, request);
  }

  getCommandesByUser(userId: number): Observable<Commande[]> {
    return this.http.get<Commande[]>(`${this.API}/orders/${userId}`);
  }

  updateStatut(commandeId: number, statut: string): Observable<Commande> {
    return this.http.put<Commande>(`${this.API}/commandes/${commandeId}/statut`, { statut });
  }
}