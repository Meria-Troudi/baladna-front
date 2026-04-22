import { Component, OnInit, OnDestroy, Input, SimpleChanges, OnChanges } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TableColumn, TableAction, TableFilter } from '../../pages/dynamic-table/dynamic-table.component';

@Component({
  selector: 'app-reviews-management',
  templateUrl: './reviews-management.component.html',
  styleUrls: ['./reviews-management.component.css']
})
export class ReviewsManagementComponent implements OnInit {

  @Input() reviews: any[] = [];
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
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Auto updates when parent passes new reviews data
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
      { label: 'Reply', icon: '💬', class: 'btn-action btn-primary', action: (row) => this.replyToReview(row) },
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

  replyToReview(review: any) {
    const reply = prompt('Enter your reply:');
    if (reply) {
      // TODO: Send reply to backend
      alert('Reply sent successfully');
    }
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