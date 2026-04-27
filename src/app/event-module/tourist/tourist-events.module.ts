import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { EventSharedModule } from '../event-shared.module';

import { TouristEventsRoutingModule } from './tourist-events-routing.module';
import { TouristEventsComponent } from './pages/tourist-events/tourist-events.component';
import { EventReviewsPageComponent } from './pages/event-reviews-page/event-reviews-page.component';
import { QrReservationComponent } from './components/qr-reservation/qr-reservation.component';
import { EventsListComponent } from './pages/events-list/events-list.component';
import { TouristReservationsComponent } from './components/tourist-reservations/tourist-reservations.component';
import { FeaturedEventCardComponent } from './components/featured-event-card/featured-event-card.component';
import { LiveStatusCardComponent } from './components/live-status-card/live-status-card.component';
import { MinimalEventCardComponent } from './pages/tourist-events/minimal-event-card.component';
import { TrendingPageComponent } from './pages/trending-page/trending-page.component';
import { RecommendationModalComponent } from './pages/modals/recommendation-modal.component';
import { ExplanationPanelComponent } from './pages/modals/explanation-panel.component';
import { ModalComponent } from '../shared/modal/modal.component';

@NgModule({
  declarations: [
    TouristEventsComponent,
    EventReviewsPageComponent,
    QrReservationComponent,
    EventsListComponent,
    TouristReservationsComponent,
    FeaturedEventCardComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    SharedModule,
    TouristEventsRoutingModule,
    EventSharedModule, // ALL SHARED COMPONENTS IMPORTED HERE
    MinimalEventCardComponent,
    TrendingPageComponent,
    RecommendationModalComponent,
    ExplanationPanelComponent,
    ModalComponent
  ],
  exports: [
    EventSharedModule // EXPORT FOR OTHER MODULES
  ]
})
export class TouristEventsModule { }
