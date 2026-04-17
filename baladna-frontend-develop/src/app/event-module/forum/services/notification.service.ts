import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Notification {
  id: number;
  actorId: number;
  actorName: string;
  actorAvatar?: string;
  postId: number;
  commentId?: number;
  type: 'LIKE' | 'COMMENT' | 'REPLY';
  previewText?: string;
  isRead: boolean;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {

  private readonly api = '/api/forum/notifications';

  constructor(private http: HttpClient) {}

  getNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(this.api);
  }

  getUnreadCount(): Observable<number> {
    return this.http.get<number>(`${this.api}/unread-count`);
  }

  markAsRead(id: number): Observable<void> {
    return this.http.put<void>(`${this.api}/${id}/read`, {});
  }

  markAllAsRead(): Observable<void> {
    return this.http.put<void>(`${this.api}/read-all`, {});
  }
}