import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { LoginRequest, AuthResponse } from '../models/auth.model';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  form: FormGroup;
  error = '';
  loading = false;
  showPassword = false;

  showCamera = false;
  videoElement: HTMLVideoElement | null = null;
  canvasElement: HTMLCanvasElement | null = null;
  stream: MediaStream | null = null;
  faceLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      rememberMe: [false]
    });
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = '';

    const payload: LoginRequest = {
      email: this.form.value.email,
      password: this.form.value.password
    };

    this.authService.login(payload).subscribe({
      next: (res: AuthResponse) => {
        this.loading = false;
        this.navigateByRole(res.role);
      },
      error: (err: any) => {
        this.loading = false;

        if (err.status === 0) {
          this.error = 'Backend unavailable.';
        } else {
          this.error = 'Incorrect email or password.';
        }
      }
    });
  }

  openCamera(): void {
    this.error = '';
    this.showCamera = true;
    setTimeout(() => this.initCamera(), 100);
  }

  closeCamera(): void {
    this.showCamera = false;
    this.faceLoading = false;

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    this.videoElement = null;
    this.canvasElement = null;
  }

  private initCamera(): void {
    this.videoElement = document.getElementById('video') as HTMLVideoElement | null;
    this.canvasElement = document.getElementById('canvas') as HTMLCanvasElement | null;

    if (!this.videoElement) {
      this.error = 'Camera element not found.';
      this.closeCamera();
      return;
    }

    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then((stream: MediaStream) => {
        this.stream = stream;
        if (this.videoElement) {
          this.videoElement.srcObject = stream;
        }
      })
      .catch(() => {
        this.error = 'Cannot access camera.';
        this.closeCamera();
      });
  }

  capturePhoto(): void {
    if (!this.videoElement || !this.canvasElement) {
      this.error = 'Camera is not ready.';
      return;
    }

    const context = this.canvasElement.getContext('2d');
    if (!context) {
      this.error = 'Unable to capture photo.';
      return;
    }

    this.canvasElement.width = this.videoElement.videoWidth;
    this.canvasElement.height = this.videoElement.videoHeight;
    context.drawImage(this.videoElement, 0, 0);

    const imageBase64 = this.canvasElement.toDataURL('image/jpeg').split(',')[1];

    this.faceLoading = true;
    this.error = '';

    this.authService.faceRecognize(imageBase64).subscribe({
      next: (res) => {
        if (
          res.name &&
          res.name !== 'Unknown' &&
          res.name !== 'No face detected' &&
          !res.name.startsWith('Error')
        ) {
          this.authService.faceLogin(res.name).subscribe({
            next: (authRes: AuthResponse) => {
              this.faceLoading = false;
              this.closeCamera();
              this.navigateByRole(authRes.role);
            },
            error: () => {
              this.faceLoading = false;
              this.error = 'User not found. Please register first.';
            }
          });
        } else {
          this.faceLoading = false;
          this.error = 'Face not recognized. Please try again.';
        }
      },
      error: () => {
        this.faceLoading = false;
        this.error = 'Face recognition failed. Please try again.';
      }
    });
  }

  private navigateByRole(role: string): void {
    if (role === 'ADMIN') {
      this.router.navigate(['/admin/dashboard']);
    } else if (role === 'HOST') {
      this.router.navigate(['/host/dashboard']);
    } else if (role === 'ARTISAN') {
      this.router.navigate(['/artisan/dashboard']);
    } else {
      this.router.navigate(['/tourist/dashboard']);
    }
  }
}