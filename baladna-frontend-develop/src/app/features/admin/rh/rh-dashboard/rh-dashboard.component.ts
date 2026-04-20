// features/admin/rh/rh-dashboard/rh-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Interview } from '../../../rh/rh.model';
import { RhService } from '../../../rh/rh.service';


@Component({
  selector: 'app-rh-dashboard',
  templateUrl: './rh-dashboard.component.html'
})
export class RhDashboardComponent implements OnInit {
  interviews: Interview[] = [];
  loading = true;
  showCreateForm = false;
  error = '';

  newInterview = {
    title: '',
    description: '',
    location: '',
    department: '',
    contractType: 'CDI',
    scheduledAt: '',
    maxCandidates: 10,
    requiredSkills: '',
    experienceYears: 1
  };

  constructor(private rhService: RhService, private router: Router) {}

  ngOnInit(): void {
    this.loadInterviews();
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) {
      this.resetForm();
    }
  }

  loadInterviews(): void {
    this.rhService.getAllInterviews().subscribe({
      next: (data) => {
        this.interviews = data;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  createInterview(): void {
    this.rhService.createInterview(this.newInterview as any).subscribe({
      next: () => {
        this.showCreateForm = false;
        this.loadInterviews();
        this.resetForm();
      },
      error: (err) => this.error = 'Erreur lors de la création'
    });
  }

  updateStatus(id: number, status: string): void {
    this.rhService.updateInterviewStatus(id, status).subscribe(() => {
      this.loadInterviews();
    });
  }

  deleteInterview(id: number): void {
    if (confirm('Supprimer cet entretien ?')) {
      this.rhService.deleteInterview(id).subscribe(() => {
        this.loadInterviews();
      });
    }
  }

  viewApplications(id: number): void {
    this.router.navigate(['/admin/rh/applications', id]);
  }

  getStatusColor(status: string): string {
    const colors: any = {
      'OPEN': 'bg-success',
      'CLOSED': 'bg-secondary',
      'CANCELLED': 'bg-danger'
    };
    return colors[status] || 'bg-primary';
  }

  resetForm(): void {
    this.newInterview = {
      title: '', description: '', location: '',
      department: '', contractType: 'CDI',
      scheduledAt: '', maxCandidates: 10,
      requiredSkills: '', experienceYears: 1
    };
  }
}