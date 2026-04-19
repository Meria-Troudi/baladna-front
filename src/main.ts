// Polyfills for SockJS and other Node.js modules in browser environment
(window as any).global = window;
(window as any).process = { env: { NODE_ENV: 'development' } };

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';

platformBrowserDynamic().bootstrapModule(AppModule, {
  ngZoneEventCoalescing: true
})
  .catch(err => console.error(err));
