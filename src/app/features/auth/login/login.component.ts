// src/app/features/auth/login/login.component.ts
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

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
  videoElement: any;
  canvasElement: any;
  stream: any;
  faceLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      rememberMe: [false]
    });
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';

    this.authService.login(this.form.value).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.role === 'ADMIN') {
          this.router.navigate(['/admin/dashboard']);
        } else if (res.role === 'HOST') {
          this.router.navigate(['/host/dashboard']);
        } else if (res.role === 'ARTISAN') {
          this.router.navigate(['/artisan/dashboard']);
        } else {
          this.router.navigate(['/tourist/dashboard']);
        }
      },
      error: () => {
        this.loading = false;
        this.error = 'Email ou mot de passe incorrect';
      }
    });
  }

  openCamera(): void {
    this.showCamera = true;
    setTimeout(() => this.initCamera(), 100);
  }

  closeCamera(): void {
    this.showCamera = false;
    if (this.stream) {
      this.stream.getTracks().forEach((track: any) => track.stop());
    }
  }

  private initCamera(): void {
    this.videoElement = document.getElementById('video');
    this.canvasElement = document.getElementById('canvas');

    if (this.videoElement) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then((stream) => {
          this.stream = stream;
          this.videoElement.srcObject = stream;
        })
        .catch(() => {
          this.error = 'Cannot access camera';
          this.closeCamera();
        });
    }
  }

  capturePhoto(): void {
    if (!this.videoElement || !this.canvasElement) return;

    const context = this.canvasElement.getContext('2d');
    this.canvasElement.width = this.videoElement.videoWidth;
    this.canvasElement.height = this.videoElement.videoHeight;
    context.drawImage(this.videoElement, 0, 0);

    const imageBase64 = this.canvasElement.toDataURL('image/jpeg').split(',')[1];

    this.faceLoading = true;
<<<<<<< HEAD
    this.error = '';

    // Backend appelle Python API et retourne directement les tokens
    this.authService.faceLogin(imageBase64).subscribe({
      next: (authRes) => {
        this.faceLoading = false;
        this.closeCamera();
        if (authRes.role === 'ADMIN') {
          this.router.navigate(['/admin/dashboard']);
        } else if (authRes.role === 'HOST') {
          this.router.navigate(['/host/dashboard']);
        } else if (authRes.role === 'ARTISAN') {
          this.router.navigate(['/artisan/dashboard']);
        } else {
          this.router.navigate(['/tourist/dashboard']);
        }
      },
      error: (err) => {
        this.faceLoading = false;
        this.error = err.error?.message || 'Face not recognized. Please try again.';
=======
    this.authService.faceRecognize(imageBase64).subscribe({
      next: (res) => {
        if (res.name && res.name !== 'Unknown' && res.name !== 'No face detected' && !res.name.startsWith('Error')) {
          this.authService.faceLogin(res.name).subscribe({
            next: (authRes) => {
              this.faceLoading = false;
              this.closeCamera();
              if (authRes.role === 'ADMIN') {
                this.router.navigate(['/admin/dashboard']);
              } else if (authRes.role === 'HOST') {
                this.router.navigate(['/host/dashboard']);
              } else if (authRes.role === 'ARTISAN') {
                this.router.navigate(['/artisan/dashboard']);
              } else {
                this.router.navigate(['/tourist/dashboard']);
              }
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
>>>>>>> 4ccebdbd6c3d33473beec788c0d97eaf73ebe101
      }
    });
  }
}