import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AccommodationApiService } from '../../../accommodation/services/accommodation-api.service';
import { TouristReservationRow } from '../../../accommodation/models/accommodation.types';

@Component({
  selector: 'app-tourist-bookings',
  templateUrl: './tourist-bookings.component.html',
  styleUrls: ['./tourist-bookings.component.css']
})
export class TouristBookingsComponent implements OnInit {
  rows: TouristReservationRow[] = [];
  loading = true;
  err: string | null = null;

  reviewFor: TouristReservationRow | null = null;
  reviewStars = 5;
  reviewComment = '';
  reviewBusy = false;
  reviewErr: string | null = null;

  constructor(
    private api: AccommodationApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.err = null;
    this.api.myReservations().subscribe({
      next: (list) => {
        this.rows = list;
        this.loading = false;
      },
      error: (e) => {
        this.err = e?.error?.message || 'Could not load reservations.';
        this.loading = false;
      }
    });
  }

  openReview(r: TouristReservationRow): void {
    this.reviewFor = r;
    this.reviewStars = 5;
    this.reviewComment = '';
    this.reviewErr = null;
  }

  closeReview(): void {
    this.reviewFor = null;
  }

  submitReview(): void {
    if (!this.reviewFor) return;
    this.reviewBusy = true;
    this.reviewErr = null;
    this.api
      .submitReview({
        reservationId: this.reviewFor.reservationId,
        stars: this.reviewStars,
        comment: this.reviewComment.trim() || undefined
      })
      .subscribe({
        next: () => {
          this.reviewBusy = false;
          this.closeReview();
          this.load();
        },
        error: (e) => {
          this.reviewBusy = false;
          this.reviewErr = e?.error?.message || 'Could not save review.';
        }
      });
  }

  goAcc(id: string): void {
    this.router.navigate(['/tourist/accommodations', id]);
  }

  setStar(n: number): void {
    this.reviewStars = n;
  }
}