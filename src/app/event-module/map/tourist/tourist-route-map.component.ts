import { Component, Input, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import * as L from 'leaflet';
import { TouristRouteService } from './tourist-route.service';

@Component({
  selector: 'app-tourist-route-map',
  templateUrl: './tourist-route-map.component.html',
  styleUrls: ['./tourist-route-map.component.css']
})
export class TouristRouteMapComponent implements OnInit, AfterViewInit, OnDestroy {

  @Input() eventLat!: number;
  @Input() eventLng!: number;

  mapReady = false;
  private map!: L.Map;
  private userMarker!: L.Marker;
  private eventMarker!: L.Marker;
  private routeLine!: L.Polyline;

  loading = true;
  distanceKm: number | null = null;
  durationMin: number | null = null;

  constructor(private routeService: TouristRouteService) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.mapReady = true;
      setTimeout(() => {
        this.initMap();
        this.loadRoute();
      }, 0);
    });
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  private initMap(): void {
    this.map = L.map('tourist-map', {
      zoomControl: true
    }).setView([36.8, 10.2], 12); // fallback Tunis

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(this.map);
  }

  private async reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
      );
      const data = await res.json();
      return data?.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    } catch {
      return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
  }

  private async loadRoute(): Promise<void> {
    try {
      const user = await this.routeService.getUserLocation();

      const userLatLng: [number, number] = [user.latitude, user.longitude];
      const eventLatLng: [number, number] = [this.eventLat, this.eventLng];

      // Reverse geocode both points
      const [userLabel, eventLabel] = await Promise.all([
        this.reverseGeocode(user.latitude, user.longitude),
        this.reverseGeocode(this.eventLat, this.eventLng)
      ]);

      // markers with real addresses
      L.marker(userLatLng).addTo(this.map).bindPopup(userLabel).openPopup();
      L.marker(eventLatLng).addTo(this.map).bindPopup(eventLabel);

      // call real route API
      const data = await this.routeService.getRoute(
        user.latitude,
        user.longitude,
        this.eventLat,
        this.eventLng
      );

      const route = data.routes?.[0];

      if (!route) return;

      // Save distance (meters) and duration (seconds)
      this.distanceKm = route.distance ? Math.round(route.distance / 100) / 10 : null; // 1 decimal km
      this.durationMin = route.duration ? Math.round(route.duration / 60) : null; // minutes

      const coordinates = route.geometry.coordinates;

      // OSRM returns [lng, lat] → convert to [lat, lng]
      const latLngs = coordinates.map((c: any) => [c[1], c[0]]);

      // draw real road path
      L.polyline(latLngs, {
        color: '#C0503A',
        weight: 5
      }).addTo(this.map);

      // fit map to route
      this.map.fitBounds(L.latLngBounds(latLngs), {
        padding: [40, 40]
      });

      setTimeout(() => {
        this.map.invalidateSize();
      }, 200);

    } catch (err) {
      console.error('Location error:', err);
    } finally {
      this.loading = false;
    }
  }

}