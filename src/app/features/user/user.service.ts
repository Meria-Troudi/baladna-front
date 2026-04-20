import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

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

  // ===== PROFILE =====

  getMyProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/profile/me`)
      .pipe(catchError(this.handleError));
  }

  updateMyProfile(request: UpdateProfileRequest): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/profile/me`, request)
      .pipe(catchError(this.handleError));
  }

  changePassword(request: ChangePasswordRequest): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/profile/me/change-password`,
      request,
      { responseType: 'text' }
    ).pipe(catchError(this.handleError));
  }

  getMyActivity(): Observable<ActivityLog[]> {
    return this.http.get<ActivityLog[]>(`${this.apiUrl}/profile/me/activity`)
      .pipe(catchError(this.handleError));
  }

  getMySessions(): Observable<Session[]> {
    return this.http.get<Session[]>(`${this.apiUrl}/profile/me/sessions`)
      .pipe(catchError(this.handleError));
  }

  logoutAllSessions(): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/profile/me/sessions`,
      { responseType: 'text' }
    ).pipe(catchError(this.handleError));
  }

  // ===== ADMIN =====

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`)
      .pipe(catchError(this.handleError));
  }

  getAllUsersIncludingDeleted(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users/all`)
      .pipe(catchError(this.handleError));
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${id}`)
      .pipe(catchError(this.handleError));
  }

  updateStatus(id: number, request: UpdateStatusRequest): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/${id}/status`, request)
      .pipe(catchError(this.handleError));
  }

  updateRole(id: number, request: UpdateRoleRequest): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/${id}/role`, request)
      .pipe(catchError(this.handleError));
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/users/${id}`,
      { responseType: 'text' }
    ).pipe(catchError(this.handleError));
  }

  hardDeleteUser(id: number): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/users/${id}/permanent`,
      { responseType: 'text' }
    ).pipe(catchError(this.handleError));
  }

  getUsersByRole(role: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users/role/${role}`)
      .pipe(catchError(this.handleError));
  }

  getUsersByStatus(status: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users/status/${status}`)
      .pipe(catchError(this.handleError));
  }

  searchUsers(keyword: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users/search?keyword=${keyword}`)
      .pipe(catchError(this.handleError));
  }

  getUserStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/users/stats`)
      .pipe(catchError(this.handleError));
  }

  // ===== ERROR HANDLER =====

  private handleError(error: HttpErrorResponse) {
    console.error('API Error:', error);
    return throwError(() => error);
  }
}