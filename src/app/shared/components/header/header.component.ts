import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../features/auth/services/auth.service';
<<<<<<< HEAD
import { UserService } from '../../../features/user/user.service';
=======
>>>>>>> 4ccebdbd6c3d33473beec788c0d97eaf73ebe101

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  role: 'TOURIST' | 'HOST' | 'ADMIN' = 'TOURIST';
  userName = '';
  avatarLetter = 'A';
<<<<<<< HEAD
  photoUrl = '';

  constructor(
    private authService: AuthService,
    private userService: UserService
  ) {}
=======

  constructor(private authService: AuthService) {}
>>>>>>> 4ccebdbd6c3d33473beec788c0d97eaf73ebe101

  ngOnInit() {
    this.role = this.authService.getRole() as 'TOURIST' | 'HOST' | 'ADMIN';
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userName = `${user.firstName} ${user.lastName}`;
      this.avatarLetter = user.firstName[0].toUpperCase();
<<<<<<< HEAD
      this.userService.getMyProfile().subscribe({
        next: (profile) => {
          this.photoUrl = this.userService.getPhotoUrl(profile.profilePhoto ?? null);
        },
        error: () => {}
      });
=======
>>>>>>> 4ccebdbd6c3d33473beec788c0d97eaf73ebe101
    }
  }

  toggleSidebar() {
    document.body.classList.toggle('sidebar-collapsed');
  }

  logout() {
    this.authService.logout();
  }
}
