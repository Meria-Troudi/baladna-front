import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GoogleCalendarService, OAuthResponse } from '../../services/google-calendar.service';

@Component({
  selector: 'app-oauth-callback',
  template: `
    <div class="oauth-callback-container">
      <div class="callback-card">
        <div class="spinner" *ngIf="isProcessing">
          <div class="spinner-circle"></div>
        </div>
        
        <div class="content" *ngIf="!isProcessing">
          <div [ngClass]="'icon-' + (isSuccess ? 'success' : 'error')">
            <i [ngClass]="isSuccess ? 'bi bi-check-circle' : 'bi bi-exclamation-circle'"></i>
          </div>
          
          <h2>{{ isSuccess ? 'Success!' : 'Error' }}</h2>
          <p>{{ message }}</p>
          
          <p class="closing-message">This window will close automatically...</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .oauth-callback-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    }

    .callback-card {
      background: white;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      text-align: center;
      max-width: 400px;
      width: 90%;
    }

    .spinner {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100px;
    }

    .spinner-circle {
      width: 50px;
      height: 50px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .content {
      animation: fadeIn 0.3s ease-in-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .icon-success {
      font-size: 60px;
      color: #28a745;
      margin-bottom: 20px;
      animation: scaleIn 0.5s ease-out;
    }

    .icon-error {
      font-size: 60px;
      color: #dc3545;
      margin-bottom: 20px;
      animation: scaleIn 0.5s ease-out;
    }

    @keyframes scaleIn {
      from { transform: scale(0); }
      to { transform: scale(1); }
    }

    h2 {
      margin: 20px 0 10px;
      color: #333;
      font-size: 24px;
    }

    p {
      color: #666;
      font-size: 16px;
      margin: 10px 0;
      line-height: 1.5;
    }

    .closing-message {
      font-size: 14px;
      color: #999;
      margin-top: 20px;
      font-style: italic;
    }
  `]
})
export class OAuthCallbackComponent implements OnInit {
  isProcessing = true;
  isSuccess = false;
  message = 'Processing authorization...';

  constructor(
    private route: ActivatedRoute,
    private googleCalendarService: GoogleCalendarService
  ) {}

  ngOnInit(): void {
    // Get authorization code from query parameters
    this.route.queryParams.subscribe((params) => {
      const code = params['code'];
      const error = params['error'];

      if (error) {
        this.handleError(error);
        return;
      }

      if (!code) {
        this.handleError('No authorization code received');
        return;
      }

      // Handle the OAuth callback
      this.handleOAuthCallback(code);
    });
  }

  /**
   * Process the authorization code with backend
   */
  private handleOAuthCallback(code: string): void {
    this.googleCalendarService.handleOAuthCallback(code).subscribe({
      next: (response: OAuthResponse) => {
        this.isSuccess = response.success;
        this.message = response.message || 'Authorization successful!';
        
        // Send result to parent window
        this.postMessageToParent(response);
        
        // Close after 1.5 seconds
        setTimeout(() => {
          window.close();
        }, 1500);
      },
      error: (error) => {
        const message = error.message || 'Authorization failed';
        this.handleError(message);
      }
    });
  }

  /**
   * Handle error cases
   */
  private handleError(error: string): void {
    this.isProcessing = false;
    this.isSuccess = false;
    this.message = error || 'An error occurred during authorization';

    // Send error to parent window
    this.postMessageToParent({
      success: false,
      message: this.message,
      userId: 0
    });

    // Close after 3 seconds
    setTimeout(() => {
      window.close();
    }, 3000);
  }

  /**
   * Send message to parent window
   */
  private postMessageToParent(result: OAuthResponse): void {
    if (window.opener) {
      window.opener.postMessage(
        {
          type: 'oauth-callback-result',
          data: result
        },
        window.location.origin
      );
    }
  }
}
