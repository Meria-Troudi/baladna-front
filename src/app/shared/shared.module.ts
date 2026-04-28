import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HeaderComponent } from './components/header/header.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { FooterComponent } from './components/footer/footer.component';
import { TouristSidebarComponent } from './components/sidebar/tourist-sidebar/tourist-sidebar.component';
import { HostSidebarComponent } from './components/sidebar/host-sidebar/host-sidebar.component';
import { ArtisanSidebarComponent } from './components/sidebar/artisan-sidebar/artisan-sidebar.component';
import { NotificationDisplayComponent } from './components/notification-display/notification-display.component';
import { ConfirmationModalComponent } from './components/confirmation-modal/confirmation-modal.component';
import { ProfilePhotoComponent } from './components/profile-photo/profile-photo.component';



@NgModule({
  declarations: [
     HeaderComponent,
    SidebarComponent,
    FooterComponent,
    TouristSidebarComponent,
    HostSidebarComponent,
    ArtisanSidebarComponent,
    NotificationDisplayComponent,
    ArtisanSidebarComponent,
    ConfirmationModalComponent,
    ProfilePhotoComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule
  ],
exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    HeaderComponent,
    SidebarComponent,
    FooterComponent,
    TouristSidebarComponent,
    HostSidebarComponent,
    ArtisanSidebarComponent,
    NotificationDisplayComponent,
    ConfirmationModalComponent,
    RouterModule,
    ProfilePhotoComponent
  ]
})
export class SharedModule { }
