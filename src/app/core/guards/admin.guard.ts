// src/app/core/guards/admin.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../../features/auth/services/auth.service';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (this.authService.isAdmin()) return true;
    this.router.navigate(['/profile']);
    return false;
  }
}