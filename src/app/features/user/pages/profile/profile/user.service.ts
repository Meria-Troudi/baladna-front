import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: 'TOURIST' | 'HOST' | 'ADMIN' | 'ARTISAN';
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  preferredLanguage: string;
  profilePhoto?: string;
  lastLogin?: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  preferredLanguage?: string;
  profilePhoto?: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface ActivityLog {
  id: number;
  action: string;
  timestamp: string;
}

export interface Session {
  id: string;
  token: string;
  expiresAt: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileUserService {

  private apiUrl = 'http://localhost:8081/api';

  constructor(private http: HttpClient) {}

  // ========== PROFILE ==========

  getMyProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/profile/me`);
  }

  updateMyProfile(request: UpdateProfileRequest): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/profile/me`, request);
  }

  changePassword(request: ChangePasswordRequest): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/profile/me/change-password`,
      request,
      { responseType: 'text' }
    );
  }

  getMyActivity(page: number = 0, size: number = 10): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/profile/me/activity?page=${page}&size=${size}`);
  }

  getMySessions(page: number = 0, size: number = 10): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/profile/me/sessions?page=${page}&size=${size}`);
  }

  logoutAllSessions(): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/profile/me/sessions`,
      { responseType: 'text' }
    );
  }
}
