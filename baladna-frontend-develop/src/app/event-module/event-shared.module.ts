import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared.module';

// ALL SHARED EVENT COMPONENTS - DECLARED HERE ONCE ONLY

import { LiveStatusCardComponent } from './tourist/components/live-status-card/live-status-card.component';

import { DynamicTableComponent } from './admin/pages/dynamic-table/dynamic-table.component';
import { EventMapComponent } from './maps/event-map/event-map.component';
import { AdminEventMapComponent } from './admin/admin-event-map.component';
import { EventsOverviewComponent } from './admin/components/events-overview/events-overview.component';
import { EventsManagementComponent } from './admin/components/events-management/events-management.component';
import { BookingsManagementComponent } from './admin/components/bookings-management/bookings-management.component';
import { ReviewsManagementComponent } from './admin/components/reviews-management/reviews-management.component';
import { ReservationFormComponent } from './tourist/components/reservation-form/reservation-form.component';
import { EventCardComponent } from './shared/event-card/event-card.component';
import { StarRatingComponent } from './shared/star-rating/star-rating.component';
import { ReviewModalComponent } from './shared/review-modal/review-modal.component';
import { EventDetailViewComponent } from './shared/event-detail-view/event-detail-view.component';
import { EventHeaderComponent } from './shared/event-detail-view/event-header/event-header.component';
import { EventInfoComponent } from './shared/event-detail-view/event-info/event-info.component';
import { EventActionsComponent } from './shared/event-detail-view/event-actions/event-actions.component';
import { EventReviewsPreviewComponent } from './shared/event-reviews-preview/event-reviews-preview.component';
import { ModalComponent } from './shared/modal/modal.component';
 import { HostEventReservationsComponent } from './host/components/host-event-reservations/host-event-reservations.component';
import { BaseMapComponent } from './maps/base-map/base-map.component';
@NgModule({
  declarations: [
    EventCardComponent,
    StarRatingComponent,
    ReviewModalComponent,
    EventDetailViewComponent,
    EventHeaderComponent,
    EventInfoComponent,
    EventActionsComponent,
    EventReviewsPreviewComponent,
    ModalComponent,
    ReservationFormComponent,
     HostEventReservationsComponent,
    LiveStatusCardComponent,
    EventsOverviewComponent,
    EventsManagementComponent,
    BookingsManagementComponent,
    ReviewsManagementComponent,
    DynamicTableComponent,
    EventMapComponent,
    BaseMapComponent,
    AdminEventMapComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    SharedModule
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    EventCardComponent,
    StarRatingComponent,
    ReviewModalComponent,
    EventDetailViewComponent,
    EventHeaderComponent,
    EventInfoComponent,
    EventActionsComponent,
    EventReviewsPreviewComponent,
    ModalComponent,
    ReservationFormComponent,
     HostEventReservationsComponent,
    LiveStatusCardComponent,
    EventsOverviewComponent,
    EventsManagementComponent,
    BookingsManagementComponent,
    ReviewsManagementComponent,
    DynamicTableComponent,
    BaseMapComponent,
    AdminEventMapComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class EventSharedModule { }
