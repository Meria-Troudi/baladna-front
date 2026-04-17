import { Injectable, EventEmitter } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet.markercluster';

@Injectable({ providedIn: 'root' })
export class MarkerLayerService {

  private map!: L.Map;
  private clusterGroup = (L as any).markerClusterGroup();

  // Public event emitters
  public onMarkerClick = new EventEmitter<any>();
  public onMarkerHover = new EventEmitter<any>();
  public onMarkerHoverOut = new EventEmitter<void>();

  init(map: L.Map): void {
    this.map = map;
    this.map.addLayer(this.clusterGroup);
  }

  render(items: any[]): void {
    this.clusterGroup.clearLayers();

    items
      .filter(i => i.latitude && i.longitude)
      .forEach(item => {

        const marker = L.marker([item.latitude, item.longitude]);

        marker.on('click', () => {
          this.onMarkerClick.emit(item);
        });

        marker.on('mouseover', () => {
          this.onMarkerHover.emit(item);
        });

        marker.on('mouseout', () => {
          this.onMarkerHoverOut.emit();
        });

        marker.bindTooltip(item.title || 'Item');

        this.clusterGroup.addLayer(marker);
      });
  }

  clear(): void {
    this.clusterGroup.clearLayers();
  }

  destroy(): void {
    if (this.map) {
      this.map.removeLayer(this.clusterGroup);
    }
  }
}