import {
  AfterViewInit,
  Component,
  NgZone,
  OnDestroy,
  OnInit
} from '@angular/core';
import { Router } from '@angular/router';
import * as L from 'leaflet';
import { AccommodationApiService } from '../../../accommodation/services/accommodation-api.service';
import {
  Accommodation,
  AccommodationType
} from '../../../accommodation/models/accommodation.types';

@Component({
  selector: 'app-tourist-accommodations',
  templateUrl: './tourist-accommodations.component.html',
  styleUrls: ['./tourist-accommodations.component.css']
})
export class TouristAccommodationsComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  destination = '';
  intention = '';
  /** City / place / keyword (title, address, description). */
  cityOrPlace = '';
  /** Style & atmosphere (description, amenities, rules, title). */
  styleFilter = '';
  /** Empty string = any type. */
  typeFilter: AccommodationType | '' = '';
  /** Only show listings whose pin lies inside the current map view. */
  limitToMapViewport = false;

  suggestions: Accommodation[] = [];
  /** Full list from API (all host-visible statuses). */
  allAccommodations: Accommodation[] = [];
  loadingMap = false;
  loadingStays = false;
  loadingSuggestions = false;
  staysLoadNotice: string | null = null;

  /** Free-text trip description for AI / keyword matching. */
  tripDescription = '';
  tripSuggestLoading = false;
  tripSuggestErr: string | null = null;
  tripSuggestNote: string | null = null;
  tripSuggestMode: 'gemini' | 'keyword' | null = null;

  intentionPresets = ['beach', 'desert', 'family', 'quiet', 'medina', 'nature'];

  typeFilterOptions: { value: AccommodationType | ''; label: string }[] = [
    { value: '', label: 'All types' },
    { value: 'GUEST_HOUSE', label: 'Guest house' },
    { value: 'CAMPING', label: 'Camping' },
    { value: 'APARTMENT', label: 'Apartment' },
    { value: 'FARM', label: 'Farm stay' },
    { value: 'OTHER', label: 'Other' }
  ];

  private map: L.Map | null = null;
  private markerLayer: L.LayerGroup | null = null;
  /** Fit map to markers once after first successful load. */
  private shouldFitBoundsAfterLoad = true;

  constructor(
    private api: AccommodationApiService,
    private router: Router,
    private zone: NgZone
  ) {}

  ngOnInit(): void {
    this.loadStays();
  }

  ngAfterViewInit(): void {
    this.fixLeafletIcons();
    setTimeout(() => this.initMap(), 0);
  }

  ngOnDestroy(): void {
    this.map?.remove();
    this.map = null;
  }

  /** Listings after city / type / style / optional map viewport filters. */
  get filteredAccommodations(): Accommodation[] {
    return this.applyFilters(this.allAccommodations);
  }

  get filteredMapPins(): Accommodation[] {
    return this.filteredAccommodations.filter(
      (a) => a.latitude != null && a.longitude != null
    );
  }

  private fixLeafletIcons(): void {
    const proto = L.Icon.Default.prototype as unknown as { _getIconUrl?: string };
    delete proto._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
    });
  }

  private initMap(): void {
    const el = document.getElementById('acc-map');
    if (!el || this.map) return;

    this.map = L.map('acc-map').setView([34.08892, 9.56154], 6.5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    this.markerLayer = L.layerGroup().addTo(this.map);
    this.renderMarkers();

    this.map.on('moveend', () => {
      this.zone.run(() => {
        if (this.limitToMapViewport) {
          this.renderMarkers();
        }
      });
    });
  }

  loadStays(): void {
    this.loadingStays = true;
    this.loadingMap = true;
    this.staysLoadNotice = null;
    this.shouldFitBoundsAfterLoad = true;
    this.api.listAll().subscribe({
      next: (list) => {
        this.allAccommodations = list;
        this.loadingStays = false;
        this.loadingMap = false;
        this.renderMarkers();
        this.applyFiltersToSuggestions();
      },
      error: (err) => {
        this.allAccommodations = [];
        this.suggestions = [];
        this.loadingStays = false;
        this.loadingMap = false;
        this.staysLoadNotice = this.friendlyStaysError(err);
        this.renderMarkers();
      }
    });
  }

  private friendlyStaysError(err: unknown): string {
    const http = err as {
      status?: number;
      error?: { message?: string; error?: string } | string;
    };
    const status = http?.status;
    const serverMsg = this.extractServerMessage(http);

    if (status === 0 || status === undefined) {
      return "We can't connect right now. Check your internet connection, wait a moment, and use Refresh below.";
    }
    if (status === 403 || status === 401) {
      return 'Please sign in again to browse stays.';
    }
    if (serverMsg) {
      return serverMsg;
    }
    if (status != null && status >= 500) {
      return 'Our service is temporarily busy. Please try again in a few minutes.';
    }
    return "We couldn't load stays just now. Please try again shortly.";
  }

  /** Use API JSON { message } when it looks safe for end users (no stack traces). */
  private extractServerMessage(http: {
    error?: { message?: string; error?: string } | string;
  }): string | null {
    let raw: string | undefined;
    if (typeof http.error === 'string') {
      raw = http.error;
    } else if (http.error && typeof http.error === 'object') {
      raw = http.error.message || http.error.error;
    }
    if (!raw || typeof raw !== 'string') {
      return null;
    }
    const t = raw.trim();
    if (t.length === 0 || t.length > 400) {
      return null;
    }
    if (
      t.includes('\tat ') ||
      t.includes('org.springframework') ||
      t.includes('java.') ||
      t.includes('SQLException')
    ) {
      return null;
    }
    return t;
  }

  /** Run search: sync suggestion API params, refresh carousel, update pins. */
  applySearch(): void {
    this.destination = this.cityOrPlace.trim();
    this.intention = this.styleFilter.trim();
    this.applyFiltersToSuggestions();
    this.shouldFitBoundsAfterLoad = false;
    this.renderMarkers();
  }

  clearFilters(): void {
    this.cityOrPlace = '';
    this.styleFilter = '';
    this.typeFilter = '';
    this.limitToMapViewport = false;
    this.destination = '';
    this.intention = '';
    this.applyFiltersToSuggestions();
    this.shouldFitBoundsAfterLoad = false;
    this.renderMarkers();
  }

  private applyFiltersToSuggestions(): void {
    this.loadingSuggestions = true;
    this.api
      .suggestions(
        this.destination.trim() || undefined,
        this.intention.trim() || undefined
      )
      .subscribe({
        next: (list) => {
          const fb =
            list.length > 0
              ? list
              : this.filteredAccommodations.slice(0, 12);
          this.suggestions = this.intersectWithLocalFilters(fb);
          this.loadingSuggestions = false;
        },
        error: () => {
          this.suggestions = this.filteredAccommodations.slice(0, 12);
          this.loadingSuggestions = false;
        }
      });
  }

  /** Keep server suggestions that still match type / map filters. */
  private intersectWithLocalFilters(list: Accommodation[]): Accommodation[] {
    const allowed = new Set(this.filteredAccommodations.map((a) => a.id));
    const kept = list.filter((a) => allowed.has(a.id));
    return kept.length > 0 ? kept : this.filteredAccommodations.slice(0, 12);
  }

  private applyFilters(list: Accommodation[]): Accommodation[] {
    let out = [...list];
    const q = this.cityOrPlace.trim().toLowerCase();
    if (q) {
      out = out.filter((a) => {
        const hay = `${a.title} ${a.address} ${a.description ?? ''}`
          .trim()
          .toLowerCase();
        return hay.includes(q);
      });
    }
    if (this.typeFilter) {
      out = out.filter((a) => a.type === this.typeFilter);
    }
    const st = this.styleFilter.trim().toLowerCase();
    if (st) {
      const tokens = st
        .split(/[,;\s]+/)
        .map((t) => t.trim())
        .filter((t) => t.length > 2);
      if (tokens.length > 0) {
        out = out.filter((a) => {
          const hay = `${a.title} ${a.description ?? ''} ${a.amenities ?? ''} ${a.rules ?? ''}`
            .toLowerCase();
          return tokens.some((t) => hay.includes(t));
        });
      }
    }
    if (this.limitToMapViewport && this.map) {
      const b = this.map.getBounds();
      out = out.filter((a) => {
        if (a.latitude == null || a.longitude == null) return false;
        return b.contains(L.latLng(Number(a.latitude), Number(a.longitude)));
      });
    }
    return out;
  }

  refreshSuggestions(): void {
    this.applyFiltersToSuggestions();
  }

  setIntention(word: string): void {
    this.intention = word;
    this.styleFilter = word;
    this.applyFiltersToSuggestions();
    this.shouldFitBoundsAfterLoad = false;
    this.renderMarkers();
  }

  fitMapToFilteredPins(): void {
    if (!this.map) return;
    const pts = this.filteredMapPins
      .filter((a) => a.latitude != null && a.longitude != null)
      .map((a) => [Number(a.latitude), Number(a.longitude)] as L.LatLngTuple);
    if (pts.length === 0) return;
    const bounds = L.latLngBounds(pts);
    if (bounds.isValid()) {
      this.map.fitBounds(bounds.pad(0.12));
    }
  }

  /** Safe image URL for Leaflet HTML (attribute in double quotes). */
  private safeUrlForMap(u: string): string {
    if (!u) return '';
    return encodeURI(u).replace(/"/g, '%22');
  }

  private coverPhotoIcon(imageUrl: string): L.DivIcon {
    const src = this.safeUrlForMap(imageUrl);
    return L.divIcon({
      className: 'acc-map-pin-root',
      html: `<div class="acc-map-pin"><img src="${src}" alt="" loading="lazy" decoding="async" /></div>`,
      iconSize: [54, 54],
      iconAnchor: [27, 54],
      popupAnchor: [0, -46]
    });
  }

  private renderMarkers(): void {
    if (!this.map || !this.markerLayer) return;
    this.markerLayer.clearLayers();

    for (const acc of this.filteredMapPins) {
      if (acc.latitude == null || acc.longitude == null) continue;
      const lat = Number(acc.latitude);
      const lng = Number(acc.longitude);
      const img =
        acc.coverImageUrl ||
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80';
      const safeTitle = acc.title.replace(/</g, '').replace(/"/g, '');
      const btnId = `acc-go-${acc.id.replace(/[^a-zA-Z0-9-]/g, '')}`;

      const html = `
        <div class="leaflet-acc-popup">
          <img src="${this.safeUrlForMap(img)}" alt="" />
          <div class="leaflet-acc-popup-body">
            <strong>${safeTitle}</strong>
            <p>${acc.address}</p>
            <button type="button" class="leaflet-acc-btn" id="${btnId}">Voir la fiche</button>
          </div>
        </div>`;

      const m = L.marker([lat, lng], { icon: this.coverPhotoIcon(img) }).bindPopup(
        html,
        { minWidth: 220 }
      );
      m.on('popupopen', () => {
        const btn = document.getElementById(btnId);
        btn?.addEventListener('click', () => {
          this.zone.run(() =>
            this.router.navigate(['/tourist/accommodations', acc.id])
          );
        });
      });
      m.addTo(this.markerLayer);
    }

    const pts = this.filteredMapPins
      .filter((a) => a.latitude != null && a.longitude != null)
      .map((a) => [Number(a.latitude), Number(a.longitude)] as L.LatLngTuple);
    if (this.shouldFitBoundsAfterLoad && pts.length > 0) {
      const bounds = L.latLngBounds(pts);
      if (bounds.isValid()) {
        this.map.fitBounds(bounds.pad(0.15));
        this.shouldFitBoundsAfterLoad = false;
      }
    }
  }

  goDetail(id: string): void {
    this.router.navigate(['/tourist/accommodations', id]);
  }

  typeLabel(type: string): string {
    const map: Record<string, string> = {
      GUEST_HOUSE: 'Guest house',
      CAMPING: 'Camping',
      APARTMENT: 'Apartment',
      FARM: 'Farm stay',
      OTHER: 'Other'
    };
    return map[type] || type;
  }

  statusLabel(status: string): string {
    const m: Record<string, string> = {
      ACTIVE: 'Live',
      INACTIVE: 'Paused',
      DRAFT: 'Draft'
    };
    return m[status] || status;
  }

  retryLoad(): void {
    this.loadStays();
  }

  runTripSuggest(): void {
    const text = this.tripDescription.trim();
    if (!text) {
      this.tripSuggestErr = 'Describe your trip in a few words (places, style, group size…).';
      return;
    }
    this.tripSuggestLoading = true;
    this.tripSuggestErr = null;
    this.tripSuggestNote = null;
    this.tripSuggestMode = null;
    this.api.tripSuggest({ description: text }).subscribe({
      next: (res) => {
        this.tripSuggestLoading = false;
        this.tripSuggestNote = res.note ?? null;
        this.tripSuggestMode = res.mode;
        const list = res.accommodations ?? [];
        const allowed = new Set(this.filteredAccommodations.map((a) => a.id));
        const filtered = list.filter((a) => allowed.has(a.id));
        this.suggestions = filtered.length > 0 ? filtered : list;
        this.shouldFitBoundsAfterLoad = false;
        this.renderMarkers();
      },
      error: (e) => {
        this.tripSuggestLoading = false;
        this.tripSuggestErr =
          (e?.error?.message as string) || 'Could not get suggestions. Try again or use filters above.';
      }
    });
  }
}
