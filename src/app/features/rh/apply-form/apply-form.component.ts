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
  firstName: ['', [
    Validators.required,
    Validators.minLength(2),
    Validators.maxLength(50),
    Validators.pattern('^[a-zA-ZÀ-ÿ\\s\\-]+$')
  ]],
  lastName: ['', [
    Validators.required,
    Validators.minLength(2),
    Validators.maxLength(50),
    Validators.pattern('^[a-zA-ZÀ-ÿ\\s\\-]+$')
  ]],
  email: ['', [
    Validators.required,
    Validators.email,
    Validators.maxLength(100)
  ]],
  phone: ['', [
    Validators.required,
    Validators.pattern('^[0-9]{8}$') // exactement 8 chiffres
  ]],
  cin: ['', [
    Validators.required,
    Validators.pattern('^\\d{8}$') // exactement 8 chiffres
  ]],
  coverLetter: ['', [
    Validators.maxLength(2000) // optionnel mais limité
  ]]
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

  // Validation fichier CV
onFileChange(event: any): void {
  const file: File = event.target.files[0];
  if (!file) return;

  // ✅ PDF uniquement
  if (file.type !== 'application/pdf') {
    this.cvError = true;
    this.error = 'Only PDF files are accepted';
    return;
  }

  // ✅ Max 5MB
  if (file.size > 5 * 1024 * 1024) {
    this.cvError = true;
    this.error = 'File too large — maximum 5MB';
    return;
  }

  this.cvFile = file;
  this.cvError = false;
  this.error = '';
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
  // Autoriser uniquement les chiffres
onlyNumbers(event: KeyboardEvent): boolean {
  const charCode = event.charCode;
  return charCode >= 48 && charCode <= 57;
}


}