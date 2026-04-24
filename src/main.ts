import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import * as L from 'leaflet';

import { AppModule } from './app/app.module';

// ✅ Fix Leaflet Icon Bug (MANDATORY FOR ANGULAR)
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'assets/marker-icon-2x.png',
  iconUrl: 'assets/marker-icon.png',
  shadowUrl: 'assets/marker-shadow.png',
});

platformBrowserDynamic().bootstrapModule(AppModule, {
  ngZoneEventCoalescing: true
})
  .catch(err => console.error(err));
