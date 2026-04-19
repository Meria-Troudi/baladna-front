import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransportMapComponent } from './transport-map.component';

@NgModule({
  declarations: [TransportMapComponent],
  imports: [CommonModule],
  exports: [TransportMapComponent]
})
export class TransportMapModule {}