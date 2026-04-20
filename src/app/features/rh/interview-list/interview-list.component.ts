// features/rh/interview-list/interview-list.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Interview } from '../rh.model';
import { RhService } from '../rh.service';


@Component({
  selector: 'app-interview-list',
  templateUrl: './interview-list.component.html'
})
export class InterviewListComponent implements OnInit {
  interviews: Interview[] = [];
  loading = true;
  selectedDepartment = '';
  selectedContract = '';
  keyword = '';
  departments: string[] = [];
  contracts: string[] = [];

  constructor(private rhService: RhService, private router: Router) {}

  ngOnInit(): void {
    this.rhService.getOpenInterviews().subscribe({
      next: (data) => {
        this.interviews = data;
        this.departments = [...new Set(data.map(i => i.department))];
        this.contracts = [...new Set(data.map(i => i.contractType))];
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  get filteredInterviews(): Interview[] {
    return this.interviews.filter(i => {
      const matchDept = !this.selectedDepartment || i.department === this.selectedDepartment;
      const matchContract = !this.selectedContract || i.contractType === this.selectedContract;
      const matchKeyword = !this.keyword ||
        i.title.toLowerCase().includes(this.keyword.toLowerCase()) ||
        i.description.toLowerCase().includes(this.keyword.toLowerCase());
      return matchDept && matchContract && matchKeyword;
    });
  }

  apply(interview: Interview): void {
    this.router.navigate(['/rh/apply', interview.id]);
  }

  getSkills(skills: string): string[] {
    return skills ? skills.split(',').map(s => s.trim()) : [];
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
}