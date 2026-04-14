import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
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

  getMyProfile(): Observable<User> {
    console.log('[UserService] GET /profile/me');
    return this.http.get<User>(`${this.apiUrl}/profile/me`).pipe(
      tap((response) => console.log('[UserService] profile loaded:', response)),
      catchError((error) => this.handleError(error))
    );
  }

  updateMyProfile(request: UpdateProfileRequest): Observable<User> {
    console.log('[UserService] PUT /profile/me', request);
    return this.http.put<User>(`${this.apiUrl}/profile/me`, request).pipe(
      tap((response) => console.log('[UserService] profile updated:', response)),
      catchError((error) => this.handleError(error))
    );
  }

  changePassword(request: ChangePasswordRequest): Observable<any> {
    console.log('[UserService] PUT /profile/me/change-password', {
      oldPassword: '***',
      newPassword: '***'
    });

    return this.http.put(
      `${this.apiUrl}/profile/me/change-password`,
      request,
      { responseType: 'text' }
    ).pipe(
      tap((response) => console.log('[UserService] password changed:', response)),
      catchError((error) => this.handleError(error))
    );
  }

  getMyActivity(): Observable<ActivityLog[]> {
    console.log('[UserService] GET /profile/me/activity');
    return this.http.get<ActivityLog[]>(`${this.apiUrl}/profile/me/activity`).pipe(
      tap((response) => console.log('[UserService] activity loaded:', response)),
      catchError((error) => this.handleError(error))
    );
  }

  getMySessions(): Observable<Session[]> {
    console.log('[UserService] GET /profile/me/sessions');
    return this.http.get<Session[]>(`${this.apiUrl}/profile/me/sessions`).pipe(
      tap((response) => console.log('[UserService] sessions loaded:', response)),
      catchError((error) => this.handleError(error))
    );
  }

  logoutAllSessions(): Observable<any> {
    console.log('[UserService] DELETE /profile/me/sessions');
    return this.http.delete(
      `${this.apiUrl}/profile/me/sessions`,
      { responseType: 'text' }
    ).pipe(
      tap((response) => console.log('[UserService] all sessions logged out:', response)),
      catchError((error) => this.handleError(error))
    );
  }

  getAllUsers(): Observable<User[]> {
    console.log('[UserService] GET /users');
    return this.http.get<User[]>(`${this.apiUrl}/users`).pipe(
      tap((response) => console.log('[UserService] users loaded:', response)),
      catchError((error) => this.handleError(error))
    );
  }

  getAllUsersIncludingDeleted(): Observable<User[]> {
    console.log('[UserService] GET /users/all');
    return this.http.get<User[]>(`${this.apiUrl}/users/all`).pipe(
      tap((response) => console.log('[UserService] users including deleted loaded:', response)),
      catchError((error) => this.handleError(error))
    );
  }

  getUserById(id: number): Observable<User> {
    console.log(`[UserService] GET /users/${id}`);
    return this.http.get<User>(`${this.apiUrl}/users/${id}`).pipe(
      tap((response) => console.log('[UserService] user loaded:', response)),
      catchError((error) => this.handleError(error))
    );
  }

  updateStatus(id: number, request: UpdateStatusRequest): Observable<User> {
    console.log(`[UserService] PUT /users/${id}/status`, request);
    return this.http.put<User>(`${this.apiUrl}/users/${id}/status`, request).pipe(
      tap((response) => console.log('[UserService] user status updated:', response)),
      catchError((error) => this.handleError(error))
    );
  }

  updateRole(id: number, request: UpdateRoleRequest): Observable<User> {
    console.log(`[UserService] PUT /users/${id}/role`, request);
    return this.http.put<User>(`${this.apiUrl}/users/${id}/role`, request).pipe(
      tap((response) => console.log('[UserService] user role updated:', response)),
      catchError((error) => this.handleError(error))
    );
  }

  deleteUser(id: number): Observable<any> {
    console.log(`[UserService] DELETE /users/${id}`);
    return this.http.delete(
      `${this.apiUrl}/users/${id}`,
      { responseType: 'text' }
    ).pipe(
      tap((response) => console.log('[UserService] user soft deleted:', response)),
      catchError((error) => this.handleError(error))
    );
  }

  hardDeleteUser(id: number): Observable<any> {
    console.log(`[UserService] DELETE /users/${id}/permanent`);
    return this.http.delete(
      `${this.apiUrl}/users/${id}/permanent`,
      { responseType: 'text' }
    ).pipe(
      tap((response) => console.log('[UserService] user hard deleted:', response)),
      catchError((error) => this.handleError(error))
    );
  }

  getUsersByRole(role: string): Observable<User[]> {
    console.log(`[UserService] GET /users/role/${role}`);
    return this.http.get<User[]>(`${this.apiUrl}/users/role/${role}`).pipe(
      tap((response) => console.log('[UserService] users by role loaded:', response)),
      catchError((error) => this.handleError(error))
    );
  }

  getUsersByStatus(status: string): Observable<User[]> {
    console.log(`[UserService] GET /users/status/${status}`);
    return this.http.get<User[]>(`${this.apiUrl}/users/status/${status}`).pipe(
      tap((response) => console.log('[UserService] users by status loaded:', response)),
      catchError((error) => this.handleError(error))
    );
  }

  searchUsers(keyword: string): Observable<User[]> {
    console.log('[UserService] GET /users/search', { keyword });
    return this.http.get<User[]>(`${this.apiUrl}/users/search?keyword=${keyword}`).pipe(
      tap((response) => console.log('[UserService] search users response:', response)),
      catchError((error) => this.handleError(error))
    );
  }

  getUserStats(): Observable<any> {
    console.log('[UserService] GET /users/stats');
    return this.http.get<any>(`${this.apiUrl}/users/stats`).pipe(
      tap((response) => console.log('[UserService] user stats loaded:', response)),
      catchError((error) => this.handleError(error))
    );
  }

  private handleError(error: HttpErrorResponse) {
    console.error('[UserService] API error', {
      status: error.status,
      message: error.message,
      url: error.url,
      error: error.error
    });

    return throwError(() => error);
  }
}