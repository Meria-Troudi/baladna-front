// features/admin/rh/applications-list/applications-list.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Application, Interview } from '../../../rh/rh.model';
import { RhService } from '../../../rh/rh.service';


@Component({
  selector: 'app-applications-list',
  templateUrl: './applications-list.component.html'
})
export class ApplicationsListComponent implements OnInit {
  applications: Application[] = [];
  interview: Interview | null = null;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private rhService: RhService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.rhService.getInterview(id).subscribe(i => this.interview = i);
    this.rhService.getApplications(id).subscribe({
      next: (data) => {
        this.applications = data;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  updateStatus(id: number, status: string): void {
    this.rhService.updateApplicationStatus(id, status).subscribe(updated => {
      const app = this.applications.find(a => a.id === id);
      if (app) {
        app.status = updated.status;
        if (status === 'ACCEPTED') {
          this.rhService.notifyWebhook(app.email).subscribe();
        }
      }
    });
  }

  getStatusColor(status: string): string {
    const colors: any = {
      'PENDING': 'bg-warning',
      'ACCEPTED': 'bg-success',
      'REJECTED': 'bg-danger',
      'INTERVIEW_SCHEDULED': 'bg-info'
    };
    return colors[status] || 'bg-secondary';
  }

  getScoreColor(score: number): string {
    if (score >= 70) return '#28a745';
    if (score >= 50) return '#ffc107';
    return '#dc3545';
  }
}