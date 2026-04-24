import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // ✅ ADD THIS
import { HostMapModalComponent } from '../map-modal/host-map-modal.component';
import { HostMapPickerComponent } from './host-map-picker.component';
import { TouristMapModalComponent } from '../tourist/tourist-map-modal.component';
import { TouristRouteMapComponent } from '../tourist/tourist-route-map.component';

@NgModule({
  declarations: [
    HostMapModalComponent,
    HostMapPickerComponent,
    TouristMapModalComponent,
    TouristRouteMapComponent
  ],
  imports: [CommonModule, FormsModule], // ✅ ADD HERE
  exports: [
    HostMapModalComponent,
    HostMapPickerComponent,
    TouristMapModalComponent,
    TouristRouteMapComponent
  ]
})
export class MapPickerModule {}
