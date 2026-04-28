import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
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
  router: any;
  user: User | null = null;
   photoUrl = '';

    userName = 'Host';
  menuItems = [
    { icon: 'bi-house-heart-fill', label: 'Host Dashboard', route: '/host/dashboard' },
    { icon: 'bi-graph-up-arrow',   label: 'accomodation-booking',     route: '/host/analytics' },
    { icon: 'bi-building-fill',    label: 'My Properties',  route: '/host/properties' },
        { icon: 'bi-calendar-month-fill', label: 'Calendar',   route: '/host/calendar' },
    // ✅ TON MODULE TRANSPORT
    { icon: 'bi-geo-alt-fill', label: 'Stations', route: '/host/stations' },
    { icon: 'bi-signpost-split-fill', label: 'Routes', route: '/host/trajets' },
    { icon: 'bi-bus-front-fill', label: 'Transport', route: '/host/transports' },
    { icon: 'bi-calendar-check-fill', label: 'T-Bookings',   route: '/host/bookings' },
 {icon: 'bi-calendar-event-fill', label: 'Events',   route:  '/host/my-events' },
    { icon: 'bi-chat-dots-fill', label: 'Forum',   route:  '/host/forum' },
    { icon: 'bi-envelope-fill',    label: 'Messages',       route: '/host/messages' },
    { icon: 'bi-star-fill', label: 'Guest reviews', route: '/host/reviews' },
  
  ]
  bottomMenuItems = [
    { icon: 'bi-gear-fill', label: 'Settings', route: '/host/profile' },
    { icon: 'bi-question-circle-fill', label: 'Help', route: '/host/help' }
  ];



 

  constructor(
    private elementRef: ElementRef<HTMLElement>,
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
    this.userService.getMyProfile().subscribe({
      next: (user) => {
        this.user = user;
        this.userName = `${user.firstName} ${user.lastName}`;
        this.photoUrl = this.userService.getPhotoUrl(user.profilePhoto ?? null);
      },
      error: () => {
        this.userName = 'Host';
      }
    });
  }

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
    this.showUserMenu = false;
    document.body.classList.toggle('sidebar-collapsed', this.isCollapsed);
  }

  isActive(route: string): boolean {
    //return this.router.url === route;
    const url = this.router.url.split('?')[0];
    return url === route || url.startsWith(route + '/');
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  logout(): void {
    this.showUserMenu = false;
    this.authService.logout();
  }
}
