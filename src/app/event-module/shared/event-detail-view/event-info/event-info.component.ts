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

 
}