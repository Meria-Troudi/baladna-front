import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HostEventsComponent } from './pages/host-events/host-events.component';
import { EventFormComponent } from './components/event-form/event-form.component';
import { HostEventReservationsComponent } from './components/host-event-reservations/host-event-reservations.component';

const routes: Routes = [
  { path: '', component: HostEventsComponent },
  { path: 'create', component: EventFormComponent },
  { path: 'edit/:id', component: EventFormComponent },
  { path: ':id/reservations', component: HostEventReservationsComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HostEventsRoutingModule { }