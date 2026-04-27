import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HostMarketplaceDashboardComponent } from './pages/dashboard/host-marketplace-dashboard.component';
import { HostMarketplaceListingsComponent } from './pages/listings/host-marketplace-listings.component';
import { HostMarketplaceOrdersComponent } from './pages/orders/host-marketplace-orders.component';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: HostMarketplaceDashboardComponent },
  { path: 'listings', component: HostMarketplaceListingsComponent },
  { path: 'orders', component: HostMarketplaceOrdersComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HostMarketplaceRoutingModule {}

