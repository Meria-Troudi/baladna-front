import {
  Component,
  ElementRef,
  EventEmitter,
  Output,
  ViewChild,
  AfterViewInit,
  Input
} from '@angular/core';

import * as L from 'leaflet';

@Component({
  selector: 'app-host-map-picker',
  templateUrl: './host-map-picker.component.html',
  styleUrls: ['./host-map-picker.component.css']
})
export class HostMapPickerComponent implements AfterViewInit {

  @ViewChild('map', { static: true }) mapElement!: ElementRef;

  @Output() locationSelected = new EventEmitter<{
    lat: number;
    lng: number;
    label?: string;
  }>();


  @Input() latitude?: number;
  @Input() longitude?: number;

  private map!: L.Map;
  private marker: L.Marker | null = null;

  selectedLatLng: { lat: number; lng: number } | null = null;
  selectedLabel = '';
  resolvingLocation = false;

  // 🔍 SEARCH STATE
  searchQuery = '';
  suggestions: any[] = [];
  private debounceTimer: any;

  ngAfterViewInit(): void {
    this.initMap();
  }

  private initMap(): void {
    const initialLat = this.latitude ?? 36.8;
    const initialLng = this.longitude ?? 10.2;
    const initialZoom = (this.latitude && this.longitude) ? 13 : 7;

    this.map = L.map(this.mapElement.nativeElement).setView([initialLat, initialLng], initialZoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    if (this.latitude && this.longitude) {
      this.selectedLatLng = { lat: this.latitude, lng: this.longitude };
      this.marker = L.marker([this.latitude, this.longitude]).addTo(this.map);
    }

    // ✅ KEEP CLICK FUNCTIONALITY
    this.map.on('click', (e: any) => {
  const { lat, lng } = e.latlng;

  this.selectedLatLng = { lat, lng };
  this.selectedLabel = '';

  if (this.marker) {
    this.map.removeLayer(this.marker);
  }

  this.marker = L.marker([lat, lng], {
    riseOnHover: true
  }).addTo(this.map);

  // animation feel
  this.marker.setZIndexOffset(1000);
});

    setTimeout(() => this.map.invalidateSize(), 200);
  }

  // =============================
  // 🔍 SEARCH LOGIC (DEBOUNCE)
  // =============================
  private async searchLocation(): Promise<void> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&countrycodes=tn&q=${encodeURIComponent(this.searchQuery)}&limit=5&accept-language=fr`
    );

    this.suggestions = await res.json();
  } catch {
    this.suggestions = [];
  }
}
 onSearchChange(): void {
  clearTimeout(this.debounceTimer);

  if (!this.searchQuery || this.searchQuery.length < 3) {
    this.suggestions = [];
    return;
  }

  this.debounceTimer = setTimeout(() => {
    this.searchLocation();
  }, 300);
}

  private async searchPlaces(query: string): Promise<void> {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&countrycodes=tn&q=${encodeURIComponent(query)}&limit=5&accept-language=fr`
      );

      const data = await res.json();
      this.suggestions = data;
    } catch {
      this.suggestions = [];
    }
  }

  // =============================
  // 📍 SELECT FROM DROPDOWN
  // =============================
  selectSuggestion(s: any): void {
    const lat = parseFloat(s.lat);
    const lng = parseFloat(s.lon);

    this.selectedLatLng = { lat, lng };
    this.selectedLabel = s.display_name;

    this.map.setView([lat, lng], 15);

    // remove old marker
    if (this.marker) {
      this.map.removeLayer(this.marker);
    }

    // animated marker
    this.marker = L.marker([lat, lng], {
      riseOnHover: true
    }).addTo(this.map);

    // small animation effect
    setTimeout(() => {
      this.marker?.setZIndexOffset(1000);
    }, 100);

    this.suggestions = [];
    this.searchQuery = s.display_name;

    // Do NOT emit or close modal here; wait for user to confirm
  }

  // =============================
  // 📌 MARKER HANDLER
  // =============================
  private setMarker(lat: number, lng: number): void {
    this.selectedLatLng = { lat, lng };

    if (this.marker) {
      this.map.removeLayer(this.marker);
    }

    this.marker = L.marker([lat, lng]).addTo(this.map);
  }

  // =============================
  // ✅ CONFIRM
  // =============================
  confirmLocation(): void {
    if (!this.selectedLatLng) return;

    // if label already from search → use it
    if (this.selectedLabel) {
      this.locationSelected.emit({
        ...this.selectedLatLng,
        label: this.selectedLabel
      });
      return;
    }

    // otherwise reverse geocode
    this.emitSelectedLocation();
  }

  private async emitSelectedLocation(): Promise<void> {
    if (!this.selectedLatLng) return;

    const { lat, lng } = this.selectedLatLng;

    this.resolvingLocation = true;
    const label = await this.reverseGeocode(lat, lng);
    this.resolvingLocation = false;

    this.selectedLabel = label;

    this.locationSelected.emit({ lat, lng, label });
  }

  // =============================
  // 🔁 REVERSE GEOCODE
  // =============================
  private async reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=fr`
      );

      const data = await res.json();
      return data?.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    } catch {
      return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
  }

  // =============================
  clearSelection(): void {
    this.selectedLatLng = null;
    this.selectedLabel = '';
    this.searchQuery = '';
    this.suggestions = [];

    if (this.marker) {
      this.map.removeLayer(this.marker);
      this.marker = null;
    }
  }
}