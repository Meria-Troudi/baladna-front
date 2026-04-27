import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminMarketplaceDashboardComponent } from './pages/dashboard/admin-marketplace-dashboard.component';
import { AdminMarketplaceProductsComponent } from './pages/products/admin-marketplace-products.component';
import { AdminMarketplaceCategoriesComponent } from './pages/categories/admin-marketplace-categories.component';
import { AdminMarketplaceOrdersComponent } from './pages/orders/admin-marketplace-orders.component';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: AdminMarketplaceDashboardComponent },
  { path: 'products', component: AdminMarketplaceProductsComponent },
  { path: 'categories', component: AdminMarketplaceCategoriesComponent },
  { path: 'orders', component: AdminMarketplaceOrdersComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminMarketplaceRoutingModule {}

