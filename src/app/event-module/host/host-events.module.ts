import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { EventSharedModule } from '../event-shared.module';

import { HostEventsRoutingModule } from './host-events-routing.module';

import { HostEventsComponent } from './pages/host-events/host-events.component';
import { EventFormComponent } from './components/event-form/event-form.component';

@NgModule({
  declarations: [
    HostEventsComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    SharedModule,
    HostEventsRoutingModule,
    EventSharedModule, // ALL SHARED EVENT COMPONENTS
    EventFormComponent // STANDALONE
  ]
})
export class HostEventsModule { }