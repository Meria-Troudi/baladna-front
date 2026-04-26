import { NgModule } from '@angular/core';
import { MarketplaceSharedModule } from '../shared/marketplace-shared.module';
import { AdminMarketplaceRoutingModule } from './admin-marketplace-routing.module';
import { AdminMarketplaceDashboardComponent } from './pages/dashboard/admin-marketplace-dashboard.component';
import { AdminMarketplaceProductsComponent } from './pages/products/admin-marketplace-products.component';
import { AdminMarketplaceCategoriesComponent } from './pages/categories/admin-marketplace-categories.component';
import { AdminMarketplaceOrdersComponent } from './pages/orders/admin-marketplace-orders.component';

@NgModule({
  declarations: [
    AdminMarketplaceDashboardComponent,
    AdminMarketplaceProductsComponent,
    AdminMarketplaceCategoriesComponent,
    AdminMarketplaceOrdersComponent,
  ],
  imports: [MarketplaceSharedModule, AdminMarketplaceRoutingModule],
})
export class AdminMarketplaceModule {}

