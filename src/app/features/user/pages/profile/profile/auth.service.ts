import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ProfileAuthService {
  private token: string | null = null;
  private role: string | null = null;

  constructor() {
    this.token = localStorage.getItem('accessToken');
    this.role = localStorage.getItem('role');
  }

  getRole(): string {
    return this.role || 'TOURIST';
  }

  getCurrentUser(): { firstName: string; lastName: string; email: string } | null {
    const firstName = localStorage.getItem('firstName') || 'User';
    const lastName = localStorage.getItem('lastName') || 'Name';
    const email = localStorage.getItem('email') || 'user@example.com';
    return { firstName, lastName, email };
  }

  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('role');
    this.token = null;
    this.role = null;
  }

  isLoggedIn(): boolean {
    return !!this.token;
  }
}
