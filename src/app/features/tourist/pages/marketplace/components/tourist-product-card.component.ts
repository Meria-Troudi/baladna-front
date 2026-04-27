import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MarketplaceCategory, MarketplaceProduct } from '../../../../marketplace/models/marketplace.models';

@Component({
  selector: 'app-tourist-product-card',
  templateUrl: './tourist-product-card.component.html',
  styleUrls: ['./tourist-product-card.component.css'],
})
export class TouristProductCardComponent {
  @Input() product!: MarketplaceProduct;
  @Input() categories: MarketplaceCategory[] = [];
  @Output() add = new EventEmitter<MarketplaceProduct>();

  onAdd(): void {
    this.add.emit(this.product);
  }

  get categoryLabel(): string {
    return this.categories.find((cat) => cat.idCategorie === this.product.idCategorie)?.nomCategorie || 'General';
  }

  get availabilityLabel(): string {
    if (this.product.stockProduit <= 0) {
      return 'Out of stock';
    }
    if (this.product.stockProduit < 5) {
      return 'Low stock';
    }
    return 'In stock';
  }
}
