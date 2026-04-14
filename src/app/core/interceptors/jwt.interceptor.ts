import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { AuthService } from '../../features/auth/services/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  constructor(private authService: AuthService, private router: Router) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = typeof localStorage !== 'undefined'
      ? this.authService.getAccessToken()
      : null;

    console.log('[JwtInterceptor] intercept request:', {
      method: request.method,
      url: request.url,
      hasToken: !!token
    });

    if (token) {
      request = this.addToken(request, token);
    }

    return next.handle(request).pipe(
      catchError(error => {
        console.error('[JwtInterceptor] request error:', {
          url: request.url,
          status: error?.status,
          message: error?.message
        });

        if (error instanceof HttpErrorResponse && error.status === 401) {
          console.warn('[JwtInterceptor] 401 detected, trying refresh token');
          return this.handle401Error(request, next);
        }

        return throwError(() => error);
      })
    );
  }

  private addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
    console.log('[JwtInterceptor] add token to request:', request.url);

    return request.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  private handle401Error(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      console.log('[JwtInterceptor] starting refresh token flow');

      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authService.refreshToken().pipe(
        switchMap(res => {
          console.log('[JwtInterceptor] refresh token success');

          this.isRefreshing = false;
          this.refreshTokenSubject.next(res.accessToken);
          return next.handle(this.addToken(request, res.accessToken));
        }),
        catchError(err => {
          console.error('[JwtInterceptor] refresh token failed:', err);

          this.isRefreshing = false;
          this.authService.logout();
          return throwError(() => err);
        })
      );
    }

    console.log('[JwtInterceptor] waiting for refresh token result');

    return this.refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(token => {
        console.log('[JwtInterceptor] retrying request after refresh:', request.url);
        return next.handle(this.addToken(request, token!));
      })
    );
  }
}