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
<<<<<<< HEAD
import { ProfilePhotoComponent } from './components/profile-photo/profile-photo.component';
=======
>>>>>>> 4ccebdbd6c3d33473beec788c0d97eaf73ebe101



@NgModule({
  declarations: [
     HeaderComponent,
    SidebarComponent,
    FooterComponent,
    TouristSidebarComponent,
    HostSidebarComponent,
<<<<<<< HEAD
    ArtisanSidebarComponent,
    ProfilePhotoComponent
=======
    ArtisanSidebarComponent
>>>>>>> 4ccebdbd6c3d33473beec788c0d97eaf73ebe101
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
<<<<<<< HEAD
    RouterModule,
    ProfilePhotoComponent
=======
    RouterModule
>>>>>>> 4ccebdbd6c3d33473beec788c0d97eaf73ebe101
  ]
})
export class SharedModule { }
