import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ItineraryService } from '../../itinerary/services/itinerary.service';
import { Itinerary } from '../../itinerary/models/itinerary.model';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-tourist-dashboard',
  templateUrl: './tourist-dashboard.component.html',
  styleUrls: ['./tourist-dashboard.component.css']
})
export class TouristDashboardComponent implements OnInit {

  recentItineraries: Itinerary[] = [];
  loadingItineraries = false;
  userName = '';

  constructor(
    private router: Router,
    private itineraryService: ItineraryService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.userName = user ? user.firstName : 'Traveler';
    this.loadRecentItineraries();
  }

  loadRecentItineraries(): void {
    this.loadingItineraries = true;
    this.itineraryService.getMyItineraries().subscribe({
      next: (data) => {
        // Show only the 3 most recent itineraries
        this.recentItineraries = data.slice(0, 3);
        this.loadingItineraries = false;
      },
      error: () => {
        this.loadingItineraries = false;
      }
    });
  }

  // Navigation actions
  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  createItinerary(): void {
    this.router.navigate(['/tourist/itineraries/create']);
  }

  viewItinerary(id: string): void {
    this.router.navigate(['/tourist/itineraries', id]);
  }

  viewAllItineraries(): void {
    this.router.navigate(['/tourist/itineraries']);
  }

  // Calendar API stub (to be implemented later)
  openPlanningCalendar(): void {
    // TODO: integrate with external calendar API (Google Calendar, etc.)
    alert('📅 Planning Calendar API — will sync your itinerary dates and events.');
    // Example: this.calendarService.connect();
  }

  // Helper methods for itinerary display
  getDaysCount(start: string, end: string): number {
    const diff = new Date(end).getTime() - new Date(start).getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  getStatusColor(status: string): string {
    const map: Record<string, string> = {
      'DRAFT': '#856404',
      'ACTIVE': '#0a5c36',
      'COMPLETED': '#084298',
      'CANCELLED': '#842029'
    };
    return map[status] || '#666';
  }

  getStatusBg(status: string): string {
    const map: Record<string, string> = {
      'DRAFT': '#fff3cd',
      'ACTIVE': '#d1e7dd',
      'COMPLETED': '#cfe2ff',
      'CANCELLED': '#f8d7da'
    };
    return map[status] || '#f0f0f0';
  }
}