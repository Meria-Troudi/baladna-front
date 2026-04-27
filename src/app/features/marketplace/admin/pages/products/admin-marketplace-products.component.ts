import { Component, OnInit } from '@angular/core';
import { MarketplaceProduct, MarketplaceProductUpsertRequest } from '../../../models/marketplace.models';
import { MarketplaceApiService } from '../../../services/marketplace-api.service';

@Component({
  selector: 'app-admin-marketplace-products',
  templateUrl: './admin-marketplace-products.component.html',
  styleUrls: ['./admin-marketplace-products.component.css'],
})
export class AdminMarketplaceProductsComponent implements OnInit {
  products: MarketplaceProduct[] = [];
  statuses: Record<number, 'APPROVED' | 'REJECTED' | 'PENDING'> = {};
  feedback = '';

  constructor(private readonly marketplaceApi: MarketplaceApiService) {}

  ngOnInit(): void {
    this.marketplaceApi.getAllProducts().subscribe({
      next: (products) => {
        this.products = products;
        products.forEach((p) => {
          this.statuses[p.idProduit] = p.stockProduit === 0 ? 'PENDING' : 'APPROVED';
        });
      },
      error: () => (this.products = []),
    });
  }

  setStatus(idProduit: number, status: 'APPROVED' | 'REJECTED'): void {
    const product = this.products.find((item) => item.idProduit === idProduit);
    if (!product) {
      return;
    }
    const payload: MarketplaceProductUpsertRequest = {
      nomProduit: product.nomProduit,
      descriptionProduit: product.descriptionProduit ?? '',
      imageProduit: product.imageProduit ?? '',
      prixProduit: Number(product.prixProduit),
      stockProduit: status === 'REJECTED' ? 0 : Math.max(1, Number(product.stockProduit)),
      idCategorie: product.idCategorie ?? null,
      idArtisan: Number(product.idArtisan ?? 1),
    };
    
    // ✅ CORRIGÉ : Ajout de artisanId = 0 pour l'admin
    this.marketplaceApi.updateProduct(idProduit, payload, 0).subscribe({
      next: (updatedProduct) => {
        this.statuses[idProduit] = status;
        this.products = this.products.map((p) => (p.idProduit === idProduit ? updatedProduct : p));
        this.feedback = `Product #${idProduit} marked as ${status}.`;
      },
      error: () => (this.feedback = `Failed to update status for product #${idProduit}.`),
    });
  }

  // ✅ CORRIGÉ : Ajout de artisanId = 0 pour l'admin
  removeProduct(idProduit: number): void {
    this.marketplaceApi.deleteProduct(idProduit, 0).subscribe({
      next: () => {
        this.products = this.products.filter((p) => p.idProduit !== idProduit);
        this.feedback = `Product #${idProduit} deleted.`;
      },
      error: () => (this.feedback = `Failed to delete product #${idProduit}.`),
    });
  }
}