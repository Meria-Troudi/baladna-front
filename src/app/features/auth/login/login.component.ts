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
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    
    this.loading = true;
    this.error = '';

    this.authService.login(this.form.value).subscribe({
      next: (res) => {
        this.loading = false;
        // Navigate to role-based dashboard routes
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
      error: (err) => {
        this.loading = false;
        console.error('Login error:', err);
        if (err.status === 0) {
          this.error = 'Impossible de se connecter au serveur. Vérifiez votre connexion.';
        } else if (err.status === 401 || err.status === 403) {
          this.error = 'Email ou mot de passe incorrect';
        } else {
          this.error = 'Une erreur est survenue. Veuillez réessayer.';
        }
      }
    });
  }
}