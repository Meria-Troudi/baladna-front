import { Component, Input } from '@angular/core';
import { Event } from '../../../models/event.model';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-event-info',
  templateUrl: './event-info.component.html',
  styleUrls: ['./event-info.component.css']
})
export class EventInfoComponent {
  @Input() event: Event | null = null;

  getEventStatus(): string {
    if (!this.event?.startAt) return 'No Date';
    const eventDate = new Date(this.event.startAt);
    const now = new Date();
    
    if (eventDate < now) return 'Event Ended';
    if (eventDate.toDateString() === now.toDateString()) return 'Today';
    if (eventDate.getTime() - now.getTime() < 24 * 60 * 60 * 1000) return 'Tomorrow';
    
    const daysUntil = Math.ceil((eventDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    return `In ${daysUntil} days`;
  }
}