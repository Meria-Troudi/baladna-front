import { Component, OnInit } from '@angular/core';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  showPanel = false;
  unreadCount = 0;

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.notificationService.getUnreadCount().subscribe(c => {
      this.unreadCount = c;
    });
  }

  togglePanel(): void {
    this.showPanel = !this.showPanel;
  }

  closePanel(): void {
    this.showPanel = false;
  }
}