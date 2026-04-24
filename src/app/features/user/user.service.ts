import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  User,
  UpdateProfileRequest,
  ChangePasswordRequest,
  UpdateStatusRequest,
  UpdateRoleRequest,
  ActivityLog,
  Session
} from './user.model';

@Injectable({ providedIn: 'root' })
export class UserService {

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
      { responseType: 'text' } // ✅ texte pas JSON
    );
  }

  getMyActivity(): Observable<ActivityLog[]> {
    return this.http.get<ActivityLog[]>(`${this.apiUrl}/profile/me/activity`);
  }

  getMySessions(): Observable<Session[]> {
    return this.http.get<Session[]>(`${this.apiUrl}/profile/me/sessions`);
  }

  logoutAllSessions(): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/profile/me/sessions`,
      { responseType: 'text' } // ✅ texte pas JSON
    );
  }

  // ========== ADMIN ==========

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`);
  }
  getAllUsersIncludingDeleted(): Observable<User[]> {
  return this.http.get<User[]>(`${this.apiUrl}/users/all`);
}

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${id}`);
  }

  updateStatus(id: number, request: UpdateStatusRequest): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/${id}/status`, request);
  }

  updateRole(id: number, request: UpdateRoleRequest): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/${id}/role`, request);
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/users/${id}`,
      { responseType: 'text' } // ✅ texte pas JSON
    );
  }

  hardDeleteUser(id: number): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/users/${id}/permanent`,
      { responseType: 'text' } // ✅ texte pas JSON
    );
  }

  getUsersByRole(role: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users/role/${role}`);
  }

  getUsersByStatus(status: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users/status/${status}`);
  }

  searchUsers(keyword: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users/search?keyword=${keyword}`);
  }

  getUserStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/users/stats`);
  }
}