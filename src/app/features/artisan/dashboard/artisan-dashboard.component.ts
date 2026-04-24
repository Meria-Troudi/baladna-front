import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-artisan-dashboard',
  templateUrl: './artisan-dashboard.component.html',
  styleUrls: ['./artisan-dashboard.component.css']
})
export class ArtisanDashboardComponent implements OnInit {
  

  constructor(private router: Router) {}

  ngOnInit(): void {}

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }
}
