<<<<<<< HEAD
import { Component, OnInit } from '@angular/core';
import { AccommodationApiService } from '../../../accommodation/services/accommodation-api.service';
import { ClientReviewRow } from '../../../accommodation/models/accommodation.types';
=======
import { Component } from '@angular/core';
>>>>>>> origin/marketplace-frontend

@Component({
  selector: 'app-host-reviews',
  templateUrl: './host-reviews.component.html',
  styleUrls: ['./host-reviews.component.css']
})
<<<<<<< HEAD
export class HostReviewsComponent implements OnInit {
  reviews: ClientReviewRow[] = [];
  loading = true;
  err: string | null = null;

  constructor(private api: AccommodationApiService) {}

  ngOnInit(): void {
    this.api.hostClientReviews().subscribe({
      next: (list) => {
        this.reviews = list;
        this.loading = false;
      },
      error: (e) => {
        this.err = e?.error?.message || 'Could not load guest reviews.';
        this.loading = false;
      }
    });
  }

  stars(n: number): string {
    return '★'.repeat(n) + '☆'.repeat(5 - n);
  }
=======
export class HostReviewsComponent {
  
>>>>>>> origin/marketplace-frontend
}
