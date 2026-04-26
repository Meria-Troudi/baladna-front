import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, finalize, of, switchMap, tap, throwError } from 'rxjs';
import { MarketplaceCart, MarketplaceCartItemRequest, MarketplaceOrder, MarketplaceProduct } from '../models/marketplace.models';
import { MarketplaceApiService } from './marketplace-api.service';
import { UserService } from '../../user/user.service';

@Injectable({ providedIn: 'root' })
export class MarketplaceCartService {
  private readonly cartSubject = new BehaviorSubject<MarketplaceCart | null>(null);
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);

  readonly cart$ = this.cartSubject.asObservable();
  readonly loading$ = this.loadingSubject.asObservable();
  readonly count$ = new BehaviorSubject<number>(0);

  constructor(
    private readonly marketplaceApi: MarketplaceApiService,
    private readonly userService: UserService
  ) {}

  loadCart(): Observable<MarketplaceCart | null> {
    this.loadingSubject.next(true);
    return this.userService.getMyNumericUserId().pipe(
      switchMap((userId) => {
        if (userId == null) {
          this.cartSubject.next(null);
          this.count$.next(0);
          return of(null);
        }
        return this.marketplaceApi.getCartByUser(userId).pipe(
          tap((cart) => this.patchCart(cart)),
          catchError(() => {
            this.cartSubject.next(null);
            this.count$.next(0);
            return of(null);
          })
        );
      }),
      finalize(() => this.loadingSubject.next(false))
    );
  }

  addProduct(product: MarketplaceProduct, quantity = 1): Observable<MarketplaceCart> {
    return this.userService.getMyNumericUserId().pipe(
      switchMap((userId) => {
        if (userId == null) {
          return throwError(() => new Error('Not authenticated'));
        }
        const current = this.cartSubject.value ?? {
          idPanier: Date.now(),
          idUser: userId,
          items: [],
          total: 0,
          status: 'ACTIVE',
        };
        if (current) {
          const existing = current.items.find((item) => item.idProduit === product.idProduit);
          if (existing) {
            existing.quantite += quantity;
            existing.sousTotal = existing.quantite * existing.prix;
          } else {
            current.items = [
              ...current.items,
              {
                idCartItem: Date.now(),
                idProduit: product.idProduit,
                nomProduit: product.nomProduit,
                imageProduit: product.imageProduit ?? '',
                quantite: quantity,
                prix: product.prixProduit,
                sousTotal: product.prixProduit * quantity,
              },
            ];
          }
          current.total = current.items.reduce((sum, item) => sum + item.sousTotal, 0);
          this.patchCart({ ...current });
        }

        return this.marketplaceApi
          .addCartItem({
            idUser: userId,
            idProduit: product.idProduit,
            quantite: quantity,
          })
          .pipe(tap((cart) => this.patchCart(cart)));
      })
    );
  }

  removeProduct(idProduit: number): Observable<MarketplaceCart> {
    return this.userService.getMyNumericUserId().pipe(
      switchMap((userId) => {
        if (userId == null) {
          return throwError(() => new Error('Not authenticated'));
        }
        const current = this.cartSubject.value;
        if (current) {
          current.items = current.items.filter((item) => item.idProduit !== idProduit);
          current.total = current.items.reduce((sum, item) => sum + item.sousTotal, 0);
          this.patchCart({ ...current });
        }
        return this.marketplaceApi
          .removeCartItem({
            idUser: userId,
            idProduit,
            quantite: 1,
          })
          .pipe(tap((cart) => this.patchCart(cart)));
      })
    );
  }

  updateQuantity(idProduit: number, quantite: number): Observable<MarketplaceCart> {
    return this.userService.getMyNumericUserId().pipe(
      switchMap((userId) => {
        if (userId == null) {
          return throwError(() => new Error('Not authenticated'));
        }
        const current = this.cartSubject.value;
        if (current) {
          current.items = current.items.map((item) =>
            item.idProduit === idProduit
              ? { ...item, quantite, sousTotal: Number(item.prix) * quantite }
              : item
          );
          current.total = current.items.reduce((sum, item) => sum + Number(item.prix) * Number(item.quantite), 0);
          this.patchCart({ ...current });
        }
        const payload: MarketplaceCartItemRequest = { idUser: userId, idProduit, quantite };
        return this.marketplaceApi.updateCartItem(payload).pipe(tap((cart) => this.patchCart(cart)));
      })
    );
  }

  checkout(): Observable<MarketplaceOrder> {
    return this.userService.getMyNumericUserId().pipe(
      switchMap((userId) => {
        if (userId == null) {
          return throwError(() => new Error('Not authenticated'));
        }
        return this.marketplaceApi.checkout({ userId: userId }).pipe(
          tap(() => {
            const current = this.cartSubject.value;
            if (current) {
              this.patchCart({ ...current, items: [], total: 0 });
            }
          })
        );
      })
    );
  }

  private patchCart(cart: MarketplaceCart | null): void {
    if (cart) {
      const normalized = {
        ...cart,
        items: cart.items ?? [],
      };
      normalized.total = normalized.items.reduce((sum, item) => sum + Number(item.prix) * Number(item.quantite), 0);
      this.cartSubject.next(normalized);
      this.count$.next(normalized.items.reduce((sum, item) => sum + item.quantite, 0));
      return;
    }
    this.cartSubject.next(cart);
    this.count$.next(0);
  }
}
