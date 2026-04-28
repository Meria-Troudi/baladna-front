import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../features/auth/services/auth.service';
import { UserService } from '../../../features/user/user.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  role: 'TOURIST' | 'HOST' | 'ADMIN' = 'TOURIST';
  userName = '';
  avatarLetter = 'A';
  photoUrl = '';

  constructor(
    private authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.role = this.authService.getRole() as 'TOURIST' | 'HOST' | 'ADMIN';
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userName = `${user.firstName} ${user.lastName}`;
      this.avatarLetter = user.firstName[0].toUpperCase();
      this.userService.getMyProfile().subscribe({
        next: (profile) => {
          this.photoUrl = this.userService.getPhotoUrl(profile.profilePhoto ?? null);
        },
        error: () => {}
      });
    }
  }

  toggleSidebar() {
    document.body.classList.toggle('sidebar-collapsed');
  }

  logout() {
    this.authService.logout();
  }
}
