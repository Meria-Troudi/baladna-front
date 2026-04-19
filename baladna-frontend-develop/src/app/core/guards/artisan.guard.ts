// src/app/core/guards/artisan.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../../features/auth/services/auth.service';

@Injectable({ providedIn: 'root' })
export class ArtisanGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    const role = this.authService.getRole();
    if (role === 'ARTISAN') return true;
    if (this.authService.isAdmin()) {
      this.router.navigate(['/admin/dashboard']);
    } else if (this.authService.isHost()) {
      this.router.navigate(['/host/dashboard']);
    } else if (this.authService.isTourist()) {
      this.router.navigate(['/tourist/dashboard']);
    } else {
      this.router.navigate(['/']);
    }
    return false;
  }
}
