import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../../features/auth/services/auth.service';

@Component({
  selector: 'app-tourist-settings',
  templateUrl: './tourist-settings.component.html',
  styleUrls: ['./tourist-settings.component.css']
})
export class TouristSettingsComponent implements OnInit {
  activeSection = 'profile';

  user: any = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    nationality: '',
    birthDate: '',
    avatar: 'https://ui-avatars.com/api/?name=User&background=667eea&color=fff&size=150'
  };

  role: string = '';
  createdAt: string = '';
  lastLogin: string = '';

  notifications = {
    email: true,
    sms: false,
    push: true,
    promotions: true,
    bookingUpdates: true,
    newsletter: false
  };

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.user.firstName = currentUser.firstName;
      this.user.lastName = currentUser.lastName;
      this.user.email = currentUser.email;
      this.user.avatar = `https://ui-avatars.com/api/?name=${currentUser.firstName}+${currentUser.lastName}&background=667eea&color=fff&size=150`;
    }

    this.role = this.authService.getRole() || 'TOURIST';
    this.lastLogin = new Date().toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
