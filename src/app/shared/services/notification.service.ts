import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  
  private notificationSubject = new Subject<Notification>();
  public notification$ = this.notificationSubject.asObservable();
  private notificationId = 0;

  constructor() { }

  /**
   * Show success notification
   */
  success(message: string, duration: number = 3000): void {
    this.show({
      type: 'success',
      message,
      duration
    });
  }

  /**
   * Show error notification
   */
  error(message: string, duration: number = 5000): void {
    this.show({
      type: 'error',
      message,
      duration
    });
  }

  /**
   * Show info notification
   */
  info(message: string, duration: number = 3000): void {
    this.show({
      type: 'info',
      message,
      duration
    });
  }

  /**
   * Show warning notification
   */
  warning(message: string, duration: number = 4000): void {
    this.show({
      type: 'warning',
      message,
      duration
    });
  }

  /**
   * Show generic notification
   */
  private show(notification: Omit<Notification, 'id'>): void {
    const id = `notification-${this.notificationId++}`;
    this.notificationSubject.next({
      id,
      ...notification
    });
  }
}
