import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../features/auth/services/auth.service';
import { User } from '../../../../features/user/user.model';
import { UserService } from '../../../../features/user/user.service';

@Component({
  selector: 'app-tourist-sidebar',
  templateUrl: './tourist-sidebar.component.html',
  styleUrls: ['./tourist-sidebar.component.css']
})
export class TouristSidebarComponent implements OnInit {
  isCollapsed = false;
  showUserMenu = false;
  user: User | null = null;
  userName = 'Traveler';
  userRole = 'Tourist';

  menuItems = [
    { icon: 'bi-house-fill',        label: 'Dashboard',  route: '/tourist/dashboard' },
    { icon: 'bi-compass',           label: 'Discover',         route: '/tourist/discover' },
    { icon: 'bi-calendar-event-fill', label: 'Events',     route: '/tourist/events' },
    { icon: 'bi-building-fill',     label: 'Accommodations',      route: '/tourist/accommodations' },
    { icon: 'bi-bus-front-fill',    label: 'Transport',         route: '/tourist/transport' },
    { icon: 'bi-bag-fill',          label: 'Marketplace',       route: '/tourist/marketplace' },
    { icon: 'bi-bookmark-fill',     label: 'My Bookings',  route: '/tourist/bookings' },
    { icon: 'bi-heart-fill',        label: 'Favorites',           route: '/tourist/favorites' },
    { icon: 'bi-star-fill',         label: 'Reviews',              route: '/tourist/reviews' },
  ];

  bottomMenuItems = [
    { icon: 'bi-gear-fill',           label: 'Settings', route: '/tourist/profile' },
    { icon: 'bi-question-circle-fill', label: 'Help',      route: '/tourist/help' },
  ];

  constructor(
    private router: Router,
    private authService: AuthService,
    private userService: UserService  // ✅ ajouter
  ) {}

  ngOnInit(): void {
    // ✅ récupérer le profil depuis la base de données
    this.userService.getMyProfile().subscribe({
      next: (user) => {
        this.user = user;
        this.userName = `${user.firstName} ${user.lastName}`;
        this.userRole = this.getRoleLabel(user.role);
      },
      error: () => {
        this.userName = 'Traveler';
      }
    });
  }

  getRoleLabel(role: string): string {
    switch (role) {
      case 'TOURIST':  return 'Tourist';
      case 'HOST':     return 'Host';
      case 'ARTISAN':  return 'Artisan';
      case 'ADMIN':    return 'Administrator';
      default:         return role;
    }
  }

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
    document.body.classList.toggle('sidebar-collapsed', this.isCollapsed);
  }

  isActive(route: string): boolean {
    const url = this.router.url.split('?')[0];
    if (route === '/tourist/accommodations') {
      return url === route || url.startsWith(route + '/');
    }
    return url === route;
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  logout(): void {
    this.authService.logout();
  }
}