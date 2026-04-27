import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MarketplaceSharedModule } from '../shared/marketplace-shared.module';
import { ArtisanMarketplaceRoutingModule } from './artisan-marketplace-routing.module';
import { ArtisanMarketplaceDashboardComponent } from './pages/dashboard/artisan-marketplace-dashboard.component';
import { ArtisanMarketplaceProductsComponent } from './pages/products/artisan-marketplace-products.component';
import { ArtisanMarketplaceOrdersComponent } from './pages/orders/artisan-marketplace-orders.component';

@NgModule({
  declarations: [
    ArtisanMarketplaceDashboardComponent,
    ArtisanMarketplaceProductsComponent,
    ArtisanMarketplaceOrdersComponent,
  ],
  imports: [
    CommonModule,           // ← AJOUTER
    ReactiveFormsModule,    // ← AJOUTER
    MarketplaceSharedModule,
    ArtisanMarketplaceRoutingModule
  ],
})
export class ArtisanMarketplaceModule {}