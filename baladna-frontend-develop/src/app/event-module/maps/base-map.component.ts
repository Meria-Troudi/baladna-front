import {
  Component,
  AfterViewInit,
  ElementRef,
  ViewChild,
  Input,
  OnChanges,
  SimpleChanges,
  OnDestroy
} from '@angular/core';

import * as L from 'leaflet';
import 'leaflet.markercluster';
import { MarkerLayerService } from './layers/marker-layer.service';
import { MapUiStateService } from './state/map-ui-state.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-base-map',
  templateUrl: './base-map.component.html',
  styleUrls: ['./base-map.component.css']
})
export class BaseMapComponent implements AfterViewInit, OnChanges, OnDestroy {

  @Input() items: any[] = [];
  @Input() center: [number, number] = [36.8, 10.2];
  @Input() zoom = 7;

  @ViewChild('map', { static: true }) mapElement!: ElementRef;

  private map!: L.Map;
  private subscriptions = new Subscription();

  constructor(
    private markerLayer: MarkerLayerService,
    private uiState: MapUiStateService
  ) {}

  ngAfterViewInit(): void {
    this.initMap();
    this.markerLayer.init(this.map);
    this.setupBridge();
    this.render();

    setTimeout(() => {
      this.map.invalidateSize();
    }, 200);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.map && changes['items']) {
      this.render();
    }
  }

  private initMap(): void {
    this.map = L.map(this.mapElement.nativeElement).setView(this.center, this.zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(this.map);
  }

  private setupBridge(): void {
    // Connect Marker Layer → UI State Service
    this.subscriptions.add(
      this.markerLayer.onMarkerClick.subscribe(item => {
        this.uiState.setSelected(item);
      })
    );

    this.subscriptions.add(
      this.markerLayer.onMarkerHover.subscribe(item => {
        this.uiState.setHovered(item);
      })
    );

    this.subscriptions.add(
      this.markerLayer.onMarkerHoverOut.subscribe(() => {
        this.uiState.resetHover();
      })
    );
  }

  private render(): void {
    this.markerLayer.render(this.items);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.markerLayer.destroy();
  }
}