import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

export interface FeaturedEvent {
  eventId: number;
  title: string;
  coverImage: string;
  startAt: string;
  location: string;
  price: number;
  status: 'UPCOMING' | 'ONGOING' | 'FULL' | 'CANCELED' | 'FINISHED';
  avgRating?: number;
  countdown?: { days: number; hours: number; minutes: number };
}

@Component({
  selector: 'app-featured-event-card',
  templateUrl: './featured-event-card.component.html',
  styleUrls: ['./featured-event-card.component.css']
})
export class FeaturedEventCardComponent implements OnInit, OnDestroy {
  @Input() event!: FeaturedEvent;
  @Input() isLastReservation: boolean = false;
  @Input() reserved: boolean = false;
  
  countdownInterval: any;

  constructor(private router: Router) {}

  ngOnInit() {
    if (this.event && this.event.startAt) {
      this.updateCountdown();
      this.countdownInterval = setInterval(() => this.updateCountdown(), 60000);
    }
  }

  ngOnDestroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  updateCountdown() {
    if (!this.event?.startAt) return;
    
    const now = new Date();
    const start = new Date(this.event.startAt);
    const diff = start.getTime() - now.getTime();
    
    if (diff <= 0) {
      this.event.countdown = { days: 0, hours: 0, minutes: 0 };
      return;
    }
    
    this.event.countdown = {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    };
  }

  viewDetails() {
    this.router.navigate(['/tourist/events'], { 
      queryParams: { id: this.event.eventId } 
    });
  }

  bookNow() {
    this.router.navigate(['/tourist/events/list']);
  }

  getStars(rating: number | undefined): string {
    if (!rating) return '';
    return '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
  }
}