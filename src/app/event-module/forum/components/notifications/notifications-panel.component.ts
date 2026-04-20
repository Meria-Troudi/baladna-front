import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { NotificationService, Notification } from '../../services/notification.service';

@Component({
  selector: 'app-notifications-panel',
  templateUrl: './notifications-panel.component.html',
  styleUrls: ['./notifications-panel.component.css']
})
export class NotificationsPanelComponent implements OnInit {

  @Output() close = new EventEmitter<void>();
  @Output() openPost = new EventEmitter<number>();

  notifications: Notification[] = [];
  loading = false;

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.loading = true;
    this.notificationService.getNotifications().subscribe({
      next: (res) => {
        this.notifications = res;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  onNotificationClick(notification: Notification): void {
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification.id).subscribe();
      notification.isRead = true;
    }

    this.openPost.emit(notification.postId);
  }

  markAllRead(): void {
    this.notificationService.markAllAsRead().subscribe(() => {
      this.notifications.forEach(n => n.isRead = true);
    });
  }
}