import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ItineraryService } from '../../services/itinerary.service';

// ─── CUSTOM VALIDATORS ───────────────────────────────────────────
const dateRangeValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const group = control as FormGroup;
  const startDate = group.get('startDate')?.value;
  const endDate = group.get('endDate')?.value;

  if (!startDate || !endDate) return null;

  // Parse dates properly without timezone issues
  const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
  const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
  
  const start = new Date(startYear, startMonth - 1, startDay).getTime();
  const end = new Date(endYear, endMonth - 1, endDay).getTime();

  return start > end ? { dateRangeError: true } : null;
};

const futureOrTodayValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  if (!control.value) return null;
  
  // Parse date string properly without timezone issues
  const [year, month, day] = control.value.split('-').map(Number);
  const date = new Date(year, month - 1, day).getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return date < today.getTime() ? { pastDate: true } : null;
};

@Component({
  selector: 'app-itinerary-create',
  templateUrl: './itinerary-create.component.html',
  styleUrls: ['./itinerary-create.component.scss']
})
export class ItineraryCreateComponent implements OnInit {

  form: FormGroup;
  loading = false;
  error = '';
  isEditMode = false;
  itineraryId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private itineraryService: ItineraryService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.maxLength(500)]],
      startDate: ['', [Validators.required, futureOrTodayValidator]],
      endDate: ['', [Validators.required, futureOrTodayValidator]],
      destinationRegion: ['', Validators.required],
      estimatedBudget: [null, [Validators.required, Validators.min(0.01)]],
      status: ['DRAFT'],
      visibility: ['PRIVATE']
    }, { validators: dateRangeValidator });
  }

  ngOnInit(): void {
    this.itineraryId = this.route.snapshot.paramMap.get('id');
    if (this.itineraryId) {
      this.isEditMode = true;
      this.loadItinerary();
    }
  }

  loadItinerary(): void {
    this.itineraryService.getById(this.itineraryId!).subscribe({
      next: (itin) => {
        this.form.patchValue({
          title: itin.title,
          description: itin.description,
          startDate: itin.startDate,
          endDate: itin.endDate,
          destinationRegion: itin.destinationRegion,
          estimatedBudget: itin.estimatedBudget,
          status: itin.status,
          visibility: itin.visibility
        });
      },
      error: () => this.error = 'Could not load itinerary'
    });
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  hasDateRangeError(): boolean {
    return !!(this.form.hasError('dateRangeError') && 
              (this.form.get('startDate')?.touched || this.form.get('endDate')?.touched));
  }

  getFieldError(field: string): string {
    const ctrl = this.form.get(field);
    if (!ctrl?.errors || !ctrl?.touched) return '';

    if (ctrl.hasError('required')) return `${field} is required`;
    if (ctrl.hasError('minLength')) {
      const req = ctrl.getError('minLength');
      return `${field} must be at least ${req.requiredLength} characters`;
    }
    if (ctrl.hasError('maxLength')) {
      const req = ctrl.getError('maxLength');
      return `${field} cannot exceed ${req.requiredLength} characters`;
    }
    if (ctrl.hasError('min')) {
      const req = ctrl.getError('min');
      return `${field} must be at least ${req.min}`;
    }
    if (ctrl.hasError('pastDate')) return `${field} cannot be in the past`;
    
    return '';
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';

    const request = this.form.value;

    const action = this.isEditMode
      ? this.itineraryService.update(this.itineraryId!, request)
      : this.itineraryService.create(request);

    action.subscribe({
      next: (result) => {
        this.loading = false;
        this.router.navigate(['/tourist/itineraries', result.id]);
      },
      error: () => {
        this.loading = false;
        this.error = this.isEditMode ? 'Failed to update itinerary' : 'Failed to create itinerary';
      }
    });
  }

  cancel(): void {
    if (this.isEditMode) {
      this.router.navigate(['/tourist/itineraries', this.itineraryId]);
    } else {
      this.router.navigate(['/tourist/itineraries']);
    }
  }
}