import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-step-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './step-details.component.html',
  styleUrls: ['./step-details.component.css']
})
export class StepDetailsComponent implements OnInit {
  @Input() form!: FormGroup;

  /** Parent should open the location modal (rendered outside overflow:hidden layout). */
  @Output() openLocationPicker = new EventEmitter<void>();

  minDate: string = '';

  ngOnInit(): void {
    // Set minimum date to today
    const today = new Date();
    this.minDate = this.toISOString(today);
  }

  toISOString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  getErrorMessage(field: string): string {
    const control = this.form.get(field);
    if (!control || !control.errors || !control.touched) return '';

    if (control.errors['required']) return 'This field is required';
    if (control.errors['minlength']) return `Minimum ${control.errors['minlength'].requiredLength} characters`;
    if (control.errors['min']) return `Minimum value is ${control.errors['min'].min}`;

    return '';
  }

  hasError(field: string): boolean {
    const control = this.form.get(field);
    return !!(control && control.errors && control.touched);
  }

  openMapPicker(): void {
    this.openLocationPicker.emit();
  }
}