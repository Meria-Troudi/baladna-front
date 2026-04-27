import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarketplaceSharedModule } from './shared/marketplace-shared.module';
import { ArtisanMarketplaceRoutingModule } from './artisan/artisan-marketplace-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
@NgModule({
  imports: [CommonModule, MarketplaceSharedModule, ArtisanMarketplaceRoutingModule, FormsModule, ReactiveFormsModule],
  exports: [MarketplaceSharedModule, FormsModule, ReactiveFormsModule],
})
export class MarketplaceModule {}

