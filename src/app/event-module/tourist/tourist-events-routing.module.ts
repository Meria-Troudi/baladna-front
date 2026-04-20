import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { TouristReservationsComponent } from './components/tourist-reservations/tourist-reservations.component';
import { TouristEventsComponent } from './pages/tourist-events/tourist-events.component';
import { EventsListComponent } from './pages/events-list/events-list.component';
import { EventReviewsPageComponent } from './pages/event-reviews-page/event-reviews-page.component';
import { QrReservationComponent } from './components/qr-reservation/qr-reservation.component';
import { EventDetailViewComponent } from '../shared/event-detail-view/event-detail-view.component';

const routes: Routes = [
  { path: '', component: TouristEventsComponent },
  { path: 'list', component: EventsListComponent },
  { path: ':id', component: EventDetailViewComponent },
  { path: ':id/reviews', component: EventReviewsPageComponent },
  { path: 'reservations', component: TouristReservationsComponent },
  { path: 'reservation/:id', component: QrReservationComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TouristEventsRoutingModule { }