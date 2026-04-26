/* cspell:ignore latlng */
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  Output,
  PLATFORM_ID,
  SimpleChanges,
  ViewChild,
  inject
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import * as L from 'leaflet';

export interface StationMarker {
  id?: number;
  name: string;
  city?: string;
  latitude?: number;
  longitude?: number;
}

@Component({
  selector: 'app-transport-map',
  templateUrl: './transport-map.component.html',
  styleUrls: ['./transport-map.component.css']
})
export class TransportMapComponent implements AfterViewInit, OnChanges, OnDestroy {
  private static readonly TUNISIA_BOUNDS = L.latLngBounds(
    L.latLng(30.0, 7.0),
    L.latLng(37.6, 11.8)
  );

  @Input() departureLat?: number | null;
  @Input() departureLng?: number | null;
  @Input() arrivalLat?: number | null;
  @Input() arrivalLng?: number | null;
  @Input() routeGeoJson?: string | null;
  @Input() height = 260;
  @Input() selectable = false;
  @Input() selectedLat?: number | null;
  @Input() selectedLng?: number | null;
  @Input() emptyStateCenterLat = 36.8065;
  @Input() emptyStateCenterLng = 10.1815;
  @Input() emptyStateZoom = 10;
  @Input() stationMarkers: StationMarker[] = [];

  @Output() coordinateSelected = new EventEmitter<{ lat: number; lng: number }>();

  @ViewChild('mapContainer', { static: false }) mapContainer?: ElementRef<HTMLDivElement>;

  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);

  private map?: L.Map;
  private routeLayer?: L.FeatureGroup;
  private markersLayer?: L.LayerGroup;
  private selectionLayer?: L.LayerGroup;
  private stationsLayer?: L.LayerGroup;
  private mapClickHandler?: (event: L.LeafletMouseEvent) => void;
  private viewInitialized = false;

  ngAfterViewInit(): void {
    this.viewInitialized = true;
    this.renderMap();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.viewInitialized) return;

    if (
      changes['departureLat'] ||
      changes['departureLng'] ||
      changes['arrivalLat'] ||
      changes['arrivalLng'] ||
      changes['routeGeoJson'] ||
      changes['selectedLat'] ||
      changes['selectedLng'] ||
      changes['selectable'] ||
      changes['stationMarkers'] ||
      changes['height']
    ) {
      this.renderMap();
    }
  }

  ngOnDestroy(): void {
    this.unbindSelectionClick();
    this.map?.remove();
  }

  get mapHeight(): string {
    return `${this.height}px`;
  }

  get hasValidCoordinates(): boolean {
    return this.isValidCoordinatePair(this.departureLat, this.departureLng)
      && this.isValidCoordinatePair(this.arrivalLat, this.arrivalLng);
  }

  private renderMap(): void {
    if (!isPlatformBrowser(this.platformId) || !this.mapContainer) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      if (!this.map) {
        this.map = L.map(this.mapContainer!.nativeElement, {
          zoomControl: true,
          attributionControl: true,
          maxBounds: TransportMapComponent.TUNISIA_BOUNDS,
          maxBoundsViscosity: 1
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(this.map);
      }

      this.syncSelectionClickBinding();

      this.routeLayer?.remove();
      this.markersLayer?.remove();
      this.selectionLayer?.remove();
      this.stationsLayer?.remove();

      this.routeLayer = undefined;
      this.markersLayer = undefined;
      this.selectionLayer = undefined;
      this.stationsLayer = undefined;

      const boundsPoints: L.LatLng[] = [];
      const geoJson = this.parseRouteGeoJson();
      const departure = this.hasValidCoordinates ? L.latLng(this.departureLat!, this.departureLng!) : null;
      const arrival = this.hasValidCoordinates ? L.latLng(this.arrivalLat!, this.arrivalLng!) : null;

      if (this.stationMarkers.length > 0) {
        const stationLayers: L.Layer[] = [];

        for (const station of this.stationMarkers) {
          if (!this.isValidCoordinatePair(station.latitude, station.longitude)) continue;

          const lat = station.latitude!;
          const lng = station.longitude!;
          const point = L.latLng(lat, lng);
          const label = station.city ? `${station.name} (${station.city})` : station.name;

          const marker = L.circleMarker(point, {
            radius: 6,
            color: '#1d4ed8',
            fillColor: '#3b82f6',
            fillOpacity: 0.85,
            weight: 2
          }).bindPopup(
            `<strong>${label}</strong><br><small>${lat.toFixed(4)}, ${lng.toFixed(4)}</small>`
          );

          stationLayers.push(marker);
          boundsPoints.push(point);
        }

        if (stationLayers.length > 0) {
          this.stationsLayer = L.layerGroup(stationLayers).addTo(this.map);
        }
      }

      const compactMap = this.height <= 240;
      const routeHaloWeight = compactMap ? 6 : 9;
      const routeMainWeight = compactMap ? 3 : 5;

      if (geoJson) {
        const routeHalo = L.geoJSON(geoJson, {
          style: {
            color: '#ffffff',
            weight: routeHaloWeight,
            opacity: 0.82,
            lineCap: 'round',
            lineJoin: 'round'
          }
        });
        const routeMain = L.geoJSON(geoJson, {
          style: {
            color: '#2563eb',
            weight: routeMainWeight,
            opacity: 0.98,
            lineCap: 'round',
            lineJoin: 'round'
          }
        });

        this.routeLayer = L.featureGroup([routeHalo, routeMain]).addTo(this.map);

        const routeBounds = this.routeLayer.getBounds();
        if (routeBounds.isValid()) {
          boundsPoints.push(routeBounds.getNorthEast(), routeBounds.getSouthWest());
        }
      } else if (departure && arrival) {
        const fallbackHalo = L.polyline([departure, arrival], {
          color: '#ffffff',
          weight: compactMap ? 5 : 8,
          opacity: 0.82,
          lineCap: 'round',
          lineJoin: 'round'
        });
        const fallbackLine = L.polyline([departure, arrival], {
          color: '#f59e0b',
          weight: compactMap ? 3 : 4,
          opacity: 0.96,
          dashArray: '10 8',
          lineCap: 'round',
          lineJoin: 'round'
        });

        this.routeLayer = L.featureGroup([fallbackHalo, fallbackLine]).addTo(this.map);

        const fallbackBounds = this.routeLayer.getBounds();
        if (fallbackBounds.isValid()) {
          boundsPoints.push(fallbackBounds.getNorthEast(), fallbackBounds.getSouthWest());
        }
      }

      if (departure && arrival) {
        this.markersLayer = L.layerGroup([
          L.circleMarker(departure, {
            radius: 8,
            color: '#15803d',
            fillColor: '#22c55e',
            fillOpacity: 0.95,
            weight: 3
          }).bindPopup('Departure station'),
          L.circleMarker(arrival, {
            radius: 8,
            color: '#b91c1c',
            fillColor: '#ef4444',
            fillOpacity: 0.95,
            weight: 3
          }).bindPopup('Arrival station')
        ]).addTo(this.map);

        boundsPoints.push(departure, arrival);
      }

      if (this.selectable && this.isValidCoordinatePair(this.selectedLat, this.selectedLng)) {
        const selectedPoint = L.latLng(this.selectedLat!, this.selectedLng!);
        this.selectionLayer = L.layerGroup([
          L.circleMarker(selectedPoint, {
            radius: 9,
            color: '#1d4ed8',
            fillColor: '#60a5fa',
            fillOpacity: 0.95,
            weight: 3
          }).bindPopup('Selected station position')
        ]).addTo(this.map);

        boundsPoints.push(selectedPoint);
      }

      if (boundsPoints.length >= 2) {
        const fitPadding: [number, number] = compactMap ? [28, 28] : [42, 42];
        const maxZoom = compactMap ? 11 : 12;
        this.map.fitBounds(L.latLngBounds(boundsPoints).pad(0.28), { padding: fitPadding, maxZoom });
      } else if (boundsPoints.length === 1) {
        this.map.setView(boundsPoints[0], 13);
      } else {
        this.map.setView([this.emptyStateCenterLat, this.emptyStateCenterLng], this.emptyStateZoom);
      }

      setTimeout(() => this.map?.invalidateSize(), 0);
    });
  }

  private parseRouteGeoJson(): GeoJSON.GeoJsonObject | GeoJSON.GeoJsonObject[] | null {
    if (!this.routeGeoJson) return null;

    try {
      const parsed = JSON.parse(this.routeGeoJson) as GeoJSON.GeoJsonObject | GeoJSON.GeoJsonObject[] | null;
      if (Array.isArray(parsed)) {
        return parsed.every((item) => !!item && typeof item === 'object' && 'type' in item) ? parsed : null;
      }
      return parsed && typeof parsed === 'object' && 'type' in parsed ? parsed : null;
    } catch {
      return null;
    }
  }

  private isValidCoordinatePair(lat?: number | null, lng?: number | null): boolean {
    return this.isValidLatitude(lat)
      && this.isValidLongitude(lng)
      && TransportMapComponent.TUNISIA_BOUNDS.contains(L.latLng(lat, lng));
  }

  private isValidLatitude(value?: number | null): value is number {
    return typeof value === 'number' && Number.isFinite(value) && value >= -90 && value <= 90;
  }

  private isValidLongitude(value?: number | null): value is number {
    return typeof value === 'number' && Number.isFinite(value) && value >= -180 && value <= 180;
  }

  private syncSelectionClickBinding(): void {
    if (!this.map) return;

    if (this.selectable) {
      if (!this.mapClickHandler) {
        this.mapClickHandler = (event: L.LeafletMouseEvent) => {
          const { lat, lng } = event.latlng;
          if (!TransportMapComponent.TUNISIA_BOUNDS.contains(event.latlng)) return;

          this.ngZone.run(() => {
            this.coordinateSelected.emit({
              lat: Number(lat.toFixed(6)),
              lng: Number(lng.toFixed(6))
            });
          });
        };
        this.map.on('click', this.mapClickHandler);
      }
      return;
    }

    this.unbindSelectionClick();
  }

  private unbindSelectionClick(): void {
    if (this.map && this.mapClickHandler) {
      this.map.off('click', this.mapClickHandler);
    }
    this.mapClickHandler = undefined;
  }
}