import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../features/auth/services/auth.service';

interface MenuItem {
  label: string;
  icon?: string;
  badge?: string;
  tooltip?: string;
  route?: string;
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  role: 'TOURIST' | 'HOST' | 'ADMIN' | 'ARTISAN' = 'TOURIST';
  menuItems: MenuItem[] = [];
  userName: string = '';

  private menus: Record<string, MenuItem[]> = {
    TOURIST: [
      { label: 'Discover', icon: '🗺️', tooltip: 'Discover', route: '/tourist/discover' },
      { label: 'Budget', icon: '💰', tooltip: 'Budget', route: '/tourist/budget' },
      { label: 'Events', icon: '🎪', tooltip: 'Events', badge: '3', route: '/tourist/events' },
      { label: 'Stays', icon: '🏡', tooltip: 'Stays', route: '/tourist/stays' },
      { label: 'Transport', icon: '🚌', tooltip: 'Transport', route: '/tourist/transport' },
      { label: 'Marketplace', icon: '🛍️', tooltip: 'Marketplace', route: '/tourist/marketplace' },
      { label: 'My Itinerary', icon: '📋', tooltip: 'My Itinerary', route: '/tourist/itinerary' },
      { label: 'Accommodation', icon: '🏨', tooltip: 'My Accommodation', route: '/tourist/my-accommodation' },
      { label: 'Transport', icon: '🚗', tooltip: 'My Transport', route: '/tourist/my-transport' },
      { label: 'Events', icon: '🎫', tooltip: 'My Events', route: '/tourist/my-events' },
      { label: 'Forum', icon: '💬', tooltip: 'Forum', route: '/tourist/forum' },
      { label: 'Settings', icon: '⚙️', tooltip: 'Settings', route: '/tourist/settings' },
      { label: 'Profile', icon: '👤', tooltip: 'Profile', route: '/tourist/profile' }
    ],
    HOST: [
      { label: 'Dashboard', icon: '📊', tooltip: 'Dashboard', route: '/host/dashboard' },
      { label: 'Platform Overview', icon: '🏛️', tooltip: 'Platform Overview', route: '/host/overview' },
      { label: 'Accommodations', icon: '🏡', tooltip: 'Accommodations', route: '/host/accommodations' },
      { label: 'Events', icon: '🎪', tooltip: 'My Events', badge: '5', route: '/host/my-events' },
      { label: 'Forum', icon: '💬', tooltip: 'Forum', route: '/host/forum' },
      { label: 'Bookings', icon: '🎫', tooltip: 'Bookings', badge: '12', route: '/host/bookings' },
      { label: 'Revenue', icon: '💰', tooltip: 'Revenue', route: '/host/revenue' },
      { label: 'Reviews', icon: '⭐', tooltip: 'Reviews', route: '/host/reviews' },
      { label: 'Analytics', icon: '📈', tooltip: 'Analytics', route: '/host/analytics' },
      { label: 'Settings', icon: '⚙️', tooltip: 'Settings', route: '/host/settings' },
      { label: 'Profile', icon: '👤', tooltip: 'Profile', route: '/host/profile' }
    ],
    ARTISAN: [
      { label: 'Dashboard', icon: '📊', tooltip: 'Dashboard', route: '/artisan/dashboard' },
      { label: 'My Products', icon: '🎨', tooltip: 'My Products', badge: '8', route: '/artisan/products' },
      { label: 'Workshop', icon: '🔨', tooltip: 'Workshop', route: '/artisan/workshop' },
      { label: 'Orders', icon: '📦', tooltip: 'Orders', badge: '3', route: '/artisan/orders' },
      { label: 'Inventory', icon: '📋', tooltip: 'Inventory', route: '/artisan/inventory' },
      { label: 'Revenue', icon: '💰', tooltip: 'Revenue', route: '/artisan/revenue' },
      { label: 'Reviews', icon: '⭐', tooltip: 'Reviews', route: '/artisan/reviews' },
      { label: 'Settings', icon: '⚙️', tooltip: 'Settings', route: '/artisan/settings' },
      { label: 'Profile', icon: '👤', tooltip: 'Profile', route: '/artisan/profile' }
    ],
    ADMIN: [
      { label: 'Dashboard', icon: '📊', tooltip: 'Dashboard', route: '/admin/dashboard' },
      { label: 'Platform Overview', icon: '🏛️', tooltip: 'Platform Overview', route: '/admin/overview' },
      { label: 'Users', icon: '👥', tooltip: 'Users', route: '/admin/users' },
      { label: 'Role Requests', icon: '🎭', tooltip: 'Role Requests', badge: '4', route: '/admin/role-requests' },
      { label: 'Events', icon: '🎪', tooltip: 'Events', route: '/admin/events' },
      { label: 'Forum', icon: '💬', tooltip: 'Forum', route: '/admin/forum' },
      { label: 'Accommodations', icon: '🏡', tooltip: 'Accommodations', route: '/admin/accommodations' },
      { label: 'Marketplace', icon: '🛍️', tooltip: 'Marketplace', route: '/admin/marketplace' },
      { label: 'Transport', icon: '🚌', tooltip: 'Transport', route: '/admin/transport' },
      { label: 'Moderation', icon: '🛡️', tooltip: 'Moderation', badge: '9', route: '/admin/moderation' },
      { label: 'Disputes', icon: '⚖️', tooltip: 'Disputes', route: '/admin/disputes' },
      { label: 'Audit Logs', icon: '📋', tooltip: 'Audit Logs', route: '/admin/audit-logs' },
      { label: 'Reports', icon: '📈', tooltip: 'Reports', route: '/admin/reports' },
      { label: 'Settings', icon: '⚙️', tooltip: 'Settings', route: '/admin/settings' },
      { label: 'Profile', icon: '👤', tooltip: 'Profile', route: '/admin/profile' }
    ]
  };

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.role = this.authService.getRole() as 'TOURIST' | 'HOST' | 'ADMIN' | 'ARTISAN';
    this.menuItems = this.menus[this.role] || [];
    
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userName = `${user.firstName} ${user.lastName}`;
    } else {
      this.userName = this.role.charAt(0) + this.role.slice(1).toLowerCase();
    }
  }

  getSettingsRoute(): string {
    return `/${this.role.toLowerCase()}/settings`;
  }

  getProfileRoute(): string {
    return `/${this.role.toLowerCase()}/profile`;
  }

  logout(): void {
    this.authService.logout();
  }
}
