import { Component, Input, OnChanges, SimpleChanges, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet.markercluster';

@Component({
  selector: 'app-event-map',
  templateUrl: './event-map.component.html',
  styleUrls: ['./event-map.component.css']
})
export class EventMapComponent implements AfterViewInit, OnChanges {

  @Input() events: any[] = [];
  @ViewChild('map', { static: true }) mapElement!: ElementRef;

  private map!: L.Map;
  private markers = (L as any).markerClusterGroup();

  ngAfterViewInit(): void {
    this.initMap();

    setTimeout(() => {
      this.map.invalidateSize();
    }, 200);

    this.renderMarkers();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.map && changes['events']) {
      this.renderMarkers();
    }
  }

  private initMap(): void {
    this.map = L.map(this.mapElement.nativeElement).setView([36.8, 10.2], 7); // Tunisia center

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.map.addLayer(this.markers);
  }

  private renderMarkers(): void {
    this.markers.clearLayers();

    this.events
      .filter(e => e.latitude && e.longitude)
      .forEach(event => {

        const marker = L.marker([event.latitude, event.longitude]);

        marker.bindPopup(this.createPopup(event));

        this.markers.addLayer(marker);
      });
  }

  private createPopup(event: any): string {
    return `
      <div style="min-width:200px">
        <h4>${event.title}</h4>
        <p>${event.location || ''}</p>
        <p>Status: ${event.status}</p>
        <p>Capacity: ${event.bookedSeats || 0}/${event.capacity}</p>
        <button onclick="window.dispatchEvent(new CustomEvent('view-event', {detail: ${event.id}}))">
          View
        </button>
      </div>
    `;
  }
}