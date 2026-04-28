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
  private faceApiUrl = 'http://localhost:8000';

  constructor(private http: HttpClient, private router: Router) {}

  // ===== CHECK ENV =====
  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  // ===== AUTH =====

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, request)
      .pipe(tap(res => this.saveTokens(res)));
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, request)
      .pipe(tap(res => this.saveTokens(res)));
  }

  // ===== FACE LOGIN =====

  faceRecognize(imageBase64: string): Observable<{ name: string }> {
    return this.http.post<{ name: string }>(
      `${this.faceApiUrl}/recognize`,
      { image: imageBase64 }
    );
  }

  faceLogin(imageBase64: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/face-login`, { image: imageBase64 }).pipe(
      tap(res => this.saveTokens(res))
    );
  }

  // ===== LOGOUT =====

  logout(): void {
    const refreshToken = this.isBrowser()
      ? localStorage.getItem('refreshToken')
      : null;

    if (refreshToken) {
      this.http.post(
        `${this.apiUrl}/logout`,
        { refreshToken },
        { responseType: 'text' }
      ).subscribe({
        next: () => {},
        error: () => {}
      });
    }

    this.clearTokens();
    this.router.navigate(['/']);
  }

  // ===== REFRESH TOKEN =====

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.isBrowser()
      ? localStorage.getItem('refreshToken') || ''
      : '';

    return this.http.post<AuthResponse>(
      `${this.apiUrl}/refresh-token`,
      { refreshToken }
    ).pipe(tap(res => this.saveTokens(res)));
  }

  // ===== GETTERS =====

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

  // ===== ROLE CHECK =====

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

  // ===== STORAGE =====

  private saveTokens(res: AuthResponse): void {
    if (!this.isBrowser()) return;

    localStorage.setItem('accessToken', res.accessToken);
    localStorage.setItem('refreshToken', res.refreshToken);
    localStorage.setItem('role', res.role);
    // Store user info if available

    if (res.firstName) localStorage.setItem('firstName', res.firstName);
    if (res.lastName) localStorage.setItem('lastName', res.lastName);
    if (res.email) localStorage.setItem('email', res.email);
     if (res.userId)    localStorage.setItem('userId', String(res.userId)); 
  }

  private clearTokens(): void {
    if (!this.isBrowser()) return;

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('role');
    localStorage.removeItem('firstName');
    localStorage.removeItem('lastName');
    localStorage.removeItem('email');
  }
}