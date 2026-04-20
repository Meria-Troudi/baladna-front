// features/rh/apply-form/apply-form.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Application, Interview } from '../rh.model';
import { RhService } from '../rh.service';


@Component({
  selector: 'app-apply-form',
  templateUrl: './apply-form.component.html'
})
export class ApplyFormComponent implements OnInit {
  form: FormGroup;
  interview: Interview | null = null;
  cvFile: File | null = null;
  loading = false;
  success = false;
  error = '';
  result: Application | null = null;
  cvError = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    public router: Router,
    private rhService: RhService
  ) {
    this.form = this.fb.group({
      firstName:   ['', Validators.required],
      lastName:    ['', Validators.required],
      email:       ['', [Validators.required, Validators.email]],
      phone:       ['', [Validators.required, Validators.pattern('^[0-9]{8}$')]],
      cin:         ['', [Validators.required, Validators.pattern('^\\d{8}$')]],
      coverLetter: ['']
    });
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.rhService.getInterview(id).subscribe({
      next: (i) => this.interview = i,
      error: () => this.router.navigate(['/rh/interviews'])
    });
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  triggerFileInput(): void {
    document.getElementById('cvInput')?.click();
  }

  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.cvFile = file;
      this.cvError = false;
    }
  }

  getSkills(): string[] {
    return this.interview?.requiredSkills?.split(',').map(s => s.trim()) || [];
  }

  getScoreColor(): string {
    const score = this.result?.atsScore || 0;
    if (score >= 70) return 'bg-success';
    if (score >= 50) return 'bg-warning';
    return 'bg-danger';
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (!this.cvFile) {
      this.cvError = true;
      return;
    }
    if (!this.interview) return;

    this.loading = true;
    this.error = '';

    const request = {
      ...this.form.value,
      interviewId: this.interview.id
    };

    this.rhService.apply(request, this.cvFile).subscribe({
      next: (app) => {
        this.loading = false;
        this.success = true;
        this.result = app;
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Erreur lors de la candidature';
      }
    });
  }
}