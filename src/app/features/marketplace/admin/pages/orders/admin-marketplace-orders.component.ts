import { Component, OnInit } from '@angular/core';
import { MarketplaceOrder } from '../../../models/marketplace.models';
import { MarketplaceApiService } from '../../../services/marketplace-api.service';

@Component({
  selector: 'app-admin-marketplace-orders',
  templateUrl: './admin-marketplace-orders.component.html',
  styleUrls: ['./admin-marketplace-orders.component.css'],
})
export class AdminMarketplaceOrdersComponent implements OnInit {
  orders: MarketplaceOrder[] = [];
  selectedOrder: MarketplaceOrder | null = null;
  isLoading = true;

  constructor(private readonly marketplaceApi: MarketplaceApiService) {}

  ngOnInit(): void {
    this.marketplaceApi.getAllOrders().subscribe({
      next: (orders) => {
        this.orders = orders;
        this.isLoading = false;
      },
      error: () => {
        this.orders = [];
        this.isLoading = false;
      },
    });
  }

  viewDetails(order: MarketplaceOrder): void {
    this.marketplaceApi.getOrderDetail(order.idCommande).subscribe({
      next: (details) => (this.selectedOrder = details),
      error: () => (this.selectedOrder = order),
    });
  }
}

