import { Component, OnInit } from '@angular/core';
import { MarketplaceOrder } from '../../../models/marketplace.models';
import { MarketplaceApiService } from '../../../services/marketplace-api.service';

@Component({
  selector: 'app-host-marketplace-orders',
  templateUrl: './host-marketplace-orders.component.html',
  styleUrls: ['./host-marketplace-orders.component.css'],
})
export class HostMarketplaceOrdersComponent implements OnInit {
  orders: MarketplaceOrder[] = [];
  private readonly demoUserId = 1;

  constructor(private readonly marketplaceApi: MarketplaceApiService) {}

  ngOnInit(): void {
    this.marketplaceApi.getOrdersByUser(this.demoUserId).subscribe({
      next: (orders) => (this.orders = orders),
      error: () => (this.orders = []),
    });
  }
}

