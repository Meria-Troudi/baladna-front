import { Component, OnInit } from '@angular/core';
import { MarketplaceProduct } from '../../../models/marketplace.models';
import { MarketplaceApiService } from '../../../services/marketplace-api.service';

@Component({
  selector: 'app-host-marketplace-listings',
  templateUrl: './host-marketplace-listings.component.html',
  styleUrls: ['./host-marketplace-listings.component.css'],
})
export class HostMarketplaceListingsComponent implements OnInit {
  listings: MarketplaceProduct[] = [];

  constructor(private readonly marketplaceApi: MarketplaceApiService) {}

  ngOnInit(): void {
    this.marketplaceApi.getAllProducts().subscribe({
      next: (products) => (this.listings = products),
      error: () => (this.listings = []),
    });
  }
}

