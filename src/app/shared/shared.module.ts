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



@NgModule({
  declarations: [
     HeaderComponent,
    SidebarComponent,
    FooterComponent,
    TouristSidebarComponent,
    HostSidebarComponent,
    ArtisanSidebarComponent,
    NotificationDisplayComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule
  ],
  exports: [
    HeaderComponent,
    SidebarComponent,
    FooterComponent,
    TouristSidebarComponent,
    HostSidebarComponent,
    ArtisanSidebarComponent,
    NotificationDisplayComponent,
    RouterModule
  ]
})
export class SharedModule { }
