import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, SimpleChanges, OnChanges } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TableColumn, TableAction, TableFilter } from '../../pages/dynamic-table/dynamic-table.component';

@Component({
  selector: 'app-reviews-management',
  templateUrl: './reviews-management.component.html',
  styleUrls: ['./reviews-management.component.css']
})
export class ReviewsManagementComponent implements OnInit {

  getTotalReviews(): number {
    return this.reviews.length;
  }

  getAverageRating(): number {
    if (!this.reviews.length) return 0;
    return this.reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / this.reviews.length;
  }

  getPositivePercentage(): number {
    if (!this.reviews.length) return 0;
    const positive = this.reviews.filter(r => r.rating >= 4 && r.rating <= 5).length;
    return (positive / this.reviews.length) * 100;
  }

  getNeutralPercentage(): number {
    if (!this.reviews.length) return 0;
    const neutral = this.reviews.filter(r => r.rating === 3).length;
    return (neutral / this.reviews.length) * 100;
  }

  getNegativePercentage(): number {
    if (!this.reviews.length) return 0;
    const negative = this.reviews.filter(r => r.rating >= 1 && r.rating <= 2).length;
    return (negative / this.reviews.length) * 100;
  }

  getReviewCoverage(events: any[]): number {
    if (!this.reviews.length || !events?.length) return 0;
    const reviewedEvents = new Set(this.reviews.map(r => r.event?.id)).size;
    return (reviewedEvents / events.length) * 100;
  }

  @Input() reviews: any[] = [];
  @Output() openReviewDrawer = new EventEmitter<any>();
  loading: boolean = false;

  // Missing properties referenced in template
  keyword: string = '';
  selectedStatus: string = '';

  // Filtered data
  filteredReviews: any[] = [];

  reviewsColumns: TableColumn[] = [];
  reviewsActions: TableAction[] = [];
  reviewsFilters: TableFilter[] = [];

  private destroy$ = new Subject<void>();

  constructor() {}

ngOnInit(): void {
    this.initializeTableConfigs();
    this.applyFilters();
  }

ngOnChanges(changes: SimpleChanges): void {
    if (changes['reviews']) {
      this.applyFilters();
    }
  }

  initializeTableConfigs(): void {
    // Reviews table config
    this.reviewsColumns = [
      { header: 'ID', key: 'id', width: '80px', sortable: true },
      { header: 'Event', key: 'event', width: '150px', sortable: true, cellRenderer: (value) => value?.title || 'N/A' },
      { header: 'User', key: 'user', width: '120px', sortable: true, cellRenderer: (value) => value?.name || 'N/A' },
      { header: 'Rating', key: 'rating', width: '80px', sortable: true, cellRenderer: (value) => '⭐'.repeat(value || 0) },
      { header: 'Comment', key: 'comment', width: '250px', sortable: true },
      { header: 'Created', key: 'createdAt', width: '120px', sortable: true, cellRenderer: (value) => value ? new Date(value).toLocaleDateString() : '' }
    ];

this.reviewsActions = [
      { label: 'View Detail', icon: '👁️', class: 'btn-action btn-view', action: (row) => this.viewReviewDetail(row) },
      { label: 'Delete', icon: '🗑️', class: 'btn-action btn-danger', action: (row) => this.deleteReview(row) }
    ];

    this.reviewsFilters = [
      { key: 'rating', placeholder: 'Rating', type: 'select', options: [
        { value: '5', label: '5 Stars' },
        { value: '4', label: '4 Stars' },
        { value: '3', label: '3 Stars' },
        { value: '2', label: '2 Stars' },
        { value: '1', label: '1 Star' }
      ]}
    ];
  }

  // Helper methods referenced in template
  search(): void {
    this.applyFilters();
  }

  resetFilters(): void {
    this.keyword = '';
    this.selectedStatus = '';
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredReviews = [...this.reviews];

    if (this.keyword) {
      const term = this.keyword.toLowerCase().trim();
      this.filteredReviews = this.filteredReviews.filter(r =>
        r.comment?.toLowerCase().includes(term) ||
        r.user?.name?.toLowerCase().includes(term) ||
        r.event?.title?.toLowerCase().includes(term)
      );
    }
  }

viewedReview: any = null;

  viewReviewDetail(review: any) {
    this.openReviewDrawer.emit(review);
  }

closeReviewDetail() {
  this.viewedReview = null;
}

  deleteReview(review: any) {
    if (confirm('Are you sure you want to delete this review?')) {
      // TODO: Call backend to delete review
      this.reviews = this.reviews.filter(r => r.id !== review.id);
      alert('Review deleted successfully');
    }
  }

  onTableActionClick(event: { action: TableAction; row: any }) {
    event.action.action(event.row);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}