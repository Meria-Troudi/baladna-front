import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProfileUserService, User, Session, ActivityLog } from './user.service';
import { ProfileAuthService } from './auth.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  sessions: Session[] = [];
  activity: ActivityLog[] = [];

  profileForm: FormGroup;
  passwordForm: FormGroup;

  profileLoading = false;
  profileSuccess = false;
  passwordLoading = false;
  passwordError = '';
  passwordSuccess = false;

  constructor(
    private fb: FormBuilder,
    private userService: ProfileUserService,
    public authService: ProfileAuthService
  ) {
    this.profileForm = this.fb.group({
      firstName: [''],
      lastName: [''],
      preferredLanguage: ['FR']
    });

    this.passwordForm = this.fb.group({
      oldPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    this.loadProfile();
    this.loadSessions();
    this.loadActivity();
  }

  loadProfile(): void {
    this.userService.getMyProfile().subscribe({
      next: (user: User) => {
        this.user = user;
        this.profileForm.patchValue({
          firstName: user.firstName,
          lastName: user.lastName,
          preferredLanguage: user.preferredLanguage
        });
      },
      error: () => {
        const currentUser = this.authService.getCurrentUser();
        if (currentUser) {
          this.user = {
            id: 0,
            firstName: currentUser.firstName,
            lastName: currentUser.lastName,
            email: currentUser.email,
            role: this.authService.getRole() as any,
            status: 'ACTIVE',
            preferredLanguage: 'FR'
          };
          this.profileForm.patchValue({
            firstName: currentUser.firstName,
            lastName: currentUser.lastName
          });
        }
      }
    });
  }

  loadSessions(): void {
    this.userService.getMySessions().subscribe({
      next: (s: Session[]) => this.sessions = s,
      error: () => this.sessions = []
    });
  }

  loadActivity(): void {
    this.userService.getMyActivity().subscribe({
      next: (a: ActivityLog[]) => this.activity = a,
      error: () => this.activity = []
    });
  }

  updateProfile(): void {
    this.profileLoading = true;
    this.userService.updateMyProfile(this.profileForm.value).subscribe({
      next: (user: User) => {
        this.user = user;
        this.profileLoading = false;
        this.profileSuccess = true;
        setTimeout(() => this.profileSuccess = false, 3000);
      },
      error: () => this.profileLoading = false
    });
  }

  changePassword(): void {
    this.passwordLoading = true;
    this.passwordError = '';
    this.userService.changePassword(this.passwordForm.value).subscribe({
      next: () => {
        this.passwordLoading = false;
        this.passwordSuccess = true;
        this.passwordForm.reset();
        setTimeout(() => this.passwordSuccess = false, 3000);
      },
      error: (err: any) => {
        this.passwordLoading = false;
        this.passwordError = err.error?.message || 'Ancien mot de passe incorrect';
      }
    });
  }

  logoutAll(): void {
    this.userService.logoutAllSessions().subscribe({
      next: () => {
        this.sessions = [];
        this.authService.logout();
      },
      error: () => {
        this.sessions = [];
        this.authService.logout();
      }
    });
  }
}
