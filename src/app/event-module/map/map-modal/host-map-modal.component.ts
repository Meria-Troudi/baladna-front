import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HostMapPickerComponent } from '../map-picker/host-map-picker.component';
import { FormsModule } from '@angular/forms';
import { Input } from '@angular/core';

@Component({
  selector: 'app-host-map-modal',
  templateUrl: './host-map-modal.component.html',
  styleUrls: ['./host-map-modal.component.css']
})
export class HostMapModalComponent {
  
  @Input() latitude?: number;
  @Input() longitude?: number;

  @Output() closeModal = new EventEmitter<void>();
  @Output() locationPicked = new EventEmitter<{ lat: number; lng: number; label?: string }>();

  onLocationSelected(event: any): void {
    this.locationPicked.emit({
      lat: event.lat,
      lng: event.lng,
      label: event.label
    });
    this.closeModal.emit();
  }

  close(): void {
    this.closeModal.emit();
  }
}