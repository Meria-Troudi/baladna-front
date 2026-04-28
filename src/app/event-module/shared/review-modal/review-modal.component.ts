import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StarRatingComponent } from '../star-rating/star-rating.component';
import { ReviewService } from '../../services/review.service';
import { CreateReviewPayload, EventReview, UpdateReviewPayload } from '../../models/event-review.model';

@Component({
  selector: 'app-review-modal',
  templateUrl: './review-modal.component.html',
  styleUrls: ['./review-modal.component.css']
})
export class ReviewModalComponent implements OnInit {
  @Input() userId!: number;
  @Input() eventId!: number;
  @Input() reservationId!: number | null;
  @Input() existingReview: EventReview | null = null;
  @Input() isOpen: boolean = false;
  @Output() closed = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<EventReview>();

  rating: number = 0;
  comment: string = '';
  isSubmitting: boolean = false;
  errorMessage: string = '';
  editMode: boolean = false;

  constructor(private reviewService: ReviewService) {}

  ngOnInit(): void {
    if (this.existingReview) {
      this.editMode = true;
      this.rating = this.existingReview.rating;
      this.comment = this.existingReview.comment;
    }
  }

  onRatingChange(rating: number): void {
    this.rating = rating;
    this.errorMessage = '';
  }

  onClose(): void {
    this.closed.emit();
    this.resetForm();
  }

  onSubmit(): void {
    if (this.rating < 1) {
      this.errorMessage = 'Please select a rating';
      return;
    }

    if (!this.reservationId && !this.editMode) {
      this.errorMessage = 'Reservation ID is required';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    if (this.editMode && this.existingReview) {
      this.updateReview();
    } else {
      this.createReview();
    }
  }

  private createReview(): void {
    const payload: CreateReviewPayload = {
      eventId: this.eventId,
      userId: this.userId,
      reservationId: this.reservationId!,
      rating: this.rating,
      comment: this.comment
    };

    this.reviewService.create(payload).subscribe({
      next: (review) => {
        this.isSubmitting = false;
        this.submitted.emit(review);
        this.closed.emit();
        this.resetForm();
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage = error.message || 'Failed to submit review';
      }
    });
  }

  private updateReview(): void {
    const payload: UpdateReviewPayload = {
      rating: this.rating,
      comment: this.comment
    };

    this.reviewService.update(this.existingReview!.id, payload).subscribe({
      next: (review) => {
        this.isSubmitting = false;
        this.submitted.emit(review);
        this.closed.emit();
        this.resetForm();
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage = error.message || 'Failed to update review';
      }
    });
  }

  private resetForm(): void {
    this.rating = 0;
    this.comment = '';
    this.isSubmitting = false;
    this.errorMessage = '';
    this.editMode = false;
  }

  // Close on Escape key
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.onClose();
    }
  }
}