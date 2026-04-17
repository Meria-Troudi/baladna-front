import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MapUiStateService } from '../maps/state/map-ui-state.service';

@Component({
  selector: 'app-admin-event-map',
  template: '<app-base-map [items]="events"></app-base-map>'
})
export class AdminEventMapComponent implements OnInit, OnDestroy {

  @Input() events: any[] = [];
  private subscriptions = new Subscription();

  constructor(
    private router: Router,
    private uiState: MapUiStateService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.uiState.selected$.subscribe((event: any) => {
        if (event) {
          this.openEventDetail(event);
        }
      })
    );
  }

  openEventDetail(event: any): void {
    this.router.navigate(['/admin/events', event.id]);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.uiState.resetSelection();
    this.uiState.resetHover();
  }
}