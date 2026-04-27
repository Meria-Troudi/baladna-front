import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MarketplaceCartItem } from '../../../../marketplace/models/marketplace.models';

@Component({
  selector: 'app-tourist-cart-item',
  templateUrl: './tourist-cart-item.component.html',
  styleUrls: ['./tourist-cart-item.component.css'],
})
export class TouristCartItemComponent {
  @Input() item!: MarketplaceCartItem;
  @Output() remove = new EventEmitter<number>();
  @Output() quantity = new EventEmitter<{ idProduit: number; quantite: number }>();

  changeQuantity(next: number): void {
    if (next < 1) {
      return;
    }
    this.quantity.emit({ idProduit: this.item.idProduit, quantite: next });
  }
}
