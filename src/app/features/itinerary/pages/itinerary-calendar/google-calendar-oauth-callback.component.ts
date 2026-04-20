import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GoogleCalendarService } from '../../services/google-calendar.service';

/**
 * Component to handle Google Calendar OAuth callback
 * This page is shown after user authorizes the app with Google
 */
@Component({
  selector: 'app-google-calendar-oauth-callback',
  templateUrl: './google-calendar-oauth-callback.component.html',
  styleUrls: ['./google-calendar-oauth-callback.component.css']
})
export class GoogleCalendarOAuthCallbackComponent implements OnInit {

  loading = true;
  success = false;
  error = '';
  message = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private googleCalendarService: GoogleCalendarService
  ) {}

  ngOnInit(): void {
    this.handleOAuthCallback();
  }

  /**
   * Extract authorization code from URL and process it
   */
  private handleOAuthCallback(): void {
    this.route.queryParams.subscribe((params) => {
      const code = params['code'];
      const error = params['error'];

      if (error) {
        this.handleError(error, params['error_description']);
      } else if (code) {
        this.processAuthorizationCode(code);
      } else {
        this.handleError('NO_CODE', 'No authorization code received from Google');
      }
    });
  }

  /**
   * Send authorization code to backend
   */
  private processAuthorizationCode(code: string): void {
    this.googleCalendarService.handleOAuthCallback(code).subscribe({
      next: (response) => {
        this.loading = false;
        this.success = true;
        this.message = response.message || 'Google Calendar connected successfully!';
        
        // Emit OAuth result for popup communication if available
        if (window.opener) {
          window.opener.postMessage({
            type: 'oauth-callback-result',
            data: response
          }, window.location.origin);
        }

        // Redirect to tourist dashboard after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/tourist/dashboard']);
        }, 2000);
      },
      error: (error) => {
        this.handleError(
          'CALLBACK_ERROR',
          error.error?.message || 'Failed to process authorization. Please try again.'
        );
      }
    });
  }

  /**
   * Handle error
   */
  private handleError(errorCode: string, errorDescription: string): void {
    this.loading = false;
    this.success = false;
    this.error = errorCode;
    this.message = errorDescription;

    console.error('OAuth callback error:', errorCode, errorDescription);

    // Redirect to dashboard after 3 seconds
    setTimeout(() => {
      this.router.navigate(['/tourist/dashboard']);
    }, 3000);
  }

  /**
   * Manual redirect button
   */
  redirectToDashboard(): void {
    this.router.navigate(['/tourist/dashboard']);
  }
}
