import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../features/auth/services/auth.service';
import { User } from '../../../../features/user/user.model';
import { UserService } from '../../../../features/user/user.service';


@Component({
  selector: 'app-artisan-sidebar',
  templateUrl: './artisan-sidebar.component.html',
  styleUrls: ['./artisan-sidebar.component.css']
})
export class ArtisanSidebarComponent implements OnInit {
  isCollapsed = false;
  showUserMenu = false;
  user: User | null = null;
  userName = 'Artisan';
  photoUrl = '';

  menuItems: Array<{ icon: string; label: string; route: string }> = [
    { icon: 'bi-grid-fill', label: 'My Products', route: '/artisan/marketplace/products' },
    { icon: 'bi-bag-check-fill', label: 'Orders', route: '/artisan/marketplace/orders' },
    { icon: 'bi-bar-chart-line-fill', label: 'Analytics', route: '/artisan/marketplace/dashboard' },
  ];

  // 🔽 AJOUTS IMPORTANTS pour le marketplace sans /api
  marketplaceLinks: Array<{ icon: string; label: string; route: string }> = [];

  bottomMenuItems: Array<{ icon: string; label: string; route: string }> = [
    { icon: 'bi-gear-fill',           label: 'Settings', route: '/artisan/profile' },
    { icon: 'bi-question-circle-fill', label: 'Help',    route: '/artisan/help' },
  ];

  constructor(
    private router: Router,
    private authService: AuthService,
    private userService: UserService // ✅ ajouter
  ) {}

  ngOnInit(): void {
    this.userService.getMyProfile().subscribe({
      next: (user) => {
        this.user = user;
        this.userName = `${user.firstName} ${user.lastName}`;
        this.photoUrl = this.userService.getPhotoUrl(user.profilePhoto ?? null);
      },
      error: () => {
        this.userName = 'Artisan';
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