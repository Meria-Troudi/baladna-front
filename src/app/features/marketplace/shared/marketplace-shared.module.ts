import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MarketplaceStatCardComponent } from './components/marketplace-stat-card/marketplace-stat-card.component';
import { MarketplaceActivityListComponent } from './components/marketplace-activity-list/marketplace-activity-list.component';
import { MarketplaceStatusLabelPipe } from './pipes/marketplace-status-label.pipe';

@NgModule({
  declarations: [
    MarketplaceStatCardComponent,
    MarketplaceActivityListComponent,
    MarketplaceStatusLabelPipe,
  ],
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MarketplaceStatCardComponent,
    MarketplaceActivityListComponent,
    MarketplaceStatusLabelPipe,
  ],
})
export class MarketplaceSharedModule {}

