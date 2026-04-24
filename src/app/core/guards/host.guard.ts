// src/app/core/guards/host.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../../features/auth/services/auth.service';

@Injectable({ providedIn: 'root' })
export class HostGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (this.authService.isHost()) return true;
    if (this.authService.isAdmin()) {
      this.router.navigate(['/admin/dashboard']);
    } else {
      this.router.navigate(['/tourist/dashboard']);
    }
    return false;
  }
}
