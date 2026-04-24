import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AdminEventsComponent } from './pages/admin-events/admin-events.component';
import { AdminEventDetailComponent } from './pages/admin-event-detail/admin-event-detail.component';
import { EventFormComponent } from '../host/components/event-form/event-form.component';

const routes: Routes = [
  { path: '', component: AdminEventsComponent },
  { path: 'create', component: EventFormComponent },
  { path: 'edit/:id', component: EventFormComponent },
  { path: ':id', component: AdminEventDetailComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminEventsRoutingModule { }