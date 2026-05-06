import { Component, OnInit } from '@angular/core';
import { MarketplaceOrder, MarketplaceOrderStatus } from '../../../marketplace/models/marketplace.models';
import { MarketplaceApiService } from '../../../marketplace/services/marketplace-api.service';
import { UserService } from '../../../user/user.service';

@Component({
  selector: 'app-artisan-orders',
  templateUrl: './artisan-orders.component.html',
  styleUrls: ['./artisan-orders.component.css']
})
export class ArtisanOrdersComponent implements OnInit {
  orders: MarketplaceOrder[] = [];
  loading = false;
  error: string = '';
  artisanId: number | null = null;
  currentPage = 1;
  itemsPerPage = 10;

  constructor(
    private readonly marketplaceApi: MarketplaceApiService,
    private readonly userService: UserService
  ) {}

  ngOnInit(): void {
    this.userService.getMyProfile().subscribe({
      next: (user: any) => {
        this.artisanId = Number(user.id || user.idUtilisateur || null);
        this.loadOrders();
      },
      error: () => (this.error = 'Unable to load artisan profile.')
    });
  }

  loadOrders(): void {
    if (!this.artisanId) return;
    this.loading = true;
    this.error = '';
    this.marketplaceApi.getOrdersByArtisan(this.artisanId).subscribe({
      next: (orders) => {
        this.orders = orders;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Unable to load orders.';
        this.loading = false;
      }
    });
  }

  get pendingCount(): number {
    return this.orders.filter(o => o.statut === 'PENDING').length;
  }
  get confirmedCount(): number {
    return this.orders.filter(o => o.statut === 'CONFIRMED').length;
  }
  get shippedCount(): number {
    return this.orders.filter(o => o.statut === 'SHIPPED').length;
  }
  get deliveredCount(): number {
    return this.orders.filter(o => o.statut === 'DELIVERED').length;
  }

  get totalPages(): number {
    return Math.ceil(this.orders.length / this.itemsPerPage);
  }

  get paginatedOrders(): MarketplaceOrder[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.orders.slice(start, start + this.itemsPerPage);
  }

  previousPage(): void {
    if (this.currentPage > 1) this.currentPage--;
  }
  nextPage(): void {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }
  changePage(page: number): void {
    this.currentPage = page;
  }
  getPaginationPages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  min(a: number, b: number): number {
    return Math.min(a, b);
  }

  viewOrder(order: MarketplaceOrder): void {
    // Implement order detail view logic here
    alert('Order details: ' + JSON.stringify(order));
  }

  messageCustomer(order: MarketplaceOrder): void {
    // Implement messaging logic here
    alert('Message customer for order #' + order.idCommande);
  }

  updateStatus(order: MarketplaceOrder): void {
    // Implement status update logic here
    alert('Update status for order #' + order.idCommande);
  }
}
