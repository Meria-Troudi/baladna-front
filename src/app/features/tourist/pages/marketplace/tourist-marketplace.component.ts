import { Component, OnInit } from '@angular/core';
import QRCode from 'qrcode';
import { throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { MarketplaceCart, MarketplaceCategory, MarketplaceProduct, MarketplaceReview } from '../../../marketplace/models/marketplace.models';
import { MarketplaceApiService } from '../../../marketplace/services/marketplace-api.service';
import { MarketplaceCartService } from '../../../marketplace/services/marketplace-cart.service';
import { UserService } from '../../../user/user.service';
import { NegotiationService, NegotiationResponse } from '../../../marketplace/services/negotiation.service';

@Component({
  selector: 'app-tourist-marketplace',
  templateUrl: './tourist-marketplace.component.html',
  styleUrls: ['./tourist-marketplace.component.css'],
})
export class TouristMarketplaceComponent implements OnInit {
  products: MarketplaceProduct[] = [];
  categories: MarketplaceCategory[] = [];
  cart: MarketplaceCart | null = null;
  cartCount = 0;
  isLoading = true;
  hasError = false;
  isCartOpen = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  selectedProductForReviews: MarketplaceProduct | null = null;
  reviews: MarketplaceReview[] = [];
  reviewRating = 5;
  reviewComment = '';
  reviewLoading = false;
  
  checkoutModalOpen = false;
  checkoutSuccessOpen = false;
  checkoutOrderId: number | null = null;
  checkoutSnapshot: MarketplaceCart['items'] = [];
  checkoutSuccessQr = '';
  checkoutUserId: number | null = null;
  userEmail = '';
  
  // AI Negotiator
  negotiationOffer: NegotiationResponse | null = null;
  isNegotiating = false;
  
  customerForm = {
    nom: '',
    adresse: '',
    ville: '',
    codePostal: '',
    telephone: '',
    email: '',
  };

  constructor(
    private readonly marketplaceApi: MarketplaceApiService,
    private readonly marketplaceCart: MarketplaceCartService,
    private readonly userService: UserService,
    private readonly negotiationService: NegotiationService
  ) {}

  ngOnInit(): void {
    this.marketplaceApi.getAllProducts().subscribe({
      next: (products) => {
        this.products = products ?? [];
        this.isLoading = false;
        this.hasError = false;
      },
      error: () => {
        this.products = [];
        this.isLoading = false;
        this.hasError = true;
      },
    });
    this.marketplaceApi.getAllCategories().subscribe({
      next: (categories) => (this.categories = categories ?? []),
      error: () => (this.categories = []),
    });
    this.marketplaceCart.cart$.subscribe((cart) => {
      this.cart = cart;
      if (cart?.items?.length) {
        setTimeout(() => this.checkNegotiation(), 500);
      }
    });
    this.marketplaceCart.count$.subscribe((count) => (this.cartCount = count));
    this.marketplaceCart.loadCart().subscribe();
    
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.userEmail = user.email || '';
      } catch(e) {}
    }
    
    window.addEventListener('baladna-data-changed', () => this.loadProducts());
  }

  loadProducts(): void {
    this.marketplaceApi.getAllProducts().subscribe({
      next: (products) => { this.products = products ?? []; },
      error: () => {}
    });
  }

  // ========== AI NEGOTIATOR ==========
  checkNegotiation(): void {
    if (!this.cart?.items?.length || this.negotiationOffer) return;
    
    const items = this.cart.items.map(item => ({
      productName: item.nomProduit,
      price: item.prix,
      category: ''
    }));
    
    this.isNegotiating = true;
    this.negotiationService.negotiate(items, 0).subscribe({
      next: (response) => {
        if (response.totalSavings > 0 && response.discounts?.length > 0) {
          setTimeout(() => {
            this.negotiationOffer = response;
          }, 1000);
        }
        this.isNegotiating = false;
      },
      error: () => { this.isNegotiating = false; }
    });
  }

 acceptOffer(): void {
  if (this.negotiationOffer && this.cart) {
    // Appliquer les prix négociés au panier
    const negotiatedPrices: { [key: string]: number } = {};
    this.negotiationOffer.discounts.forEach(d => {
      negotiatedPrices[d.productName] = d.finalPrice;
    });

    // Mettre à jour les items du panier avec les prix négociés
    this.cart.items = this.cart.items.map(item => {
      if (negotiatedPrices[item.nomProduit]) {
        return { ...item, prix: negotiatedPrices[item.nomProduit], sousTotal: negotiatedPrices[item.nomProduit] * item.quantite };
      }
      return item;
    });

    // Recalculer le total
    this.cart.total = this.cart.items.reduce((sum, item) => sum + (item.prix * item.quantite), 0);

    this.showToast(`💰 Deal accepted! You saved ${this.negotiationOffer.totalSavings} TND! Total: ${this.cart.total} TND`);
  }
  this.negotiationOffer = null;
}

  declineOffer(): void {
    this.negotiationOffer = null;
    this.showToast('No worries, original prices kept.');
  }

  addToCart(product: MarketplaceProduct): void {
    this.marketplaceCart.addProduct(product).subscribe({
      next: () => this.showToast(`${product.nomProduit} added to cart.`),
      error: () => this.showToast('Unable to add this product to cart.', 'error'),
    });
  }

  removeFromCart(idProduit: number): void {
    this.marketplaceCart.removeProduct(idProduit).subscribe({
      next: () => this.showToast('Item removed from cart.'),
      error: () => this.showToast('Unable to remove this cart item.', 'error'),
    });
  }

  increaseQuantity(item: { idProduit: number; quantite: number }): void {
    this.marketplaceCart.updateQuantity(item.idProduit, item.quantite + 1).subscribe({
      error: () => this.showToast('Unable to update quantity.', 'error'),
    });
  }

  decreaseQuantity(item: { idProduit: number; quantite: number }): void {
    if (item.quantite <= 1) { this.removeFromCart(item.idProduit); return; }
    this.marketplaceCart.updateQuantity(item.idProduit, item.quantite - 1).subscribe({
      error: () => this.showToast('Unable to update quantity.', 'error'),
    });
  }

  openCheckoutModal(): void {
    if (!this.cart?.items?.length) { this.showToast('Cart is empty.', 'error'); return; }
    this.userService.getMyNumericUserId().subscribe({
      next: (idUser) => {
        this.checkoutUserId = idUser;
        this.checkoutModalOpen = true;
        this.checkoutSnapshot = this.cart?.items ? [...this.cart.items] : [];
      },
      error: () => this.showToast('Unable to get user info.', 'error')
    });
  }

  closeCheckoutModal(): void { this.checkoutModalOpen = false; this.checkoutUserId = null; }

  onCheckoutSuccess(order: any): void {
    this.checkoutOrderId = order.idCommande ?? null;
    this.checkoutModalOpen = false;
    this.checkoutSuccessOpen = true;
    this.customerForm.nom = order.nomClient || '';
    this.customerForm.adresse = order.adresseLivraison || '';
    this.customerForm.telephone = order.telephone || '';
    this.customerForm.email = this.userEmail || '';
    this.buildCheckoutSuccessQr();
    this.showToast('Order created successfully!');
  }

  onCheckoutClosed(): void { this.checkoutModalOpen = false; this.checkoutUserId = null; }

  closeSuccessModal(): void {
    this.checkoutSuccessOpen = false; this.checkoutOrderId = null;
    this.checkoutSnapshot = []; this.checkoutSuccessQr = '';
    this.customerForm = { nom: '', adresse: '', ville: '', codePostal: '', telephone: '', email: '' };
  }

  toggleCart(): void { this.isCartOpen = !this.isCartOpen; }

  getCategoryName(idCategorie?: number | null): string {
    return this.categories.find(c => c.idCategorie === idCategorie)?.nomCategorie || 'General';
  }

  openReviews(product: MarketplaceProduct): void {
    this.selectedProductForReviews = product; this.reviewComment = ''; this.reviewRating = 5; this.reviewLoading = true;
    this.marketplaceApi.getReviewsByProduct(product.idProduit).subscribe({
      next: (reviews) => { this.reviews = reviews ?? []; this.reviewLoading = false; },
      error: () => { this.reviews = []; this.reviewLoading = false; },
    });
  }

  closeReviews(): void { this.selectedProductForReviews = null; this.reviews = []; }
  setReviewRating(value: number): void { this.reviewRating = value; }

  submitReview(): void {
    if (!this.selectedProductForReviews) return;
    this.userService.getMyNumericUserId().pipe(
      switchMap((idUser) => {
        if (idUser == null) return throwError(() => new Error('no-user'));
        return this.marketplaceApi.createReview({ idUser, idProduit: this.selectedProductForReviews!.idProduit, rating: this.reviewRating, commentaire: this.reviewComment });
      })
    ).subscribe({
      next: (review) => { this.reviews = [review, ...this.reviews]; this.reviewComment = ''; this.showToast('Review added successfully.'); },
      error: () => this.showToast('Unable to submit review.', 'error'),
    });
  }

  starsFull(max = 5): number[] { return Array.from({ length: max }, (_, i) => i + 1); }

  getAvatarGradient(): string {
    const gradients = ['linear-gradient(135deg, #6366f1, #8b5cf6)', 'linear-gradient(135deg, #ec4899, #f43f5e)', 'linear-gradient(135deg, #f59e0b, #f97316)', 'linear-gradient(135deg, #10b981, #14b8a6)', 'linear-gradient(135deg, #0ea5e9, #06b6d4)', 'linear-gradient(135deg, #8b5cf6, #d946ef)'];
    return gradients[Math.floor(Math.random() * gradients.length)];
  }

  get checkoutTotal(): number { return this.checkoutSnapshot.reduce((sum, item) => sum + Number(item.prix) * Number(item.quantite), 0); }

  get deliveryAddressLine(): string {
    const f = this.customerForm;
    return [f.adresse, [f.codePostal, f.ville].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  }

  private async buildCheckoutSuccessQr(): Promise<void> {
    const id = this.checkoutOrderId; const nom = (this.customerForm.nom || '').trim(); const total = this.checkoutTotal;
    if (id == null) { this.checkoutSuccessQr = ''; return; }
    try { this.checkoutSuccessQr = await QRCode.toDataURL(`https://baladna.tn/order/${id}?n=${encodeURIComponent(nom)}&t=${total}`, { margin: 2, width: 220, color: { dark: '#1e293b', light: '#ffffff' } }); }
    catch { this.checkoutSuccessQr = ''; }
  }

  private showToast(message: string, type: 'success' | 'error' = 'success'): void {
    this.toastMessage = message; this.toastType = type;
    setTimeout(() => { if (this.toastMessage === message) this.toastMessage = ''; }, 2200);
  }




isVisualSearchOpen = false;
visualSearchResults: any[] = [];
isSearching = false;
searchImagePreview: string | null = null;

openVisualSearch(): void {
  this.isVisualSearchOpen = true;
  this.visualSearchResults = [];
  this.searchImagePreview = null;
}

closeVisualSearch(): void { this.isVisualSearchOpen = false; }

onImageSelected(event: any): void {
  const file = event.target.files[0];
  if (!file) return;
  
  // Preview
  const reader = new FileReader();
  reader.onload = () => { this.searchImagePreview = reader.result as string; };
  reader.readAsDataURL(file);
  
  // Search
  this.isSearching = true;
  const formData = new FormData();
  formData.append('file', file);
  
  fetch('http://localhost:8081/api/visual-search/search', {
    method: 'POST',
    body: formData
  })
  .then(res => res.json())
  .then(data => {
    this.visualSearchResults = data.products || [];
    this.isSearching = false;
  })
  .catch(() => { this.isSearching = false; });
}






}