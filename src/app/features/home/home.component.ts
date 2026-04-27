<<<<<<< HEAD
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Interview } from '../rh/rh.model';
import { RhService } from '../rh/rh.service';
=======
import { Component } from '@angular/core';
import { Router } from '@angular/router';
>>>>>>> origin/marketplace-frontend

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
<<<<<<< HEAD
export class HomeComponent implements OnInit {
  interviews: Interview[] = [];
  loading = true;

  constructor(private router: Router, private rhService: RhService) {}

  ngOnInit(): void {
    this.rhService.getOpenInterviews().subscribe({
      next: (data) => {
        this.interviews = data.slice(0, 6);
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }
=======
export class HomeComponent {
  constructor(private router: Router) {}
>>>>>>> origin/marketplace-frontend

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }
<<<<<<< HEAD

  goToInterviews(): void {
    this.router.navigate(['/rh/interviews']);
  }

  goToApply(interview: Interview): void {
    this.router.navigate(['/rh/apply', interview.id]);
  }

  getContractColor(type: string): string {
    const colors: any = {
      'CDI': 'bg-success',
      'CDD': 'bg-warning',
      'Stage': 'bg-info',
      'Freelance': 'bg-secondary'
    };
    return colors[type] || 'bg-primary';
  }
=======
>>>>>>> origin/marketplace-frontend
}
