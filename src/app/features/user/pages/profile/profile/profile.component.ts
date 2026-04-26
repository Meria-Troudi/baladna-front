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

<<<<<<< HEAD
  sessionsTotal = 0;
  sessionsPage = 0;
  sessionsSize = 5;
  sessionsTotalPages = 0;

  activityTotal = 0;
  activityPage = 0;
  activitySize = 5;
  activityTotalPages = 0;

=======
>>>>>>> 4ccebdbd6c3d33473beec788c0d97eaf73ebe101
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

<<<<<<< HEAD
  loadSessions(page: number = 0): void {
    this.userService.getMySessions(page, this.sessionsSize).subscribe({
      next: (res) => {
        if (res && res.content) {
          this.sessions = res.content;
          this.sessionsTotal = res.totalElements;
          this.sessionsTotalPages = res.totalPages;
          this.sessionsPage = page;
        } else if (Array.isArray(res)) {
          this.sessions = res;
          this.sessionsTotal = res.length;
          this.sessionsTotalPages = Math.max(1, Math.ceil(res.length / this.sessionsSize));
          this.sessionsPage = page;
          this.sessions = res.slice(page * this.sessionsSize, (page + 1) * this.sessionsSize);
        } else {
          this.sessions = [];
          this.sessionsTotal = 0;
          this.sessionsTotalPages = 0;
        }
      },
=======
  loadSessions(): void {
    this.userService.getMySessions().subscribe({
      next: (s: Session[]) => this.sessions = s,
>>>>>>> 4ccebdbd6c3d33473beec788c0d97eaf73ebe101
      error: () => this.sessions = []
    });
  }

<<<<<<< HEAD
  loadActivity(page: number = 0): void {
    this.userService.getMyActivity(page, this.activitySize).subscribe({
      next: (res) => {
        if (res && res.content) {
          this.activity = res.content;
          this.activityTotal = res.totalElements;
          this.activityTotalPages = res.totalPages;
          this.activityPage = page;
        } else if (Array.isArray(res)) {
          this.activity = res;
          this.activityTotal = res.length;
          this.activityTotalPages = Math.max(1, Math.ceil(res.length / this.activitySize));
          this.activityPage = page;
          this.activity = res.slice(page * this.activitySize, (page + 1) * this.activitySize);
        } else {
          this.activity = [];
          this.activityTotal = 0;
          this.activityTotalPages = 0;
        }
      },
=======
  loadActivity(): void {
    this.userService.getMyActivity().subscribe({
      next: (a: ActivityLog[]) => this.activity = a,
>>>>>>> 4ccebdbd6c3d33473beec788c0d97eaf73ebe101
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
<<<<<<< HEAD

 onPhotoUpdated(photoPath: string | null): void {
  if (this.user) {
    this.user = { ...this.user, profilePhoto: photoPath ?? undefined };
  }
}
=======
>>>>>>> 4ccebdbd6c3d33473beec788c0d97eaf73ebe101
}
