import { Component, OnInit } from '@angular/core';
import { MarketplaceActivityItem, MarketplaceDashboardStat } from '../../../models/marketplace.models';
import { MarketplaceApiService } from '../../../services/marketplace-api.service';

@Component({
  selector: 'app-host-marketplace-dashboard',
  templateUrl: './host-marketplace-dashboard.component.html',
  styleUrls: ['./host-marketplace-dashboard.component.css'],
})
export class HostMarketplaceDashboardComponent implements OnInit {
  stats: MarketplaceDashboardStat[] = [];
  activity: MarketplaceActivityItem[] = [];
  private readonly demoUserId = 1;

  constructor(private readonly marketplaceApi: MarketplaceApiService) {}

  ngOnInit(): void {
    this.marketplaceApi.getOrdersByUser(this.demoUserId).subscribe({
      next: (orders) => {
        const revenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
        this.stats = [
          { label: 'Orders', value: orders.length, hint: 'Total marketplace orders', trend: 'up' },
          { label: 'Revenue', value: revenue.toFixed(2), hint: 'Aggregated order value', trend: 'up' },
        ];

        this.activity = orders.slice(0, 5).map((order) => ({
          title: `Order #${order.idCommande}`,
          description: `Total ${order.total}`,
          timestampIso: order.updatedAt || order.dateCreation || new Date().toISOString(),
          status: order.statut,
        }));
      },
      error: () => {
        this.stats = [
          { label: 'Orders', value: 0, hint: 'Unable to load data', trend: 'flat' },
          { label: 'Revenue', value: 0, hint: 'Unable to load data', trend: 'flat' },
        ];
      },
    });
  }
}

