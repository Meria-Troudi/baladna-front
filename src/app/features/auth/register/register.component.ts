import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { RegisterRequest, AuthResponse } from '../models/auth.model';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  form: FormGroup;
  error = '';
  success = false;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {

    this.form = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['TOURIST'],
      preferredLanguage: ['FR'], // ✅ FIX IMPORTANT
      acceptTerms: [false] // ✅ pas obligatoire
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
    this.success = false;

    const payload: RegisterRequest = {
      firstName: this.form.value.firstName,
      lastName: this.form.value.lastName,
      email: this.form.value.email,
      password: this.form.value.password,
      role: this.form.value.role,
      preferredLanguage: this.form.value.preferredLanguage
    };

    this.authService.register(payload).subscribe({
      next: (res: AuthResponse) => {
        this.loading = false;
        this.success = true;

        setTimeout(() => {
          if (res.role === 'ADMIN') {
            this.router.navigate(['/admin/dashboard']);
          } else if (res.role === 'HOST') {
            this.router.navigate(['/host/dashboard']);
          } else if (res.role === 'ARTISAN') {
            this.router.navigate(['/artisan/dashboard']);
          } else {
            this.router.navigate(['/tourist/dashboard']);
          }
        }, 1000);
      },

      error: (err: any) => {
        this.loading = false;

        if (err.error?.message) {
          this.error = err.error.message;
        } else if (typeof err.error === 'string' && err.error.trim()) {
          this.error = err.error;
        } else if (err.status === 409) {
          this.error = 'Email is already in use.';
        } else if (err.status === 400) {
          this.error = 'Invalid data.';
        } else if (err.status === 0) {
          this.error = 'Backend not reachable.';
        } else {
          this.error = 'Registration failed. Please try again.';
        }
      }
    });
  }
}