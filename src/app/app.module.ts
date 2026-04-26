import { NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { ProfileComponent } from './features/user/pages/profile/profile/profile.component';
import { UsersComponent } from './features/user/admin/users.component';
import { HttpClientModule,HTTP_INTERCEPTORS } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { JwtInterceptor } from './core/interceptors/jwt.interceptor';
import { SharedModule } from './shared/shared.module';
import { LayoutModule } from './layout/layout.module';
import { DashboardComponent } from './features/admin/dashboard/dashboard.component';
import { HomeComponent } from './features/home/home.component';
import { TouristDashboardComponent } from './features/tourist/dashboard/tourist-dashboard.component';
import { HostDashboardComponent } from './features/host/dashboard/host-dashboard.component';
import { ArtisanDashboardComponent } from './features/artisan/dashboard/artisan-dashboard.component';

// TOURIST COMPONENTS
import { TouristDiscoverComponent } from './features/tourist/pages/discover/tourist-discover.component';
import { TouristEventsComponent } from './features/tourist/pages/events/tourist-events.component';
import { TouristAccommodationsComponent } from './features/tourist/pages/accommodations/tourist-accommodations.component';
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

// ARTISAN COMPONENTS
import { ArtisanProductsComponent } from './features/artisan/pages/products/artisan-products.component';
import { ArtisanOrdersComponent } from './features/artisan/pages/orders/artisan-orders.component';
import { ArtisanWorkshopComponent } from './features/artisan/pages/workshop/artisan-workshop.component';
import { ArtisanAnalyticsComponent } from './features/artisan/pages/analytics/artisan-analytics.component';
import { ArtisanMessagesComponent } from './features/artisan/pages/messages/artisan-messages.component';
import { ArtisanReviewsComponent } from './features/artisan/pages/reviews/artisan-reviews.component';
import { ArtisanSettingsComponent } from './features/artisan/pages/settings/artisan-settings.component';

//
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { CheckoutModalComponent } from './features/tourist/pages/marketplace/components/checkout-modal/checkout-modal.component';
import { AiAssistantComponent } from './features/marketplace/ai-assistant/components/ai-assistant.component';





@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    ProfileComponent,
    UsersComponent,
    DashboardComponent,
    HomeComponent,
    TouristDashboardComponent,
    HostDashboardComponent,
    ArtisanDashboardComponent,
    
    
    // TOURIST PAGES
    TouristDiscoverComponent,
    TouristEventsComponent,
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
    // ARTISAN PAGES
    ArtisanProductsComponent,
    ArtisanOrdersComponent,
    ArtisanWorkshopComponent,
    ArtisanAnalyticsComponent,
    ArtisanMessagesComponent,
    ArtisanReviewsComponent,
    ArtisanSettingsComponent,
    
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule,
    LayoutModule,
    AiAssistantComponent,
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
          useClass: AuthInterceptor,
          multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: JwtInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
