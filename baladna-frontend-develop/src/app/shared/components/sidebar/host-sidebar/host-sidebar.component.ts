import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../features/auth/services/auth.service';
import { User } from '../../../../features/user/user.model';
import { UserService } from '../../../../features/user/user.service';


@Component({
  selector: 'app-host-sidebar',
  templateUrl: './host-sidebar.component.html',
  styleUrls: ['./host-sidebar.component.css']
})
export class HostSidebarComponent implements OnInit {
  isCollapsed = false;
  showUserMenu = false;
  user: User | null = null;
  userName = 'Hôte';

  menuItems = [
    { icon: 'bi-house-heart-fill', label: 'Host Dashboard', route: '/host/dashboard' },
    { icon: 'bi-building-fill',    label: 'My Properties',  route: '/host/properties' },
    { icon: 'bi-calendar-check-fill', label: 'Bookings',   route: '/host/bookings' },
    {icon: 'bi-calendar-event-fill', label: 'Events',   route:  '/host/my-events' },
    { icon: 'bi-chat-dots-fill', label: 'Forum',   route:  '/host/forum' },
    { icon: 'bi-graph-up-arrow',   label: 'Analytics',     route: '/host/analytics' },
    { icon: 'bi-envelope-fill',    label: 'Messages',       route: '/host/messages' },
    { icon: 'bi-star-fill',        label: 'Customer Reviews', route: '/host/reviews' },
  ];

  bottomMenuItems = [
    { icon: 'bi-gear-fill',           label: 'Settings', route: '/host/profile' },
    { icon: 'bi-question-circle-fill', label: 'Help',    route: '/host/help' },
  ];

  constructor(
    private router: Router,
    private authService: AuthService,
    private userService: UserService // ✅ ajouter
  ) {}

  ngOnInit(): void {
    // ✅ récupérer le profil depuis la base
    this.userService.getMyProfile().subscribe({
      next: (user) => {
        this.user = user;
        this.userName = `${user.firstName} ${user.lastName}`;
      },
      error: () => {
        this.userName = 'Hôte';
      }
    });
  }

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
    document.body.classList.toggle('sidebar-collapsed', this.isCollapsed);
  }

  isActive(route: string): boolean {
    return this.router.url === route;
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  logout(): void {
    this.authService.logout();
  }
}