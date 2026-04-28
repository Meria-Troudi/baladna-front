import { NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { JwtInterceptor } from './core/interceptors/jwt.interceptor';
import { SharedModule } from './shared/shared.module';
import { LayoutModule } from './layout/layout.module';
import { EventSharedModule } from './event-module/event-shared.module';
import { TransportMapModule } from './shared/components/transport-map/transport-map.module';

// AUTH
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { ForgotPasswordComponent } from './features/auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './features/auth/reset-password/reset-password.component';
import { OAuth2CallbackComponent } from './features/auth/oauth2-callback/oauth2-callback.component';

// USER
import { ProfileComponent } from './features/user/pages/profile/profile/profile.component';
import { UsersComponent } from './features/user/admin/users.component';

// DASHBOARD
import { DashboardComponent } from './features/admin/dashboard/dashboard.component';
import { HomeComponent } from './features/home/home.component';
import { TouristDashboardComponent } from './features/tourist/dashboard/tourist-dashboard.component';
import { PlanningCalendarModalComponent } from './features/itinerary/pages/planning-calendar-modal/planning-calendar-modal.component';
import { OAuthCallbackComponent } from './features/itinerary/pages/oauth-callback/oauth-callback.component';
import { HostDashboardComponent } from './features/host/dashboard/host-dashboard.component';
import { HostOverviewComponent } from './features/host/overview/host-overview.component';
import { ArtisanDashboardComponent } from './features/artisan/dashboard/artisan-dashboard.component';

// TOURIST
import { TouristDiscoverComponent } from './features/tourist/pages/discover/tourist-discover.component';
import { TouristAccommodationsComponent } from './features/tourist/pages/accommodations/tourist-accommodations.component';
import { TouristAccommodationDetailComponent } from './features/tourist/pages/accommodations/detail/tourist-accommodation-detail.component';
import { TouristTransportComponent } from './features/tourist/pages/transport/tourist-transport.component';
import { TouristMarketplaceComponent } from './features/tourist/pages/marketplace/tourist-marketplace.component';
import { TouristBookingsComponent } from './features/tourist/pages/bookings/tourist-bookings.component';
import { TouristFavoritesComponent } from './features/tourist/pages/favorites/tourist-favorites.component';
import { TouristReviewsComponent } from './features/tourist/pages/reviews/tourist-reviews.component';
import { TouristSettingsComponent } from './features/tourist/pages/settings/tourist-settings.component';
import { TouristHelpComponent } from './features/tourist/pages/help/tourist-help.component';
import { TouristProductCardComponent } from './features/tourist/pages/marketplace/components/tourist-product-card.component';
import { TouristCartItemComponent } from './features/tourist/pages/marketplace/components/tourist-cart-item.component';

// HOST COMPONENTS
import { HostPropertiesComponent } from './features/host/pages/properties/host-properties.component';
import { HostBookingsComponent } from './features/host/pages/bookings/host-bookings.component';
import { HostCalendarComponent } from './features/host/pages/calendar/host-calendar.component';
import { HostAnalyticsComponent } from './features/host/pages/analytics/host-analytics.component';
import { HostMessagesComponent } from './features/host/pages/messages/host-messages.component';
import { HostReviewsComponent } from './features/host/pages/reviews/host-reviews.component';
import { HostSettingsComponent } from './features/host/pages/settings/host-settings.component';

// ✅ TON MODULE TRANSPORT
import { HostStationsComponent } from './features/host/pages/stations/host-stations/host-stations.component';
import { HostTrajetsComponent } from './features/host/pages/trajets/host-trajets/host-trajets.component';
import { HostTransportsComponent } from './features/host/pages/transports/host-transports/host-transports.component';

// ARTISAN
import { ArtisanProductsComponent } from './features/artisan/pages/products/artisan-products.component';
import { ArtisanOrdersComponent } from './features/artisan/pages/orders/artisan-orders.component';
import { ArtisanWorkshopComponent } from './features/artisan/pages/workshop/artisan-workshop.component';
import { ArtisanAnalyticsComponent } from './features/artisan/pages/analytics/artisan-analytics.component';
import { ArtisanMessagesComponent } from './features/artisan/pages/messages/artisan-messages.component';
import { ArtisanReviewsComponent } from './features/artisan/pages/reviews/artisan-reviews.component';
import { ArtisanSettingsComponent } from './features/artisan/pages/settings/artisan-settings.component';
import { ForumModule } from './event-module/forum/forum.module';


// ✅ RH
import { InterviewListComponent } from './features/rh/interview-list/interview-list.component';
import { ApplyFormComponent } from './features/rh/apply-form/apply-form.component';
import { RhDashboardComponent } from './features/admin/rh/rh-dashboard/rh-dashboard.component';
import { InterviewFormComponent } from './features/admin/rh/interview-form/interview-form.component';
import { ApplicationsListComponent } from './features/admin/rh/applications-list/applications-list.component';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';

//
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { CheckoutModalComponent } from './features/tourist/pages/marketplace/components/checkout-modal/checkout-modal.component';
import { AiAssistantComponent } from './features/marketplace/ai-assistant/components/ai-assistant.component';





@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    ForgotPasswordComponent,
    ResetPasswordComponent,
    OAuth2CallbackComponent,

    ProfileComponent,
    UsersComponent,

    DashboardComponent,
    HomeComponent,
    TouristDashboardComponent,
    PlanningCalendarModalComponent,
    OAuthCallbackComponent,
    HostDashboardComponent,
    HostOverviewComponent,
    ArtisanDashboardComponent,

    TouristDiscoverComponent,
    // TouristEventsComponent removed – declared in TouristEventsModule
    TouristAccommodationsComponent,
    TouristAccommodationDetailComponent,
    ProfileComponent,
    UsersComponent,
    DashboardComponent,
    HomeComponent,
    TouristDashboardComponent,
    HostDashboardComponent,
    ArtisanDashboardComponent,
    
    
    // TOURIST PAGES
    TouristDiscoverComponent,
    TouristAccommodationsComponent,
    TouristTransportComponent,
    TouristMarketplaceComponent,
    TouristBookingsComponent,
    TouristFavoritesComponent,
    TouristReviewsComponent,
    TouristSettingsComponent,
    TouristHelpComponent,
    TouristProductCardComponent,
    TouristCartItemComponent,
    CheckoutModalComponent,
    // HOST PAGES
    HostPropertiesComponent,
    HostBookingsComponent,
    HostCalendarComponent,
    HostAnalyticsComponent,
    HostMessagesComponent,
    HostReviewsComponent,
    HostSettingsComponent,
    HostStationsComponent,
    HostTrajetsComponent,
    HostTransportsComponent,

    ArtisanProductsComponent,
    ArtisanOrdersComponent,
    ArtisanWorkshopComponent,
    ArtisanAnalyticsComponent,
    ArtisanMessagesComponent,
    ArtisanReviewsComponent,
    ArtisanSettingsComponent,
    // Forum module provides forum components (FeedPage, PostCard, CreatePost, CommentsModal, etc.)

    InterviewListComponent,
    ApplyFormComponent,
    RhDashboardComponent,
    InterviewFormComponent,
    ApplicationsListComponent,
    // AiAssistantComponent (standalone, imported below)
    ForgotPasswordComponent,
    ResetPasswordComponent,
    OAuth2CallbackComponent,
    
    
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule,
    LayoutModule,
    ForumModule,
    EventSharedModule, 
    TransportMapModule,
    AiAssistantComponent

  ],
 

  providers: [
     
    
    provideClientHydration(),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: JwtInterceptor,
      multi: true},
      {
      provide: HTTP_INTERCEPTORS,
          useClass: AuthInterceptor,
          multi: true
    },
    CommonModule,       
    RouterModule ,
     DatePipe,
  ],
   
  
  bootstrap: [AppComponent]
})
export class AppModule { }
