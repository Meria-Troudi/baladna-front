import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'baladna-frontend';

  constructor(
    private router: Router,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit(): void {
    this.applyRouteShellClass(this.router.url);

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.applyRouteShellClass((event as NavigationEnd).urlAfterRedirects);
      });
  }

  private applyRouteShellClass(url: string): void {
    const normalizedUrl = url || '';
    const isHostRoute = normalizedUrl.startsWith('/host');

    this.document.documentElement.classList.toggle('route-host-shell', isHostRoute);

    if (this.document.body) {
      this.document.body.classList.toggle('route-host-shell', isHostRoute);
    }
  }
}
