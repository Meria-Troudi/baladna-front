import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MarketplaceActivityItem, MarketplaceDashboardStat } from '../../../models/marketplace.models';
import { MarketplaceApiService } from '../../../services/marketplace-api.service';

@Component({
  selector: 'app-admin-marketplace-dashboard',
  templateUrl: './admin-marketplace-dashboard.component.html',
  styleUrls: ['./admin-marketplace-dashboard.component.css'],
})
export class AdminMarketplaceDashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('ordersChart') ordersChartRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('categoryChart') categoryChartRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('stockChart') stockChartRef?: ElementRef<HTMLCanvasElement>;

  stats: MarketplaceDashboardStat[] = [];
  activity: MarketplaceActivityItem[] = [];
  filteredActivity: MarketplaceActivityItem[] = [];
  paginatedActivity: MarketplaceActivityItem[] = [];
  
  // Filters
  searchOrderId: string = '';
  selectedDate: string = '';
  
  // Pagination
  currentPage: number = 1;
  pageSize: number = 5;
  totalPages: number = 1;
  
  private ordersChart?: Chart;
  private categoryChart?: Chart;
  private stockChart?: Chart;
  private viewReady = false;

  private chartData = {
    orderLabels: [] as string[],
    orderValues: [] as number[],
    categoryLabels: [] as string[],
    categoryValues: [] as number[],
    stockLabels: [] as string[],
    stockValues: [] as number[],
  };

  constructor(private readonly marketplaceApi: MarketplaceApiService) {
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    forkJoin({
      products: this.marketplaceApi.getAllProducts().pipe(catchError(() => of([]))),
      categories: this.marketplaceApi.getAllCategories().pipe(catchError(() => of([]))),
      orders: this.marketplaceApi.getAllOrders().pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({ products, categories, orders }) => {
        const totalProducts = products.length;
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
        const totalStock = products.reduce((sum, p) => sum + (p.stockProduit || 0), 0);

        this.stats = [
          { label: 'Total Products', value: totalProducts, hint: 'Marketplace catalog', trend: 'up', icon: '📦' },
          { label: 'Total Orders', value: totalOrders, hint: 'Orders in system', trend: 'up', icon: '📋' },
          { label: 'Total Stock', value: totalStock, hint: 'Available units', trend: 'up', icon: '📊' },
          { label: 'Total Revenue', value: totalRevenue.toFixed(2), hint: 'Generated revenue', trend: 'up', icon: '💰' },
        ];

        // Activity - All orders
        this.activity = orders.map((order) => ({
          title: `Order #${order.idCommande}`,
          description: `${order.total}`,
          timestampIso: order.updatedAt || order.dateCreation || new Date().toISOString(),
          status: order.statut || 'PENDING',
        }));
        
        // Initialize
        this.filteredActivity = [...this.activity];
        this.applyFilters();
        
        // Charts data
        const orderLabels = orders.slice(0, 6).map((order) => `#${order.idCommande}`);
        const orderValues = orders.slice(0, 6).map((order) => Number(order.total || 0));

        const categoryMap = new Map<string, number>();
        products.forEach(product => {
          const catId = product.idCategorie || 0;
          const catName = categories.find(c => c.idCategorie === catId)?.nomCategorie || 'Autre';
          categoryMap.set(catName, (categoryMap.get(catName) || 0) + 1);
        });
        const categoryLabels = Array.from(categoryMap.keys());
        const categoryValues = Array.from(categoryMap.values());

        const stockLabels = products.slice(0, 8).map(p => p.nomProduit.length > 12 ? p.nomProduit.substring(0, 10) + '...' : p.nomProduit);
        const stockValues = products.slice(0, 8).map(p => p.stockProduit || 0);

        this.chartData = { orderLabels, orderValues, categoryLabels, categoryValues, stockLabels, stockValues };
        
        if (this.viewReady) {
          this.renderCharts();
        }
      },
    });
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.renderCharts();
  }

  // ========== FILTER METHODS ==========
  
  applyFilters(): void {
    let filtered = [...this.activity];
    
    // Filter by order number
    if (this.searchOrderId) {
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(this.searchOrderId.toLowerCase())
      );
    }
    
    // Filter by date (exact match)
    if (this.selectedDate) {
      const filterDate = new Date(this.selectedDate);
      filterDate.setHours(0, 0, 0, 0);
      
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.timestampIso);
        itemDate.setHours(0, 0, 0, 0);
        return itemDate.getTime() === filterDate.getTime();
      });
    }
    
    this.filteredActivity = filtered;
    this.currentPage = 1;
    this.updatePagination();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onDateChange(): void {
    this.applyFilters();
  }

  clearSearch(): void {
    this.searchOrderId = '';
    this.applyFilters();
  }

  clearDateFilter(): void {
    this.selectedDate = '';
    this.applyFilters();
  }

  clearAllFilters(): void {
    this.searchOrderId = '';
    this.selectedDate = '';
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    return this.searchOrderId !== '' || this.selectedDate !== '';
  }

  // ========== PAGINATION METHODS ==========
  
  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredActivity.length / this.pageSize);
    if (this.totalPages === 0) this.totalPages = 1;
    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
    
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedActivity = this.filteredActivity.slice(start, end);
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.updatePagination();
  }

  getCurrentPageEnd(): number {
    const end = this.currentPage * this.pageSize;
    return end > this.filteredActivity.length ? this.filteredActivity.length : end;
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  viewAllActivity(): void {
    console.log('View all activity clicked');
  }

  getStatusClass(status: string | undefined): string {
    const s = (status || 'PENDING').toUpperCase();
    if (s === 'CONFIRMED' || s === 'DELIVERED') return 'status-confirmed';
    if (s === 'SHIPPED') return 'status-shipped';
    if (s === 'PENDING') return 'status-pending';
    if (s === 'CANCELLED') return 'status-cancelled';
    return 'status-default';
  }

  private renderCharts(): void {
    this.renderOrdersChart();
    this.renderCategoryChart();
    this.renderStockChart();
  }

  private renderOrdersChart(): void {
    const canvas = this.ordersChartRef?.nativeElement;
    if (!canvas) return;
    if (this.ordersChart) this.ordersChart.destroy();

    this.ordersChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: this.chartData.orderLabels,
        datasets: [{
          data: this.chartData.orderValues,
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.1)',
          fill: true,
          tension: 0.35,
        }]
      },
      options: { plugins: { legend: { display: false } }, responsive: true }
    });
  }

  private renderCategoryChart(): void {
    const canvas = this.categoryChartRef?.nativeElement;
    if (!canvas) return;
    if (this.categoryChart) this.categoryChart.destroy();

    this.categoryChart = new Chart(canvas, {
      type: 'pie',
      data: {
        labels: this.chartData.categoryLabels,
        datasets: [{
          data: this.chartData.categoryValues,
          backgroundColor: ['#2563eb', '#f97316', '#14b8a6', '#a855f7', '#e11d48', '#06b6d4', '#84cc16', '#f59e0b'],
        }]
      },
      options: { responsive: true, plugins: { legend: { position: 'right' } } }
    });
  }

  private renderStockChart(): void {
    const canvas = this.stockChartRef?.nativeElement;
    if (!canvas) return;
    if (this.stockChart) this.stockChart.destroy();

    this.stockChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: this.chartData.stockLabels,
        datasets: [{
          data: this.chartData.stockValues,
          backgroundColor: '#0ea5e9',
          borderRadius: 8,
        }]
      },
      options: { plugins: { legend: { display: false } }, responsive: true }
    });
  }
}