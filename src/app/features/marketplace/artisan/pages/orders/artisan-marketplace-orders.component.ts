import { Component, OnInit } from '@angular/core';
import { MarketplaceOrder } from '../../../models/marketplace.models';
import { MarketplaceApiService } from '../../../services/marketplace-api.service';
import { UserService } from '../../../../user/user.service';

@Component({
  selector: 'app-artisan-marketplace-orders',
  templateUrl: './artisan-marketplace-orders.component.html',
  styleUrls: ['./artisan-marketplace-orders.component.css'],
})
export class ArtisanMarketplaceOrdersComponent implements OnInit {
  orders: MarketplaceOrder[] = [];
  artisanId: number | null = null;
  isLoading = true;
  loadError = false;
  selectedOrder: MarketplaceOrder | null = null;

  constructor(
    private readonly marketplaceApi: MarketplaceApiService,
    private readonly userService: UserService
  ) {}

  ngOnInit(): void {
    this.userService.getMyNumericUserId().subscribe({
      next: (id) => {
        this.artisanId = id;
        if (id == null) {
          this.isLoading = false;
          this.loadError = true;
          this.orders = [];
          return;
        }
        this.loadOrders();
      },
    });
  }

  viewDetails(idCommande: number): void {
    this.marketplaceApi.getOrderDetail(idCommande).subscribe({
      next: (order) => (this.selectedOrder = order),
      error: () => {
        this.selectedOrder = this.orders.find((order) => order.idCommande === idCommande) || null;
      },
    });
  }

  closeDetails(): void {
    this.selectedOrder = null;
  }

  private loadOrders(): void {
    if (this.artisanId == null) {
      return;
    }
    this.isLoading = true;
    this.loadError = false;
    const url = `GET http://localhost:8081/orders/artisan/${this.artisanId}`;
    // eslint-disable-next-line no-console
    console.log('Orders API request:', url, '(artisan scope; GET /orders/{userId} is for customer orders)');
    this.marketplaceApi.getOrdersByArtisan(this.artisanId).subscribe({
      next: (orders) => {
        this.orders = orders ?? [];
        this.isLoading = false;
        // eslint-disable-next-line no-console
        console.log('Orders:', this.orders);
      },
      error: (err) => {
        this.orders = [];
        this.isLoading = false;
        this.loadError = true;
        // eslint-disable-next-line no-console
        console.error('Orders API error:', err);
      },
    });
  }
}
