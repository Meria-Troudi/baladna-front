import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// AUTH
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { ForgotPasswordComponent } from './features/auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './features/auth/reset-password/reset-password.component';
import { OAuth2CallbackComponent } from './features/auth/oauth2-callback/oauth2-callback.component';

// USER
import { ProfileComponent } from './features/user/pages/profile/profile/profile.component';
import { UsersComponent } from './features/user/admin/users.component';

// GUARDS
import { AuthGuard } from './core/guards/auth.guard';
import { AdminGuard } from './core/guards/admin.guard';
import { HostGuard } from './core/guards/host.guard';
import { TouristGuard } from './core/guards/tourist.guard';
import { ArtisanGuard } from './core/guards/artisan.guard';

// LAYOUTS
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';
import { HostLayoutComponent } from './layout/host-layout/host-layout.component';
import { TouristLayoutComponent } from './layout/tourist-layout/tourist-layout.component';
import { ArtisanLayoutComponent } from './layout/artisan-layout/artisan-layout.component';

// DASHBOARDS
import { DashboardComponent } from './features/admin/dashboard/dashboard.component';
import { HomeComponent } from './features/home/home.component';
import { TouristDashboardComponent } from './features/tourist/dashboard/tourist-dashboard.component';
import { HostDashboardComponent } from './features/host/dashboard/host-dashboard.component';
import { HostOverviewComponent } from './features/host/overview/host-overview.component';
import { OAuthCallbackComponent } from './features/itinerary/pages/oauth-callback/oauth-callback.component';

// TOURIST
import { TouristDiscoverComponent } from './features/tourist/pages/discover/tourist-discover.component';
import { TouristAccommodationsComponent } from './features/tourist/pages/accommodations/tourist-accommodations.component';
import { TouristAccommodationDetailComponent } from './features/tourist/pages/accommodations/detail/tourist-accommodation-detail.component';
import { ArtisanDashboardComponent } from './features/artisan/dashboard/artisan-dashboard.component';

// TOURIST
import { TouristTransportComponent } from './features/tourist/pages/transport/tourist-transport.component';
import { TouristMarketplaceComponent } from './features/tourist/pages/marketplace/tourist-marketplace.component';
import { TouristBookingsComponent } from './features/tourist/pages/bookings/tourist-bookings.component';
import { TouristFavoritesComponent } from './features/tourist/pages/favorites/tourist-favorites.component';
import { TouristReviewsComponent } from './features/tourist/pages/reviews/tourist-reviews.component';
import { TouristSettingsComponent } from './features/tourist/pages/settings/tourist-settings.component';
import { TouristHelpComponent } from './features/tourist/pages/help/tourist-help.component';

// HOST
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

// ✅ RH
import { InterviewListComponent } from './features/rh/interview-list/interview-list.component';
import { ApplyFormComponent } from './features/rh/apply-form/apply-form.component';
import { RhDashboardComponent } from './features/admin/rh/rh-dashboard/rh-dashboard.component';
import { ApplicationsListComponent } from './features/admin/rh/applications-list/applications-list.component';

const routes: Routes = [

  // PUBLIC
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'oauth2/callback', component: OAuth2CallbackComponent },


  
  // ADMIN
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [AuthGuard, AdminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'users', component: UsersComponent },
      { path: 'rh',  component: RhDashboardComponent },
      { path: 'rh/applications/:id', component: ApplicationsListComponent },
      { 
        path: 'events',
        loadChildren: () => import('./event-module/admin/admin-events.module').then(m => m.AdminEventsModule)
      },
      { 
        path: 'forum',
        loadChildren: () => import('./event-module/forum/forum.module').then(m => m.ForumModule)
      },
            {
        path: 'marketplace',
        loadChildren: () => import('./features/marketplace/admin/admin-marketplace.module').then(m => m.AdminMarketplaceModule),
      }
    ]
  },

  // HOST
  {
    path: 'host',
    component: HostLayoutComponent,
    canActivate: [AuthGuard, HostGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'overview', component: HostOverviewComponent },
      { path: 'dashboard', component: HostDashboardComponent },
      { path: 'profile', component: ProfileComponent },

      // ✅ TRANSPORT
      { path: 'stations', component: HostStationsComponent },
      { path: 'trajets', component: HostTrajetsComponent },
      { path: 'transports', component: HostTransportsComponent },
      { path: 'properties', component: HostPropertiesComponent },
      { path: 'bookings', component: HostBookingsComponent },
      { path: 'calendar', component: HostCalendarComponent },
      { path: 'analytics', component: HostAnalyticsComponent },
      { path: 'messages', component: HostMessagesComponent },
      { path: 'reviews', component: HostReviewsComponent },
      { path: 'settings', component: HostSettingsComponent },
      { path: 'help', component: ProfileComponent },
      { 
        path: 'my-events',
        loadChildren: () => import('./event-module/host/host-events.module').then(m => m.HostEventsModule)
      },
      { 
        path: 'forum',
        loadChildren: () => import('./event-module/forum/forum.module').then(m => m.ForumModule)
      },
      {
        path: 'marketplace',
        loadChildren: () => import('./features/marketplace/host/host-marketplace.module').then(m => m.HostMarketplaceModule),
      }
    ]
  },

  // TOURIST
  {
    path: 'tourist',
    component: TouristLayoutComponent,
    canActivate: [AuthGuard, TouristGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: TouristDashboardComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'discover', component: TouristDiscoverComponent },
      { path: 'accommodations', component: TouristAccommodationsComponent },
      { path: 'accommodations/:id', component: TouristAccommodationDetailComponent },
      { path: 'transport', component: TouristTransportComponent },
      { path: 'marketplace', component: TouristMarketplaceComponent },
      { path: 'bookings', component: TouristBookingsComponent },
      { path: 'favorites', component: TouristFavoritesComponent },
      { path: 'reviews', component: TouristReviewsComponent },
      { path: 'settings', component: TouristSettingsComponent },
      { path: 'help', component: TouristHelpComponent },
      { 
        path: 'events',
        loadChildren: () => import('./event-module/tourist/tourist-events.module').then(m => m.TouristEventsModule)
      },
      { 
        path: 'forum',
        loadChildren: () => import('./event-module/forum/forum.module').then(m => m.ForumModule)
      },
      { path: 'itineraries', loadChildren: () => import('./features/itinerary/itinerary.component').then(m => m.ItineraryModule) }
    ]
  },

  // ARTISAN
  {
    path: 'artisan',
    component: ArtisanLayoutComponent,
    canActivate: [AuthGuard, ArtisanGuard],
    children: [
      { path: '', redirectTo: 'marketplace/dashboard', pathMatch: 'full' },
      { path: 'dashboard', redirectTo: 'marketplace/dashboard', pathMatch: 'full' },
      { path: 'profile', component: ProfileComponent },
      { path: 'products', redirectTo: 'marketplace/products', pathMatch: 'full' },
      { path: 'orders', redirectTo: 'marketplace/orders', pathMatch: 'full' },
      { path: 'analytics', redirectTo: 'marketplace/dashboard', pathMatch: 'full' },
      { path: 'settings', component: ArtisanSettingsComponent },
      { path: 'help', component: ProfileComponent },
      {
        path: 'marketplace',
        loadChildren: () => import('./features/marketplace/artisan/artisan-marketplace.module').then(m => m.ArtisanMarketplaceModule),
      }
    ]
  },

  // MARKETPLACE ALIAS
  {
    path: 'marketplace',
    children: [
      { path: 'admin', canActivate: [AuthGuard, AdminGuard], loadChildren: () => import('./features/marketplace/admin/admin-marketplace.module').then(m => m.AdminMarketplaceModule) },
      { path: 'host', canActivate: [AuthGuard, HostGuard], loadChildren: () => import('./features/marketplace/host/host-marketplace.module').then(m => m.HostMarketplaceModule) },
      { path: 'artisan', canActivate: [AuthGuard, ArtisanGuard], loadChildren: () => import('./features/marketplace/artisan/artisan-marketplace.module').then(m => m.ArtisanMarketplaceModule) },
    ],
  },

  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
