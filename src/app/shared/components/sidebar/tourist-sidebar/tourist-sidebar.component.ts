import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
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
  //userName = 'Voyageur';
  //userRole = 'Touriste';
  userName = 'Traveler';
  userRole = 'Tourist';
 
  photoUrl = '';

  menuItems = [
    { icon: 'bi-house-fill',        label: 'Dashboard',  route: '/tourist/dashboard' },
    { icon: 'bi-map-fill',          label: 'Itinerary',  route: '/tourist/itineraries' },
    { icon: 'bi-heart-fill',        label: 'tranport dash',           route: '/tourist/favorites' },
    { icon: 'bi-compass',           label: 'transport-booking',         route: '/tourist/discover' },
        { icon: 'bi-bus-front-fill',    label: 'Transport',         route: '/tourist/transport' },
    { icon: 'bi-building-fill',     label: 'Accommodations',      route: '/tourist/accommodations' },
    { icon: 'bi-bookmark-fill',     label: 'My Bookings',  route: '/tourist/bookings' },
    { icon: 'bi-bag-fill',          label: 'Marketplace',       route: '/tourist/marketplace' },

    { icon: 'bi-calendar-event-fill', label: 'Events',     route: '/tourist/events' },
    { icon: 'bi-chat-square-text-fill', label: 'Forum',     route: '/tourist/forum' },

    { icon: 'bi-star-fill',         label: 'Reviews',              route: '/tourist/reviews' },
  
 
  ];

  bottomMenuItems = [
    { icon: 'bi-gear-fill', label: 'Settings', route: '/tourist/profile' },
    { icon: 'bi-question-circle-fill', label: 'Help', route: '/tourist/help' }
  ];

  constructor(
    private elementRef: ElementRef<HTMLElement>,
    private router: Router,
    private authService: AuthService,
    private userService: UserService
  ) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node | null;
    if (this.showUserMenu && target && !this.elementRef.nativeElement.contains(target)) {
      this.showUserMenu = false;
    }
  }

  ngOnInit(): void {
    // Load the profile from the backend.
    this.userService.getMyProfile().subscribe({
      next: (user) => {
        this.user = user;
        this.userName = `${user.firstName} ${user.lastName}`;
        this.userRole = this.getRoleLabel(user.role);
        this.photoUrl = this.userService.getPhotoUrl(user.profilePhoto ?? null);
      },
      error: () => {
       // this.userName = 'Voyageur';
        this.userName = 'Traveler';
      }
    });
  }

  getRoleLabel(role: string): string {
    switch (role) {
      //case 'TOURIST':  return 'Touriste';
     // case 'HOST':     return 'Hôte';
     // case 'ARTISAN':  return 'Artisan';
     // case 'ADMIN':    return 'Administrateur';
      case 'TOURIST':  return 'Tourist';
      case 'HOST':     return 'Host';
      case 'ARTISAN':  return 'Artisan';
      case 'ADMIN':    return 'Administrator';
      default:         return role;
    }
  }

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
    this.showUserMenu = false;
    document.body.classList.toggle('sidebar-collapsed', this.isCollapsed);
  }

  isActive(route: string): boolean {
    //return this.router.url === route;
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
    this.showUserMenu = false;
    this.authService.logout();
  }
}
