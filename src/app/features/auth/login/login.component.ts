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

    console.log('[LoginComponent] payload sent to backend:', payload);

    this.authService.login(payload).subscribe({
      next: (res: AuthResponse) => {
        this.loading = false;
        console.log('[LoginComponent] login success:', res);

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
      error: (err: any) => {
        this.loading = false;
        console.error('[LoginComponent] login error:', err);

        if (err.status === 0) {
          this.error = 'Erreur CORS ou backend inaccessible.';
        } else {
          this.error = 'Email ou mot de passe incorrect';
        }
      }
    });
  }
}