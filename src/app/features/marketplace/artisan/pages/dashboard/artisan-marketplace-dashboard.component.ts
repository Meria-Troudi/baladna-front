import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import {
  MarketplaceActivityItem,
  MarketplaceDashboardStat,
  MarketplaceOrder,
} from '../../../models/marketplace.models';
import { MarketplaceApiService } from '../../../services/marketplace-api.service';
import { UserService } from '../../../../user/user.service';

@Component({
  selector: 'app-artisan-marketplace-dashboard',
  templateUrl: './artisan-marketplace-dashboard.component.html',
  styleUrls: ['./artisan-marketplace-dashboard.component.css'],
})
export class ArtisanMarketplaceDashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('ordersChart') ordersChartRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('categoryChart') categoryChartRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('stockChart') stockChartRef?: ElementRef<HTMLCanvasElement>;
  stats: MarketplaceDashboardStat[] = [];
  activity: MarketplaceActivityItem[] = [];
  private artisanId: number | null = null;
  private ordersLineChart?: Chart;
  private categoryPieChart?: Chart;
  private stockBarChart?: Chart;
  private chartData = {
    orderLabels: [] as string[],
    orderValues: [] as number[],
    categoryLabels: [] as string[],
    categoryValues: [] as number[],
    stockLabels: [] as string[],
    stockValues: [] as number[],
  };
  private viewReady = false;

  constructor(
    private readonly marketplaceApi: MarketplaceApiService,
    private readonly userService: UserService
  ) {
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    this.userService
      .getMyNumericUserId()
      .pipe(
        switchMap((artisanId) => {
          this.artisanId = artisanId;
          if (artisanId == null) {
            return forkJoin({
              products: this.marketplaceApi.getAllProducts().pipe(catchError(() => of([]))),
              orders: of<MarketplaceOrder[]>([]),
            });
          }
          return forkJoin({
            products: this.marketplaceApi.getAllProducts().pipe(catchError(() => of([]))),
            orders: this.marketplaceApi.getOrdersByArtisan(artisanId).pipe(catchError(() => of([]))),
          });
        })
      )
      .subscribe({
      next: ({ products, orders }) => {
        const aid = this.artisanId;
        const artisanProducts =
          aid == null ? [] : products.filter((item) => (item.idArtisan ?? aid) === aid);
        const totalStock = artisanProducts.reduce((sum, p) => sum + (p.stockProduit || 0), 0);
        const revenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);

        this.stats = [
          { label: 'Total products', value: artisanProducts.length, hint: 'Published products', trend: 'up' },
          { label: 'Total stock', value: totalStock, hint: 'Available units', trend: 'flat' },
          { label: 'Orders count', value: orders.length, hint: 'Your product lines', trend: 'up' },
          { label: 'Revenue', value: revenue.toFixed(2), hint: 'From your items in orders', trend: 'up' },
        ];

        this.activity = orders.slice(0, 5).map((order) => ({
          title: `Order #${order.idCommande}`,
          description: `Total ${order.total}`,
          timestampIso: order.updatedAt || order.dateCreation || new Date().toISOString(),
          status: order.statut,
        }));
        const orderLabels = orders.slice(0, 6).map((order) => `#${order.idCommande}`);
        const orderValues = orders.slice(0, 6).map((order) => Number(order.total || 0));
        const categoryCount = new Map<number, number>();
        artisanProducts.forEach((product) => {
          const id = Number(product.idCategorie || 0);
          categoryCount.set(id, (categoryCount.get(id) || 0) + 1);
        });
        const categoryLabels = Array.from(categoryCount.keys()).map((id) => `Category ${id || '-'}`);
        const categoryValues = Array.from(categoryCount.values());
        const stockLabels = artisanProducts.slice(0, 8).map((product) => product.nomProduit);
        const stockValues = artisanProducts.slice(0, 8).map((product) => Number(product.stockProduit || 0));

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

  private renderCharts(): void {
    const lineCanvas = this.ordersChartRef?.nativeElement;
    const pieCanvas = this.categoryChartRef?.nativeElement;
    const barCanvas = this.stockChartRef?.nativeElement;
    if (!lineCanvas || !pieCanvas || !barCanvas) {
      return;
    }
    this.ordersLineChart?.destroy();
    this.categoryPieChart?.destroy();
    this.stockBarChart?.destroy();

    this.ordersLineChart = new Chart(lineCanvas, {
      type: 'line',
      data: {
        labels: this.chartData.orderLabels,
        datasets: [
          {
            data: this.chartData.orderValues,
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37,99,235,0.15)',
            fill: true,
            tension: 0.35,
          },
        ],
      },
      options: { plugins: { legend: { display: false } }, responsive: true },
    });

    this.categoryPieChart = new Chart(pieCanvas, {
      type: 'pie',
      data: {
        labels: this.chartData.categoryLabels,
        datasets: [
          {
            data: this.chartData.categoryValues,
            backgroundColor: ['#2563eb', '#f97316', '#14b8a6', '#a855f7', '#e11d48'],
          },
        ],
      },
      options: { responsive: true },
    });

    this.stockBarChart = new Chart(barCanvas, {
      type: 'bar',
      data: {
        labels: this.chartData.stockLabels,
        datasets: [
          {
            data: this.chartData.stockValues,
            backgroundColor: '#0ea5e9',
            borderRadius: 8,
          },
        ],
      },
      options: { plugins: { legend: { display: false } }, responsive: true },
    });
  }
}

