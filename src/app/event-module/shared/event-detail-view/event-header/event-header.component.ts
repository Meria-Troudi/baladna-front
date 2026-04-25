import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Event } from '../../../models/event.model';

@Component({
  selector: 'app-event-header',
  templateUrl: './event-header.component.html',
  styleUrls: ['./event-header.component.css']
})
export class EventHeaderComponent implements OnInit, OnDestroy {
  @Input() event: Event | null = null;
  @Input() countdown = { days: '00', hrs: '00', min: '00', sec: '00' };
  @Output() returnClick = new EventEmitter<void>();
  
  remainingSeats: number = 0;
  private intervalId!: any;

  ngOnInit(): void {
    this.calculateRemainingSeats();
    this.startCountdown();
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalId);
  }

  private calculateRemainingSeats(): void {
    if (this.event) {
      this.remainingSeats = (this.event.capacity || 0) - (this.event.bookedSeats || 0);
    }
  }

  private startCountdown(): void {
    this.intervalId = setInterval(() => {
      // Countdown is managed by parent, just ensuring cleanup
    }, 1000);
  }

  onReturn(): void {
    this.returnClick.emit();
  }

  getCoverImageUrl(): string | null {
    if (!this.event) return null;
    
    // First try to get cover image from media array
    if (this.event.media && this.event.media.length > 0) {
      const coverMedia = this.event.media.find(m => m.isCover);
      if (coverMedia && coverMedia.url) {
        return coverMedia.url;
      }
      // If no cover marked, use first image
      const firstImage = this.event.media.find(m => m.type === 'IMAGE' && m.url);
      if (firstImage) {
        return firstImage.url;
      }
    }
    
    // Fallback to imageUrl property
    if (this.event.imageUrl) {
      return this.event.imageUrl;
    }
    
    return null;
  }
}
