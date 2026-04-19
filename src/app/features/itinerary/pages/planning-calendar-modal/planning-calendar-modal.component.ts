import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { GoogleCalendarService } from '../../services/google-calendar.service';
import { ItineraryService } from '../../services/itinerary.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { Itinerary } from '../../models/itinerary.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-planning-calendar-modal',
  templateUrl: './planning-calendar-modal.component.html',
  styleUrls: ['./planning-calendar-modal.component.css']
})
export class PlanningCalendarModalComponent implements OnInit, OnDestroy {

  @Input() showModal: boolean = false;
  @Output() closeModal = new EventEmitter<void>();

  // States
  isConnecting: boolean = false;
  isConnected: boolean = false;
  isSyncing: boolean = false;

  // Messages
  successMessage: string = '';
  errorMessage: string = '';

  // Data
  recentItineraries: Itinerary[] = [];
  loadingItineraries: boolean = false;
  selectedItineraryForSync: string | null = null;

  // UI Control
  showItineraryList: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(
    private googleCalendarService: GoogleCalendarService,
    private itineraryService: ItineraryService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.checkConnectionStatus();
    this.setupOAuthListener();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Check if user is already connected to Google Calendar
   */
  checkConnectionStatus(): void {
    this.googleCalendarService.checkConnectionStatus()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (status) => {
          this.isConnected = status;
          if (status) {
            this.loadRecentItineraries();
          }
        },
        error: (error) => {
          console.error('Failed to check connection status', error);
          this.errorMessage = 'Failed to check connection status';
        }
      });
  }

  /**
   * Initiate Google Calendar connection with proper popup handling
   */
  connectToGoogleCalendar(): void {
    this.isConnecting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.googleCalendarService.openGoogleCalendarAuth()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isConnecting = false;
          this.isConnected = true;
          const message = response.message || 'Google Calendar connected successfully!';
          this.successMessage = message;
          this.notificationService.success(message);
          
          // Load itineraries after successful connection
          this.loadRecentItineraries();

          // Clear message after 3 seconds
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        },
        error: (error) => {
          this.isConnecting = false;
          const errorMessage = error?.message || error?.error?.message || 'Failed to connect Google Calendar. Please try again.';
          this.errorMessage = errorMessage;
          this.notificationService.error(errorMessage);
          console.error('Error connecting to Google Calendar', error);
        }
      });
  }

  /**
   * Setup listener for OAuth callback result from popup
   */
  private setupOAuthListener(): void {
    this.googleCalendarService.oAuthResult$
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if (result.success) {
          this.handleOAuthSuccess(result);
        } else {
          this.handleOAuthError(result);
        }
      });
  }

  /**
   * Handle successful OAuth callback
   */
  private handleOAuthSuccess(result: any): void {
    this.isConnecting = false;
    this.isConnected = true;
    const message = result.message || 'Google Calendar connected successfully!';
    this.successMessage = message;
    this.notificationService.success(message);
    
    // Load itineraries after successful connection
    this.loadRecentItineraries();

    // Clear message after 3 seconds
    setTimeout(() => {
      this.successMessage = '';
    }, 3000);
  }

  /**
   * Handle failed OAuth callback
   */
  private handleOAuthError(result: any): void {
    this.isConnecting = false;
    const errorMessage = result.message || 'Failed to connect Google Calendar. Please try again.';
    this.errorMessage = errorMessage;
    this.notificationService.error(errorMessage);
  }

  /**
   * Load recent itineraries for syncing
   */
  private loadRecentItineraries(): void {
    this.loadingItineraries = true;
    
    this.itineraryService.getMyItineraries()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (itineraries) => {
          this.recentItineraries = itineraries; // Show all itineraries
          this.loadingItineraries = false;
        },
        error: (error) => {
          console.error('Failed to load itineraries', error);
          this.loadingItineraries = false;
          this.errorMessage = 'Failed to load itineraries';
        }
      });
  }

  /**
   * Sync selected itinerary to Google Calendar
   */
  syncItinerary(itineraryId: string): void {
    this.isSyncing = true;
    this.selectedItineraryForSync = itineraryId;
    this.errorMessage = '';
    this.successMessage = '';

    this.googleCalendarService.syncItinerary(itineraryId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.isSyncing = false;
          this.selectedItineraryForSync = null;
          const message = response.message || 'Successfully synced to Google Calendar!';
          this.successMessage = message;
          this.notificationService.success(message);

          // Close modal after success
          setTimeout(() => {
            this.onCloseModal();
          }, 2000);
        },
        error: (error: any) => {
          this.isSyncing = false;
          this.selectedItineraryForSync = null;
          const errorMessage = error?.error?.message || 'Failed to sync itinerary. Please try again.';
          this.errorMessage = errorMessage;
          this.notificationService.error(errorMessage);
          console.error('Error syncing itinerary', error);
        }
      });
  }

  /**
   * Disconnect Google Calendar
   */
  disconnectGoogleCalendar(): void {
    if (!confirm('Are you sure you want to disconnect Google Calendar?')) {
      return;
    }

    this.googleCalendarService.disconnectCalendar()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.isConnected = false;
          const message = response.message || 'Google Calendar disconnected successfully';
          this.successMessage = message;
          this.notificationService.success(message);
          this.recentItineraries = [];
          
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        },
        error: (error: any) => {
          const errorMessage = error?.error?.message || 'Failed to disconnect Google Calendar';
          this.errorMessage = errorMessage;
          this.notificationService.error(errorMessage);
          console.error('Error disconnecting', error);
        }
      });
  }

  /**
   * Toggle itinerary list visibility
   */
  toggleItineraryList(): void {
    this.showItineraryList = !this.showItineraryList;
  }

  /**
   * Close modal
   */
  onCloseModal(): void {
    this.showModal = false;
    this.errorMessage = '';
    this.successMessage = '';
    this.showItineraryList = false;
    this.closeModal.emit();
  }

  /**
   * Get step count for display
   */
  getStepCount(itinerary: Itinerary): number {
    return itinerary.steps?.length || 0;
  }

  /**
   * Get days count
   */
  getDaysCount(start: string, end: string): number {
    const diff = new Date(end).getTime() - new Date(start).getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
}
