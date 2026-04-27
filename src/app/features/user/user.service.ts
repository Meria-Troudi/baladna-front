import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
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
  getMyNumericUserId(): Observable<number | null> {
    return this.getMyProfile().pipe(
      map((u) => {
        const n = Number(u?.id);
        return Number.isFinite(n) && n > 0 ? n : null;
      }),
      catchError(() => of(null))
    );
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

  uploadPhoto(photo: File): Observable<string> {
  const formData = new FormData();
  formData.append('photo', photo);
  return this.http.post(
    `${this.apiUrl}/profile/me/photo`,
    formData,
    { responseType: 'text' }
  );
}

deletePhoto(): Observable<string> {
  return this.http.delete(
    `${this.apiUrl}/profile/me/photo`,
    { responseType: 'text' }
  );
}

getPhotoUrl(photoPath: string | null): string {
  if (!photoPath) return 'assets/default-avatar.png';
  return `http://localhost:8081/uploads/photos/${photoPath}`;
}

}