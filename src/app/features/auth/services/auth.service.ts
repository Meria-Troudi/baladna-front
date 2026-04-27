import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
<<<<<<< HEAD

=======
>>>>>>> origin/marketplace-frontend
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest
} from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private apiUrl = 'http://localhost:8081/api/auth';
<<<<<<< HEAD
  private faceApiUrl = 'http://localhost:8000';

  constructor(private http: HttpClient, private router: Router) {}

  // ===== CHECK ENV =====
=======

  constructor(private http: HttpClient, private router: Router) {}

  // ✅ vérifie si on est dans le navigateur
>>>>>>> origin/marketplace-frontend
  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

<<<<<<< HEAD
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

  faceLogin(email: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.apiUrl}/face-login`,
      { email }
    ).pipe(tap(res => this.saveTokens(res)));
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

=======
  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, request).pipe(
      tap(res => this.saveTokens(res))
    );
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, request).pipe(
      tap(res => this.saveTokens(res))
    );
  }

  logout(): void {
    const refreshToken = this.isBrowser() ? localStorage.getItem('refreshToken') : null;
    if (refreshToken) {
      this.http.post(
      `${this.apiUrl}/logout`,
      { refreshToken },
      { responseType: 'text' }
    ).subscribe({
      next: () => {},
      error: () => {} // ✅ ignorer l'erreur, on déconnecte quand même
    });
    }
>>>>>>> origin/marketplace-frontend
    this.clearTokens();
    this.router.navigate(['/']);
  }

<<<<<<< HEAD
  // ===== REFRESH TOKEN =====

=======
>>>>>>> origin/marketplace-frontend
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.isBrowser()
      ? localStorage.getItem('refreshToken') || ''
      : '';
<<<<<<< HEAD

    return this.http.post<AuthResponse>(
      `${this.apiUrl}/refresh-token`,
      { refreshToken }
    ).pipe(tap(res => this.saveTokens(res)));
  }

  // ===== GETTERS =====

=======
    return this.http.post<AuthResponse>(
      `${this.apiUrl}/refresh-token`,
      { refreshToken }
    ).pipe(
      tap(res => this.saveTokens(res))
    );
  }

>>>>>>> origin/marketplace-frontend
  getAccessToken(): string | null {
    if (!this.isBrowser()) return null;
    return localStorage.getItem('accessToken');
  }

  getCurrentUser(): { firstName: string; lastName: string; email: string } | null {
    if (!this.isBrowser()) return null;
<<<<<<< HEAD

    const firstName = localStorage.getItem('firstName');
    const lastName = localStorage.getItem('lastName');
    const email = localStorage.getItem('email');

    if (!firstName || !lastName || !email) return null;

=======
    const firstName = localStorage.getItem('firstName') || 'User';
    const lastName = localStorage.getItem('lastName') || 'Name';
    const email = localStorage.getItem('email') || 'user@example.com';
>>>>>>> origin/marketplace-frontend
    return { firstName, lastName, email };
  }

  getRole(): string | null {
    if (!this.isBrowser()) return null;
    return localStorage.getItem('role');
  }

<<<<<<< HEAD
  // ===== ROLE CHECK =====

=======
>>>>>>> origin/marketplace-frontend
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

<<<<<<< HEAD
  // ===== STORAGE =====

  private saveTokens(res: AuthResponse): void {
    if (!this.isBrowser()) return;

=======
  private saveTokens(res: AuthResponse): void {
    if (!this.isBrowser()) return;
>>>>>>> origin/marketplace-frontend
    localStorage.setItem('accessToken', res.accessToken);
    localStorage.setItem('refreshToken', res.refreshToken);
    localStorage.setItem('role', res.role);
    // Store user info if available
<<<<<<< HEAD

    if (res.firstName) localStorage.setItem('firstName', res.firstName);
    if (res.lastName) localStorage.setItem('lastName', res.lastName);
    if (res.email) localStorage.setItem('email', res.email);
     if (res.userId)    localStorage.setItem('userId', String(res.userId)); 
=======
    if (res.firstName) localStorage.setItem('firstName', res.firstName);
    if (res.lastName) localStorage.setItem('lastName', res.lastName);
    if (res.email) localStorage.setItem('email', res.email);
>>>>>>> origin/marketplace-frontend
  }

  private clearTokens(): void {
    if (!this.isBrowser()) return;
<<<<<<< HEAD

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('role');
    localStorage.removeItem('firstName');
    localStorage.removeItem('lastName');
    localStorage.removeItem('email');
=======
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('role');
>>>>>>> origin/marketplace-frontend
  }
}