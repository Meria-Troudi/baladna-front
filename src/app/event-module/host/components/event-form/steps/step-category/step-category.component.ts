import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-step-category',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './step-category.component.html',
  styleUrls: ['./step-category.component.css']
})
export class StepCategoryComponent implements OnInit {
  @Input() categories: string[] = [];
  @Input() selectedCategory: string = '';
  @Output() categorySelected = new EventEmitter<string>();

  ngOnInit(): void {
    // Component initialized
  }

  selectCategory(category: string): void {
    this.categorySelected.emit(category);
  }
}
