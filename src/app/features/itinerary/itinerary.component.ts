import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { ItineraryListComponent } from './pages/itinerary-list/itinerary-list.component';
import { ItineraryCreateComponent } from './pages/itinerary-create/itinerary-create.component';
import { ItineraryDetailComponent } from './pages/itinerary-detail/itinerary-detail.component';

const routes: Routes = [
  { path: '', component: ItineraryListComponent },
  { path: 'create', component: ItineraryCreateComponent },
  { path: ':id', component: ItineraryDetailComponent },
  { path: ':id/edit', component: ItineraryCreateComponent }
];

@NgModule({
  declarations: [
    ItineraryListComponent,
    ItineraryCreateComponent,
    ItineraryDetailComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule.forChild(routes)
  ]
})
export class ItineraryComponent {}