import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MapUiStateService } from './state/map-ui-state.service';

@Component({
  selector: 'app-admin-event-map',
  template: '<app-event-map [events]="events"></app-event-map>'
})
export class AdminEventMapComponent implements OnInit, OnDestroy {

  @Input() events: any[] = [];
  private subscriptions = new Subscription();
  private viewEventHandler = (e: Event) => {
    const id = (e as CustomEvent).detail;
    if (id != null) this.router.navigate(['/admin/events', id]);
  };

  constructor(
    private router: Router,
    private uiState: MapUiStateService
  ) {}

  ngOnInit(): void {
    // Popups in EventMapComponent dispatch 'view-event' on window on click.
    window.addEventListener('view-event', this.viewEventHandler);

    // Legacy selection channel (kept for compatibility with other maps).
    this.subscriptions.add(
      this.uiState.selected$.subscribe((event: any) => {
        if (event) this.router.navigate(['/admin/events', event.id]);
      })
    );
  }

  ngOnDestroy(): void {
    window.removeEventListener('view-event', this.viewEventHandler);
    this.subscriptions.unsubscribe();
    this.uiState.resetSelection();
    this.uiState.resetHover();
  }
}