import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-oauth2-callback',
  template: `
    <div class="min-vh-100 d-flex align-items-center justify-content-center">
      <div class="text-center">
        <div class="spinner-border text-primary mb-3"></div>
        <p>Connexion en cours...</p>
      </div>
    </div>
  `
})
export class OAuth2CallbackComponent implements OnInit {

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParams['token'];

    if (token) {
      // sauvegarder le token
      localStorage.setItem('accessToken', token);

      // décoder le token pour récupérer le rôle
      const payload = JSON.parse(atob(token.split('.')[1]));
      localStorage.setItem('role', payload.role);

      // rediriger selon le rôle
      if (payload.role === 'ADMIN') {
  this.router.navigate(['/admin']);
} else if (payload.role === 'HOST') {
  this.router.navigate(['/host']);
} else if (payload.role === 'ARTISAN') {
  this.router.navigate(['/artisan']);
} else if (payload.role === 'TOURIST') {
  this.router.navigate(['/tourist']);
} else {
  this.router.navigate(['/']);
}
    }
  }
}