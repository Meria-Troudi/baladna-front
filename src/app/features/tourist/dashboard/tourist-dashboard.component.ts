import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tourist-dashboard',
  templateUrl: './tourist-dashboard.component.html',
  styleUrls: ['./tourist-dashboard.component.css']
})
export class TouristDashboardComponent implements OnInit {
  

  constructor(private router: Router) {}

  ngOnInit(): void {}

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }
}
