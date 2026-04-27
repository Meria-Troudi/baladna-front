import { Component, OnInit } from '@angular/core';
import { MarketplaceCategory } from '../../../models/marketplace.models';
import { MarketplaceApiService } from '../../../services/marketplace-api.service';

@Component({
  selector: 'app-admin-marketplace-categories',
  templateUrl: './admin-marketplace-categories.component.html',
  styleUrls: ['./admin-marketplace-categories.component.css'],
})
export class AdminMarketplaceCategoriesComponent implements OnInit {
  categories: MarketplaceCategory[] = [];
  newCategory = '';
  feedback = '';

  constructor(private readonly marketplaceApi: MarketplaceApiService) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  addCategory(): void {
    if (!this.newCategory.trim()) {
      return;
    }
    this.marketplaceApi.createCategory(this.newCategory.trim()).subscribe({
      next: () => {
        this.feedback = 'Category created.';
        this.newCategory = '';
        this.loadCategories();
      },
      error: () => (this.feedback = 'Unable to create category.'),
    });
  }

  private loadCategories(): void {
    this.marketplaceApi.getAllCategories().subscribe({
      next: (categories) => (this.categories = categories),
      error: () => (this.categories = []),
    });
  }
}

