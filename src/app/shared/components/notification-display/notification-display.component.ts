import { Component, OnInit, OnDestroy } from '@angular/core';
import { NotificationService, Notification } from '../../services/notification.service';
import { Subject, timer } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface DisplayNotification extends Notification {
  isVisible: boolean;
}

@Component({
  selector: 'app-notification-display',
  template: `
    <div class="notifications-container">
      <div 
        *ngFor="let notification of notifications"
        [ngClass]="['notification', 'notification-' + notification.type, {'hide': !notification.isVisible}]"
        [@slideIn]
      >
        <div class="notification-content">
          <i [ngClass]="getNotificationIcon(notification.type)"></i>
          <span class="notification-message">{{ notification.message }}</span>
        </div>
        <button class="close-btn" (click)="removeNotification(notification.id)">
          <i class="bi bi-x"></i>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .notifications-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      max-width: 400px;
    }

    .notification {
      background: white;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: center;
      justify-content: space-between;
      animation: slideIn 0.3s ease-out;
      border-left: 4px solid;
    }

    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }

    .notification.hide {
      animation: slideOut 0.3s ease-out forwards;
    }

    .notification-success {
      border-left-color: #28a745;
      background: #f8f9fa;
    }

    .notification-success i {
      color: #28a745;
    }

    .notification-error {
      border-left-color: #dc3545;
      background: #fff5f5;
    }

    .notification-error i {
      color: #dc3545;
    }

    .notification-info {
      border-left-color: #17a2b8;
      background: #f0f7ff;
    }

    .notification-info i {
      color: #17a2b8;
    }

    .notification-warning {
      border-left-color: #ffc107;
      background: #fffbf0;
    }

    .notification-warning i {
      color: #ffc107;
    }

    .notification-content {
      display: flex;
      align-items: center;
      flex: 1;
      gap: 12px;
    }

    .notification-content i {
      font-size: 18px;
      flex-shrink: 0;
    }

    .notification-message {
      color: #333;
      font-size: 14px;
      line-height: 1.4;
    }

    .close-btn {
      background: none;
      border: none;
      color: #999;
      cursor: pointer;
      padding: 4px 8px;
      display: flex;
      align-items: center;
      margin-left: 12px;
      transition: color 0.2s;
    }

    .close-btn:hover {
      color: #333;
    }

    .close-btn i {
      font-size: 16px;
    }

    @media (max-width: 480px) {
      .notifications-container {
        right: 10px;
        left: 10px;
        max-width: none;
      }

      .notification {
        margin-bottom: 8px;
      }
    }
  `]
})
export class NotificationDisplayComponent implements OnInit, OnDestroy {
  notifications: DisplayNotification[] = [];
  private destroy$ = new Subject<void>();

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.notificationService.notification$
      .pipe(takeUntil(this.destroy$))
      .subscribe((notification) => {
        this.addNotification(notification);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private addNotification(notification: Notification): void {
    const displayNotification: DisplayNotification = {
      ...notification,
      isVisible: true
    };

    this.notifications.push(displayNotification);

    // Auto-remove after duration
    const duration = notification.duration || 3000;
    timer(duration)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.removeNotification(notification.id);
      });
  }

  removeNotification(id: string): void {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.isVisible = false;

      // Remove from array after animation completes
      timer(300).subscribe(() => {
        this.notifications = this.notifications.filter(n => n.id !== id);
      });
    }
  }

  getNotificationIcon(type: string): string {
    const icons: { [key: string]: string } = {
      success: 'bi bi-check-circle-fill',
      error: 'bi bi-exclamation-circle-fill',
      info: 'bi bi-info-circle-fill',
      warning: 'bi bi-exclamation-triangle-fill'
    };
    return icons[type] || 'bi bi-info-circle-fill';
  }
}
