import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, BehaviorSubject, throwError, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AuthService } from '../../auth/services/auth.service';

export interface OAuthResponse {
  success: boolean;
  message: string;
  userId: number;
  isSynced?: boolean;
  calendarId?: string;
  tokenExpiry?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GoogleCalendarService {

  private apiUrl = '/api/itineraries/calendar';
  
  private oAuthResultSubject = new Subject<OAuthResponse>();
  public oAuthResult$ = this.oAuthResultSubject.asObservable();

  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  public connectionStatus$ = this.connectionStatusSubject.asObservable();

  private popupWindow: Window | null = null;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    // Check connection status on service initialization
    this.checkConnectionStatus().subscribe();
    
    // Listen for messages from popup window
    this.listenForPopupMessages();
  }

  /**
   * Open Google Calendar OAuth popup and wait for callback using postMessage
   */
  openGoogleCalendarAuth(): Observable<OAuthResponse> {
    return new Observable((observer) => {
      // Get the auth URL first
      this.getAuthUrl().subscribe({
        next: (authUrl: string) => {
          // Open popup with calculated position
          const width = 500;
          const height = 600;
          const left = window.screenX + (window.outerWidth - width) / 2;
          const top = window.screenY + (window.outerHeight - height) / 2;
          
          this.popupWindow = window.open(
            authUrl,
            'GoogleCalendarAuth',
            `width=${width},height=${height},left=${left},top=${top}`
          );

          if (!this.popupWindow) {
            observer.error({ 
              success: false,
              message: 'Failed to open authorization popup. Please check popup blocker settings.',
              userId: 0
            });
            return;
          }

          // Message handler for postMessage communication
          const messageHandler = (event: MessageEvent) => {
            // Validate origin for security
            if (!event.origin.includes(window.location.hostname)) {
              return;
            }
            
            // Handle success
            if (event.data && event.data.type === 'oauth-callback-result' && event.data.data?.success) {
              window.removeEventListener('message', messageHandler);
              clearTimeout(timeout);
              
              const result = event.data.data as OAuthResponse;
              this.connectionStatusSubject.next(true);
              observer.next(result);
              observer.complete();
              
              // Close popup
              if (this.popupWindow) {
                this.popupWindow.close();
              }
            }
            // Handle error
            else if (event.data && event.data.type === 'oauth-callback-result' && !event.data.data?.success) {
              window.removeEventListener('message', messageHandler);
              clearTimeout(timeout);
              
              const result = event.data.data as OAuthResponse;
              observer.error(result);
              
              // Close popup
              if (this.popupWindow) {
                this.popupWindow.close();
              }
            }
          };
          
          window.addEventListener('message', messageHandler);
          
          // Timeout after 60 seconds
          const timeout = setTimeout(() => {
            window.removeEventListener('message', messageHandler);
            if (this.popupWindow) {
              this.popupWindow.close();
            }
            observer.error({ 
              success: false,
              message: 'Authorization timeout. Please try again.',
              userId: 0
            });
            }, 60000);
        },
        error: (error) => {
          observer.error({ 
            success: false,
            message: 'Failed to get authorization URL: ' + (error.message || 'Unknown error'),
            userId: 0
          });
        }
      });
    });
  }

  /**
   * Get the Google OAuth authorization URL
   */
  getAuthUrl(): Observable<string> {
    return this.http.get(`${this.apiUrl}/auth-url`, {
      responseType: 'text'
    });
  }

  /**
   * Handle OAuth callback with authorization code
   */
  handleOAuthCallback(authorizationCode: string): Observable<OAuthResponse> {
    const body = { authorizationCode };
    return this.http.post<OAuthResponse>(`${this.apiUrl}/oauth/callback`, body).pipe(
      tap((response) => {
        if (response.success) {
          this.connectionStatusSubject.next(true);
        }
      }),
      catchError((error) => {
        return throwError(() => error.error || { message: 'OAuth callback failed' });
      })
    );
  }

  /**
   * Complete OAuth callback with authorization code and state
   * Called by the callback page to exchange code for tokens
   */
  completeOAuthCallback(code: string, state: string): Observable<OAuthResponse> {
    return this.http.get<OAuthResponse>(
      `${this.apiUrl}/oauth/callback`,
      { params: { code, state } }
    ).pipe(
      tap((response) => {
        if (response.success) {
          this.connectionStatusSubject.next(true);
        }
      }),
      catchError((error) => {
        return throwError(() => error.error || { message: 'OAuth callback failed' });
      })
    );
  }

  /**
   * Check if user is connected to Google Calendar
   */
  checkConnectionStatus(): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/status`).pipe(
      tap((status) => {
        this.connectionStatusSubject.next(status);
      }),
      catchError((error) => {
        console.error('Error checking connection status:', error);
        return of(false);
      })
    );
  }

  /**
   * Sync itinerary steps to Google Calendar
   */
  syncItinerary(itineraryId: string): Observable<any> {
    const body = { itineraryId };
    return this.http.post(`${this.apiUrl}/sync`, body);
  }

  /**
   * Disconnect Google Calendar
   */
  disconnectCalendar(): Observable<any> {
    return this.http.delete(`${this.apiUrl}/disconnect`).pipe(
      tap(() => {
        this.connectionStatusSubject.next(false);
      })
    );
  }

  /**
   * Get connection status from BehaviorSubject (no API call)
   */
  getConnectionStatusSync(): boolean {
    return this.connectionStatusSubject.value;
  }

  /**
   * Emit OAuth result when received from popup
   */
  emitOAuthResult(result: OAuthResponse): void {
    this.oAuthResultSubject.next(result);
  }

  /**
   * Emit authorization code (backward compatibility)
   */
  emitAuthorizationCode(code: string): void {
    // No longer used - kept for backward compatibility
    console.warn('emitAuthorizationCode is deprecated. Use postMessage API instead.');
  }

  /**
   * Listen for messages from popup window
   */
  private listenForPopupMessages(): void {
    window.addEventListener('message', (event: MessageEvent) => {
      // Only accept messages from same origin
      if (event.origin !== window.location.origin) {
        return;
      }

      // Check for OAuth result message from popup
      if (event.data && event.data.type === 'oauth-callback-result') {
        const result = event.data.data as OAuthResponse;
        this.emitOAuthResult(result);
      }
    });
  }
}
