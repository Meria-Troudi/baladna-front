import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { AdminLayoutComponent } from './admin-layout/admin-layout.component';
import { HostLayoutComponent } from './host-layout/host-layout.component';
import { TouristLayoutComponent } from './tourist-layout/tourist-layout.component';
import { ArtisanLayoutComponent } from './artisan-layout/artisan-layout.component';

@NgModule({
  declarations: [
    AdminLayoutComponent,
    HostLayoutComponent,
    TouristLayoutComponent,
    ArtisanLayoutComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    SharedModule
  ],
  exports: [
    AdminLayoutComponent,
    HostLayoutComponent,
    TouristLayoutComponent,
    ArtisanLayoutComponent
  ]
})
export class LayoutModule { }
