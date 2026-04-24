import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface MarketplaceStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
  avgRating: number;
}

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: string;
  sellerName: string;
  rating: number;
}

@Component({
  selector: 'app-marketplace-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './marketplace-dashboard.component.html',
  styleUrls: ['./marketplace-dashboard.component.css']
})
export class MarketplaceDashboardComponent implements OnInit {
  stats: MarketplaceStats = {
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    completedOrders: 0,
    avgRating: 0
  };
  
  products: Product[] = [];
  filteredProducts: Product[] = [];
  loading = false;
  
  searchTerm = '';
  categoryFilter = '';
  statusFilter = '';
  
  currentPage = 1;
  pageSize = 8;
  totalPages = 1;

  ngOnInit(): void {
    this.loadMockData();
  }

  loadMockData(): void {
    this.loading = true;
    
    this.stats = {
      totalProducts: 342,
      totalOrders: 567,
      totalRevenue: 89250,
      pendingOrders: 45,
      completedOrders: 522,
      avgRating: 4.3
    };

    this.products = [
      { id: 1, name: 'Tapis Beni Ourain Authentique', category: 'artisanat', price: 1200, stock: 8, status: 'ACTIVE', sellerName: 'Ahmed Bennani', rating: 4.9 },
      { id: 2, name: 'Poterie de Fès - Service à Thé', category: 'artisanat', price: 450, stock: 15, status: 'ACTIVE', sellerName: 'Karim Tazi', rating: 4.7 },
      { id: 3, name: 'Huile d\'Argan Bio 500ml', category: 'produits-locaux', price: 180, stock: 50, status: 'ACTIVE', sellerName: 'Fatima Zahra', rating: 4.8 },
      { id: 4, name: 'Savon Noir Traditionnel x12', category: 'produits-locaux', price: 95, stock: 120, status: 'LOW_STOCK', sellerName: 'Nadia Chraibi', rating: 4.5 },
      { id: 5, name: 'Djellaba Brodée Homme', category: 'vetements', price: 680, stock: 0, status: 'OUT_OF_STOCK', sellerName: 'Youssef Amrani', rating: 4.6 },
      { id: 6, name: 'Babouches en Cuir Artisanal', category: 'chaussures', price: 250, stock: 25, status: 'ACTIVE', sellerName: 'Omar Berrada', rating: 4.4 },
      { id: 7, name: 'Coffret Epices du Maroc', category: 'gastronomie', price: 150, stock: 45, status: 'ACTIVE', sellerName: 'Lina Alaoui', rating: 4.8 },
      { id: 8, name: 'Lanterne Marocaine en Métal', category: 'decoration', price: 320, stock: 12, status: 'ACTIVE', sellerName: 'Sara Idrissi', rating: 4.6 },
      { id: 9, name: 'Caftan de Soie Brodé', category: 'vetements', price: 2500, stock: 3, status: 'ACTIVE', sellerName: 'Imane Fassi', rating: 4.9 },
      { id: 10, name: 'Thé du Maghreb Bio x20', category: 'gastronomie', price: 65, stock: 200, status: 'ACTIVE', sellerName: 'Hamza Kettani', rating: 4.3 },
    ];
    
    this.filteredProducts = [...this.products];
    this.applyFilters();
    this.loading = false;
  }

  applyFilters(): void {
    let result = [...this.products];

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(term) ||
        p.sellerName.toLowerCase().includes(term)
      );
    }

    if (this.categoryFilter) {
      result = result.filter(p => p.category === this.categoryFilter);
    }

    if (this.statusFilter) {
      result = result.filter(p => p.status === this.statusFilter);
    }

    this.filteredProducts = result;
    this.totalPages = Math.ceil(this.filteredProducts.length / this.pageSize) || 1;
    if (this.currentPage > this.totalPages) this.currentPage = 1;
  }

  get paginatedProducts(): Product[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredProducts.slice(start, start + this.pageSize);
  }

  get paginationRange(): number[] {
    const range: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);
    for (let i = start; i <= end; i++) range.push(i);
    return range;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) this.currentPage = page;
  }

  search(): void { this.currentPage = 1; this.applyFilters(); }
  filterByCategory(): void { this.currentPage = 1; this.applyFilters(); }
  filterByStatus(): void { this.currentPage = 1; this.applyFilters(); }
  
  resetFilters(): void {
    this.searchTerm = '';
    this.categoryFilter = '';
    this.statusFilter = '';
    this.currentPage = 1;
    this.applyFilters();
  }

  getStatusBadgeClass(status: string): string {
    const map: { [key: string]: string } = {
      'ACTIVE': 'active',
      'LOW_STOCK': 'low-stock',
      'OUT_OF_STOCK': 'out-of-stock'
    };
    return map[status] || '';
  }
}
