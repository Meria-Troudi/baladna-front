import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import {
  MarketplaceCart,
  MarketplaceCartItemRequest,
  MarketplaceCategory,
  MarketplaceCheckoutRequest,
  MarketplaceOrder,
  MarketplaceProduct,
  MarketplaceProductUpsertRequest,
  MarketplaceReview,
  MarketplaceReviewRequest,
  MarketplaceUser,
  MarketplaceUserStats,
} from '../models/marketplace.models';

@Injectable({ providedIn: 'root' })
export class MarketplaceApiService {
  private readonly baseUrl = 'http://localhost:8081';
  private readonly userApiBaseUrl = 'http://localhost:8081/api';

  constructor(private readonly http: HttpClient) {}

  // ========= Products =========

  getAllProducts(): Observable<MarketplaceProduct[]> {
    return this.http.get<MarketplaceProduct[]>(`${this.baseUrl}/products`);
  }

  // ✅ NOUVEAU : Récupérer les produits d'un artisan spécifique
  getProductsByArtisan(artisanId: number): Observable<MarketplaceProduct[]> {
    return this.http.get<MarketplaceProduct[]>(`${this.baseUrl}/products/artisan/${artisanId}`);
  }

  getProductById(idProduit: number): Observable<MarketplaceProduct> {
    return this.http.get<MarketplaceProduct>(`${this.baseUrl}/products/${idProduit}`);
  }

  getProductsByCategory(idCategorie: number): Observable<MarketplaceProduct[]> {
    return this.http.get<MarketplaceProduct[]>(`${this.baseUrl}/products/categorie/${idCategorie}`);
  }

  createProduct(request: MarketplaceProductUpsertRequest): Observable<MarketplaceProduct> {
    return this.http.post<MarketplaceProduct>(`${this.baseUrl}/products`, request);
  }
/*
  updateProduct(idProduit: number, request: MarketplaceProductUpsertRequest): Observable<MarketplaceProduct> {
    return this.http.put<MarketplaceProduct>(`${this.baseUrl}/products/${idProduit}`, request);
  }

  deleteProduct(idProduit: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/products/${idProduit}`);
  }

  // ========= Categories =========
*/
  getAllCategories(): Observable<MarketplaceCategory[]> {
    return this.http.get<MarketplaceCategory[]>(`${this.baseUrl}/categories`);
  }




// ✅ MODIFIER updateProduct pour accepter artisanId
updateProduct(idProduit: number, request: MarketplaceProductUpsertRequest, artisanId: number): Observable<MarketplaceProduct> {
  return this.http.put<MarketplaceProduct>(`${this.baseUrl}/products/${idProduit}?currentArtisanId=${artisanId}`, request);
}

// ✅ MODIFIER deleteProduct pour accepter artisanId
deleteProduct(idProduit: number, artisanId: number): Observable<void> {
  return this.http.delete<void>(`${this.baseUrl}/products/${idProduit}?currentArtisanId=${artisanId}`);
}













  createCategory(nomCategorie: string): Observable<MarketplaceCategory> {
    return this.http.post<MarketplaceCategory>(`${this.baseUrl}/categories`, { nomCategorie });
  }

  // ========= Cart =========

  getCartByUser(idUser: number): Observable<MarketplaceCart> {
    return this.http.get<MarketplaceCart>(`${this.baseUrl}/cart/${idUser}`);
  }

  addCartItem(request: MarketplaceCartItemRequest): Observable<MarketplaceCart> {
    return this.http.post<MarketplaceCart>(`${this.baseUrl}/cart/add`, request);
  }

  updateCartItem(request: MarketplaceCartItemRequest): Observable<MarketplaceCart> {
    return this.http.put<MarketplaceCart>(`${this.baseUrl}/cart/update`, request);
  }

  removeCartItem(request: MarketplaceCartItemRequest): Observable<MarketplaceCart> {
    return this.http.request<MarketplaceCart>('delete', `${this.baseUrl}/cart/remove`, { body: request });
  }

  // ========= Reviews =========

  getReviewsByProduct(idProduit: number): Observable<MarketplaceReview[]> {
    return this.http.get<MarketplaceReview[]>(`${this.baseUrl}/products/${idProduit}/reviews`);
  }

  createReview(request: MarketplaceReviewRequest): Observable<MarketplaceReview> {
    return this.http.post<MarketplaceReview>(`${this.baseUrl}/reviews`, request);
  }

  // ========= Orders =========

  checkout(request: MarketplaceCheckoutRequest): Observable<MarketplaceOrder> {
    console.log('[API] Checkout request:', JSON.stringify(request));
    return this.http.post<MarketplaceOrder>(`${this.baseUrl}/orders/checkout`, request);
  }

  getOrdersByUser(idUser: number): Observable<MarketplaceOrder[]> {
    return this.http.get<MarketplaceOrder[]>(`${this.baseUrl}/orders/${idUser}`);
  }

  getOrdersByArtisan(idArtisan: number): Observable<MarketplaceOrder[]> {
    return this.http.get<MarketplaceOrder[]>(`${this.baseUrl}/orders/artisan/${idArtisan}`);
  }

  getOrderDetail(idCommande: number): Observable<MarketplaceOrder> {
    return this.http.get<MarketplaceOrder>(`${this.baseUrl}/orders/detail/${idCommande}`);
  }

  getAllOrders(): Observable<MarketplaceOrder[]> {
    return this.getUsers().pipe(
      map((users) => users.map((user) => Number(user.id)).filter((id) => Number.isFinite(id) && id > 0)),
      catchError(() => of([] as number[])),
      map((ids) => Array.from(new Set(ids))),
      map((ids) => ids.slice(0, 20)),
      map((ids) => ids.map((id) => this.getOrdersByUser(id).pipe(catchError(() => of([]))))),
      map((requests) => (requests.length ? requests : [of([])])),
      switchMap((requests) => forkJoin(requests)),
      map((chunks) => chunks.flat().sort((a, b) => (b.idCommande ?? 0) - (a.idCommande ?? 0)))
    );
  }

  getRecentOrdersByUser(idUser: number, limit = 5): Observable<MarketplaceOrder[]> {
    return this.getOrdersByUser(idUser).pipe(
      catchError(() => of([])),
      map((orders) => orders.slice(0, limit))
    );
  }

  getUsers(): Observable<MarketplaceUser[]> {
    return this.http.get<MarketplaceUser[]>(`${this.userApiBaseUrl}/users`);
  }

  getUserStats(): Observable<MarketplaceUserStats> {
    return this.http.get<MarketplaceUserStats>(`${this.userApiBaseUrl}/users/stats`);
  }
}