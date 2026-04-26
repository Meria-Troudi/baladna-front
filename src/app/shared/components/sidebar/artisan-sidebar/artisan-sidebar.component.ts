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
<<<<<<< HEAD
  photoUrl = '';
=======
>>>>>>> 4ccebdbd6c3d33473beec788c0d97eaf73ebe101

  menuItems = [
    { icon: 'bi-palette2',         label: 'Artisan Workshop',  route: '/artisan/dashboard' },
    { icon: 'bi-box-seam-fill',    label: 'My Products',       route: '/artisan/products' },
    { icon: 'bi-bag-check-fill',   label: 'Orders',            route: '/artisan/orders' },
    { icon: 'bi-camera-video-fill', label: 'Video Workshop',   route: '/artisan/workshop' },
    { icon: 'bi-bar-chart-line-fill', label: 'Analytics',      route: '/artisan/analytics' },
    { icon: 'bi-chat-dots-fill',   label: 'Messages',          route: '/artisan/messages' },
    { icon: 'bi-star-fill',        label: 'Customer Reviews',  route: '/artisan/reviews' },
  ];

  bottomMenuItems = [
    { icon: 'bi-gear-fill',           label: 'Settings', route: '/artisan/profile' },
    { icon: 'bi-question-circle-fill', label: 'Help',    route: '/artisan/help' },
  ];

  constructor(
    private router: Router,
    private authService: AuthService,
    private userService: UserService // ✅ ajouter
  ) {}

  ngOnInit(): void {
<<<<<<< HEAD
=======
    // ✅ récupérer le profil depuis la base
>>>>>>> 4ccebdbd6c3d33473beec788c0d97eaf73ebe101
    this.userService.getMyProfile().subscribe({
      next: (user) => {
        this.user = user;
        this.userName = `${user.firstName} ${user.lastName}`;
<<<<<<< HEAD
        this.photoUrl = this.userService.getPhotoUrl(user.profilePhoto ?? null);
=======
>>>>>>> 4ccebdbd6c3d33473beec788c0d97eaf73ebe101
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