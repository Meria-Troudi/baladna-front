import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { EventSharedModule } from '../event-shared.module';

import { AdminEventsRoutingModule } from './admin-events-routing.module';

import { AdminEventsComponent } from './pages/admin-events/admin-events.component';
import { AdminEventDetailComponent } from './pages/admin-event-detail/admin-event-detail.component';
import { EventFormComponent } from '../host/components/event-form/event-form.component';


@NgModule({
  declarations: [
    AdminEventsComponent,
    AdminEventDetailComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    SharedModule,
    AdminEventsRoutingModule,
    EventSharedModule, // ALL SHARED EVENT COMPONENTS
    EventFormComponent // STANDALONE
  ]
})
export class AdminEventsModule { }