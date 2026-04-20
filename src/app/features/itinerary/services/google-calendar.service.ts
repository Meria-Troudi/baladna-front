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
   * Open Google Calendar OAuth popup and wait for callback
   */
  openGoogleCalendarAuth(): Observable<OAuthResponse> {
    return new Observable((observer) => {
      // Get the auth URL first
      this.getAuthUrl().subscribe({
        next: (authUrl: string) => {
          // Open popup
          const width = 600;
          const height = 700;
          const left = (window.innerWidth - width) / 2;
          const top = (window.innerHeight - height) / 2;
          
          this.popupWindow = window.open(
            authUrl,
            'Google Calendar Auth',
            `width=${width},height=${height},left=${left},top=${top}`
          );

          if (!this.popupWindow) {
            observer.error({ message: 'Popup blocked. Please enable popups and try again.' });
            return;
          }

          // Setup popup monitoring
          const popupCheckInterval = setInterval(() => {
            if (this.popupWindow && this.popupWindow.closed) {
              clearInterval(popupCheckInterval);
              clearTimeout(popupTimeoutId);
              // User closed popup manually
              observer.error({ message: 'Authorization cancelled by user.' });
            }
          }, 500);

          // Timeout after 5 minutes
          const popupTimeoutId = setTimeout(() => {
            clearInterval(popupCheckInterval);
            if (this.popupWindow) {
              this.popupWindow.close();
            }
            observer.error({ message: 'Authorization timeout. Please try again.' });
          }, 5 * 60 * 1000);

          // Subscribe to OAuth result (will be emitted by popup via postMessage)
          const resultSubscription = this.oAuthResult$.subscribe({
            next: (result) => {
              clearInterval(popupCheckInterval);
              clearTimeout(popupTimeoutId);
              resultSubscription.unsubscribe();
              
              if (this.popupWindow) {
                this.popupWindow.close();
              }

              if (result.success) {
                this.connectionStatusSubject.next(true);
                observer.next(result);
                observer.complete();
              } else {
                observer.error(result);
              }
            }
          });
        },
        error: (error) => {
          observer.error(error);
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
