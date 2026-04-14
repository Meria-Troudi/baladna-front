import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest
} from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://localhost:8081/api/auth';

  constructor(private http: HttpClient, private router: Router) {}

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    console.log('[AuthService] POST /auth/register payload:', request);

    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, request).pipe(
      tap((res: AuthResponse) => {
        console.log('[AuthService] register success:', res);
        this.saveTokens(res);
      })
    );
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    console.log('[AuthService] POST /auth/login payload:', request);

    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, request).pipe(
      tap((res: AuthResponse) => {
        console.log('[AuthService] login success:', res);
        this.saveTokens(res);
      })
    );
  }

  logout(): void {
    console.log('[AuthService] logout called');

    const refreshToken = this.isBrowser() ? localStorage.getItem('refreshToken') : null;

    if (refreshToken) {
      this.http.post(
        `${this.apiUrl}/logout`,
        { refreshToken },
        { responseType: 'text' }
      ).subscribe({
        next: (response: string) => {
          console.log('[AuthService] logout API success:', response);
        },
        error: (error: unknown) => {
          console.error('[AuthService] logout API error:', error);
        }
      });
    }

    this.clearTokens();
    this.router.navigate(['/']);
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.isBrowser()
      ? localStorage.getItem('refreshToken') || ''
      : '';

    console.log('[AuthService] POST /auth/refresh-token');

    return this.http.post<AuthResponse>(
      `${this.apiUrl}/refresh-token`,
      { refreshToken }
    ).pipe(
      tap((res: AuthResponse) => {
        console.log('[AuthService] refresh token success:', res);
        this.saveTokens(res);
      })
    );
  }

  getAccessToken(): string | null {
    if (!this.isBrowser()) return null;
    return localStorage.getItem('accessToken');
  }

  getCurrentUser(): { firstName: string; lastName: string; email: string } | null {
    if (!this.isBrowser()) return null;

    const firstName = localStorage.getItem('firstName');
    const lastName = localStorage.getItem('lastName');
    const email = localStorage.getItem('email');

    if (!firstName || !lastName || !email) return null;

    return { firstName, lastName, email };
  }

  getRole(): string | null {
    if (!this.isBrowser()) return null;
    return localStorage.getItem('role');
  }

  isLoggedIn(): boolean {
    return !!this.getAccessToken();
  }

  isAdmin(): boolean {
    return this.getRole() === 'ADMIN';
  }

  isHost(): boolean {
    return this.getRole() === 'HOST';
  }

  isTourist(): boolean {
    return this.getRole() === 'TOURIST';
  }

  isArtisan(): boolean {
    return this.getRole() === 'ARTISAN';
  }

  private saveTokens(res: AuthResponse): void {
    if (!this.isBrowser()) return;

    console.log('[AuthService] saving tokens and user info');

    localStorage.setItem('accessToken', res.accessToken);
    localStorage.setItem('refreshToken', res.refreshToken);
    localStorage.setItem('role', res.role);

    if (res.firstName) localStorage.setItem('firstName', res.firstName);
    if (res.lastName) localStorage.setItem('lastName', res.lastName);
    if (res.email) localStorage.setItem('email', res.email);
  }

  private clearTokens(): void {
    if (!this.isBrowser()) return;

    console.log('[AuthService] clearing tokens');

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('role');
    localStorage.removeItem('firstName');
    localStorage.removeItem('lastName');
    localStorage.removeItem('email');
  }
}