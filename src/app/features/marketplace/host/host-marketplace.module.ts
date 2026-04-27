import { NgModule } from '@angular/core';
import { MarketplaceSharedModule } from '../shared/marketplace-shared.module';
import { HostMarketplaceRoutingModule } from './host-marketplace-routing.module';
import { HostMarketplaceDashboardComponent } from './pages/dashboard/host-marketplace-dashboard.component';
import { HostMarketplaceListingsComponent } from './pages/listings/host-marketplace-listings.component';
import { HostMarketplaceOrdersComponent } from './pages/orders/host-marketplace-orders.component';

@NgModule({
  declarations: [HostMarketplaceDashboardComponent, HostMarketplaceListingsComponent, HostMarketplaceOrdersComponent],
  imports: [MarketplaceSharedModule, HostMarketplaceRoutingModule],
})
export class HostMarketplaceModule {}

