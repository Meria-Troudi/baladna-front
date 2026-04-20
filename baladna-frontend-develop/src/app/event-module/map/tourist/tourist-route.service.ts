import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TouristRouteService {
  getUserLocation(): Promise<GeolocationCoordinates> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject('Geolocation not supported');
      }
      navigator.geolocation.getCurrentPosition(
        pos => resolve(pos.coords),
        err => reject(err)
      );
    });
  }

  getRoute(userLat: number, userLng: number, eventLat: number, eventLng: number) {
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${userLng},${userLat};${eventLng},${eventLat}` +
      `?overview=full&geometries=geojson`;

    return fetch(url).then(res => res.json());
  }
}
