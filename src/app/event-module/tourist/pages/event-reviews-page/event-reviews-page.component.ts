import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EventReview, ReviewEligibility, ReviewSummary } from '../../../models/event-review.model';
import { ReviewService } from '../../../services/review.service';
import { ReservationService } from '../../../services/reservation.service';

@Component({
  selector: 'app-event-reviews-page',
  templateUrl: './event-reviews-page.component.html',
  styleUrls: ['./event-reviews-page.component.css']
})
export class EventReviewsPageComponent implements OnInit {
userId: number | null = null; // Dynamically resolved from backend
  eventId!: number;
  userType: 'tourist' | 'host' = 'tourist';

  event: any = null;
  reviews: EventReview[] = [];
  summary: ReviewSummary = { averageRating: 0, totalReviews: 0 };
  userReview: EventReview | null = null;
  eligibility: ReviewEligibility | null = null;

  isLoading: boolean = true;
  error: string | null = null;

  // Modal state
  showReviewModal: boolean = false;
  editMode: boolean = false;

  // Sorting
  sortBy: string = 'latest';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reviewService: ReviewService,
    private reservationService: ReservationService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.eventId = +id;
      this.loadAllData();
    } else {
      this.error = 'Event ID is required';
      this.isLoading = false;
    }
  }

  loadAllData(): void {
    this.isLoading = true;
    this.error = null;

    // Load event details
    this.loadEvent();

    // Load reviews
    this.reviewService.getByEvent(this.eventId).subscribe({
      next: (reviews) => {
        this.reviews = reviews;
        this.sortReviews();
      },
      error: (err) => {
        console.error('Error loading reviews:', err);
      }
    });

    // Load summary
    this.reviewService.getReviewSummary(this.eventId).subscribe({
      next: (summary) => {
        this.summary = summary;
      },
      error: (err) => {
        console.error('Error loading summary:', err);
      }
    });

    // Fetch current user ID and check eligibility for current authenticated user
    this.reservationService.getEligibility(this.eventId).subscribe({
      next: (eligibility) => {
        this.userId = eligibility.userId || null; // Dynamically resolve userId
        this.reviewService.checkMyEligibility(this.eventId).subscribe({
          next: (elig) => {
            // Patch eligibility with reservation status/payment if missing
            if (!elig.reservationStatus || !elig.paymentStatus) {
              this.reservationService.getMyReservations().subscribe({
                next: (reservations) => {
                  const res = reservations.find(r => r.event?.id === this.eventId);
                  this.eligibility = {
                    ...elig,
                    reservationStatus: res?.status,
                    paymentStatus: res?.paymentStatus
                  };
                },
                error: () => {
                  this.eligibility = elig;
                },
                complete: () => {
                  // If already reviewed, load current user's review
                  if (elig.alreadyReviewed) {
                    this.reviewService.getMyReview(this.eventId).subscribe({
                      next: (review) => {
                        this.userReview = review;
                      }
                    });
                  }
                  this.isLoading = false;
                }
              });
            } else {
              this.eligibility = elig;
              // If already reviewed, load current user's review
              if (elig.alreadyReviewed) {
                this.reviewService.getMyReview(this.eventId).subscribe({
                  next: (review) => {
                    this.userReview = review;
                  }
                });
              }
              this.isLoading = false;
            }
          },
          error: (err) => {
            console.error('Error checking eligibility:', err);
            this.isLoading = false;
          }
        });
      },
      error: (err) => {
        console.error('Error fetching eligibility:', err);
        this.isLoading = false;
      }
    });
  }

  loadEvent(): void {
    // Load event details - using event service
    // For now, we'll just store the ID and let the template handle it
    this.event = { id: this.eventId };
  }

  get canReview(): boolean {
    return (
      !!this.eligibility?.canReview &&
      this.eligibility?.reservationStatus === 'CONFIRMED' &&
      this.eligibility?.paymentStatus === 'PAID'
    );
  }

  get alreadyReviewed(): boolean {
    return this.eligibility?.alreadyReviewed ?? false;
  }

  get reservationId(): number | null {
    return this.eligibility?.reservationId ?? null;
  }

  sortReviews(): void {
    const sorted = [...this.reviews];

    switch (this.sortBy) {
      case 'latest':
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'highest':
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      case 'lowest':
        sorted.sort((a, b) => a.rating - b.rating);
        break;
    }

    this.reviews = sorted;
  }

  openAddReviewModal(): void {
    this.editMode = false;
    this.showReviewModal = true;
  }

  openEditReviewModal(): void {
    this.editMode = true;
    this.showReviewModal = true;
  }

  closeReviewModal(): void {
    this.showReviewModal = false;
  }

  onReviewSubmitted(): void {
    // Reload data
    this.loadAllData();
  }

  deleteReview(): void {
    if (!this.userReview) return;

    if (confirm('Are you sure you want to delete your review?')) {
      this.reviewService.delete(this.userReview.id).subscribe({
        next: () => {
          this.userReview = null;
          this.loadAllData();
        },
        error: (err) => {
          console.error('Error deleting review:', err);
          alert('Failed to delete review');
        }
      });
    }
  }

  getSentimentLabel(score?: number): string {
    if (score === undefined || score === null) return '';
    if (score > 0.3) return '😊 Positive';
    if (score < -0.3) return '😡 Negative';
    return '😐 Neutral';
  }

  getSentimentClass(score?: number): string {
    if (score === undefined || score === null) return '';
    if (score > 0.3) return 'positive';
    if (score < -0.3) return 'negative';
    return 'neutral';
  }

  goBack(): void {
    // Go back to events list and automatically open the same event detail view exactly as it was
    this.router.navigate(['/tourist/events/list'], {
      queryParams: { id: this.eventId },
      queryParamsHandling: 'merge'
    });
  }
}