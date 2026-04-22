import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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

  private readonly api =
    (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.port === '4200'))
      ? 'http://localhost:8081/api/forum/notifications'
      : '/api/forum/notifications';

  constructor(private http: HttpClient) {}

  getNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(this.api).pipe(
      map(list => list.map(n => this.mapNotification(n)))
    );
  }

  private mapNotification(n: Notification): Notification {
    return {
      ...n,
      previewText: this.buildMessage(n)
    };
  }

  private buildMessage(n: Notification): string {
    switch (n.type) {
      case 'LIKE':
        return n.actorName ? `❤️ ${n.actorName} liked your post` : '❤️ Your post got a new like';
      case 'COMMENT':
        return n.actorName ? `💬 ${n.actorName} commented on your post` : '💬 New comment on your post';
      case 'REPLY':
        return n.actorName ? `↩️ ${n.actorName} replied to your comment` : '↩️ Someone replied to your comment';
      default:
        return 'New activity';
    }
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