import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ItineraryService } from '../../services/itinerary.service';
import { Itinerary } from '../../models/itinerary.model';

@Component({
  selector: 'app-itinerary-list',
  templateUrl: './itinerary-list.component.html',
  styleUrls: ['./itinerary-list.component.scss']
})
export class ItineraryListComponent implements OnInit {

  @ViewChild('confirmationModal') confirmationModal: any;

  myItineraries: Itinerary[] = [];
  publicItineraries: Itinerary[] = [];
  activeTab: 'my' | 'public' = 'my';
  loading = false;
  error = '';
  successMessage = '';
  private deleteCallback: (() => void) | null = null;

  constructor(
    private itineraryService: ItineraryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadMyItineraries();
    this.loadPublicItineraries();
  }

  loadMyItineraries(): void {
    this.loading = true;
    this.itineraryService.getMyItineraries().subscribe({
      next: (data) => {
        this.myItineraries = data;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load your itineraries';
        this.loading = false;
      }
    });
  }

  loadPublicItineraries(): void {
    this.itineraryService.getPublicItineraries().subscribe({
      next: (data) => {
        this.publicItineraries = data;
      },
      error: () => {}
    });
  }

  viewItinerary(id: string): void {
    this.router.navigate(['/tourist/itineraries', id]);
  }

  createNew(): void {
    this.router.navigate(['/tourist/itineraries/create']);
  }

  goToRecommendations(): void {
    this.router.navigate(['/tourist/itineraries/recommendations']);
  }

  joinItinerary(id: string): void {
    this.itineraryService.requestToJoin(id).subscribe({
      next: () => {
        this.successMessage = 'Join request sent! Waiting for owner approval.';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.error = err?.error?.message || 'Could not send join request';
        setTimeout(() => this.error = '', 3000);
      }
    });
  }

  deleteItinerary(id: string, event: Event): void {
    event.stopPropagation();
    if (!this.confirmationModal) {
      console.error('Confirmation modal not initialized');
      return;
    }

    this.deleteCallback = () => {
      this.itineraryService.delete(id).subscribe({
        next: () => {
          this.myItineraries = this.myItineraries.filter(i => i.id !== id);
          this.successMessage = 'Itinerary deleted successfully';
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: () => {
          this.error = 'Failed to delete itinerary';
          setTimeout(() => this.error = '', 3000);
        }
      });
    };

    this.confirmationModal.show({
      title: 'Delete Itinerary',
      message: 'Are you sure you want to delete this itinerary? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isDangerous: true
    });
  }

  onConfirmationConfirmed(): void {
    if (this.deleteCallback) {
      this.deleteCallback();
      this.deleteCallback = null;
    }
  }

  onConfirmationCancelled(): void {
    this.deleteCallback = null;
  }

  getStatusBadgeClass(status: string): string {
    const map: Record<string, string> = {
      'DRAFT': 'badge-draft',
      'ACTIVE': 'badge-active',
      'COMPLETED': 'badge-completed',
      'CANCELLED': 'badge-cancelled'
    };
    return map[status] || 'badge-draft';
  }

  getDaysCount(start: string, end: string): number {
    const diff = new Date(end).getTime() - new Date(start).getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
}