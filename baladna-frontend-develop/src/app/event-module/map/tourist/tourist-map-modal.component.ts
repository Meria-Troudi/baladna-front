import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-tourist-map-modal',
  templateUrl: './tourist-map-modal.component.html',
  styleUrls: ['./tourist-map-modal.component.css']
})
export class TouristMapModalComponent {
  @Input() lat!: number;
  @Input() lng!: number;

  @Output() close = new EventEmitter<void>();
}