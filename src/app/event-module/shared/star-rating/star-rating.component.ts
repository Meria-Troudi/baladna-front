import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-star-rating',
  templateUrl: './star-rating.component.html',
  styleUrls: ['./star-rating.component.css']
})
export class StarRatingComponent {
  @Input() rating: number = 0;
  @Input() maxRating: number = 5;
  @Input() interactive: boolean = false;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() disabled: boolean = false;
  @Output() ratingChange = new EventEmitter<number>();

  get stars(): number[] {
    return Array(this.maxRating).fill(0).map((_, i) => i + 1);
  }

  get starClass(): string {
    return `star-${this.size}`;
  }

  onStarClick(star: number): void {
    if (!this.interactive || this.disabled) return;
    this.rating = star;
    this.ratingChange.emit(star);
  }

  onStarHover(star: number): void {
    if (!this.interactive || this.disabled) return;
    // Could add hover effect here if needed
  }

  // For hover effect
  hoverRating: number = 0;

  onHover(star: number): void {
    if (this.interactive && !this.disabled) {
      this.hoverRating = star;
    }
  }

  onHoverEnd(): void {
    if (this.interactive && !this.disabled) {
      this.hoverRating = 0;
    }
  }

  getEffectiveRating(star: number): boolean {
    return this.hoverRating ? star <= this.hoverRating : star <= this.rating;
  }
}