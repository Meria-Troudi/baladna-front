import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { ItineraryListComponent } from './pages/itinerary-list/itinerary-list.component';
import { ItineraryCreateComponent } from './pages/itinerary-create/itinerary-create.component';
import { ItineraryDetailComponent } from './pages/itinerary-detail/itinerary-detail.component';
import { GoogleCalendarOAuthCallbackComponent } from './pages/itinerary-calendar/google-calendar-oauth-callback.component';
import { ChatModule } from './chat/chat.module';

const routes: Routes = [
  { path: '', component: ItineraryListComponent },
  { path: 'create', component: ItineraryCreateComponent },
  { path: 'calendar-oauth-callback', component: GoogleCalendarOAuthCallbackComponent },
  { path: ':id', component: ItineraryDetailComponent },
  { path: ':id/edit', component: ItineraryCreateComponent }
];

@NgModule({
  declarations: [
    ItineraryListComponent,
    ItineraryCreateComponent,
    ItineraryDetailComponent,
    GoogleCalendarOAuthCallbackComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    RouterModule.forChild(routes),
    ChatModule
  ]
})
export class ItineraryModule {}