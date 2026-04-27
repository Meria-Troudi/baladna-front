import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ArtisanMarketplaceDashboardComponent } from './pages/dashboard/artisan-marketplace-dashboard.component';
import { ArtisanMarketplaceProductsComponent } from './pages/products/artisan-marketplace-products.component';
import { ArtisanMarketplaceOrdersComponent } from './pages/orders/artisan-marketplace-orders.component';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: ArtisanMarketplaceDashboardComponent },
  { path: 'products', component: ArtisanMarketplaceProductsComponent },
  { path: 'orders', component: ArtisanMarketplaceOrdersComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ArtisanMarketplaceRoutingModule {}

