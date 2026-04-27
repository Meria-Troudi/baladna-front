import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-marketplace-stat-card',
  templateUrl: './marketplace-stat-card.component.html',
  styleUrls: ['./marketplace-stat-card.component.css'],
})
export class MarketplaceStatCardComponent {
  @Input() label = '';
  @Input() value: string | number = 0;
  @Input() hint = '';
  @Input() trend: 'up' | 'down' | 'flat' = 'flat';
}

