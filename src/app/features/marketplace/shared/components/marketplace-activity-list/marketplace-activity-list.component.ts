import { Component, Input } from '@angular/core';
import { MarketplaceActivityItem } from '../../../models/marketplace.models';

@Component({
  selector: 'app-marketplace-activity-list',
  templateUrl: './marketplace-activity-list.component.html',
  styleUrls: ['./marketplace-activity-list.component.css'],
})
export class MarketplaceActivityListComponent {
  @Input() items: MarketplaceActivityItem[] = [];
}

