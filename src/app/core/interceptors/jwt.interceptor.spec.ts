import { HttpHandler, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';

import { JwtInterceptor } from './jwt.interceptor';
import { AuthService } from '../../features/auth/services/auth.service';

describe('JwtInterceptor', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let interceptor: JwtInterceptor;

  beforeEach(() => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', [
      'getAccessToken',
      'refreshToken',
      'logout'
    ]);

    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    interceptor = new JwtInterceptor(authService);
  });

  it('should add bearer token when available', (done) => {
    authService.getAccessToken.and.returnValue('token-123');

    const request = new HttpRequest('GET', '/api/test');

    const next: HttpHandler = {
      handle: jasmine.createSpy().and.callFake((req: HttpRequest<any>) => {
        expect(req.headers.get('Authorization')).toBe('Bearer token-123');
        return of({});
      })
    };

    interceptor.intercept(request, next).subscribe({
      complete: () => done()
    });
  });

  it('should not add token if none exists', (done) => {
    authService.getAccessToken.and.returnValue(null);

    const request = new HttpRequest('GET', '/api/test');

    const next: HttpHandler = {
      handle: jasmine.createSpy().and.callFake((req: HttpRequest<any>) => {
        expect(req.headers.has('Authorization')).toBeFalse();
        return of({});
      })
    };

    interceptor.intercept(request, next).subscribe({
      complete: () => done()
    });
  });

  it('should refresh token on 401 and retry request', (done) => {
    authService.getAccessToken.and.returnValue('old-token');
    authService.refreshToken.and.returnValue(of({
      accessToken: 'new-token',
      refreshToken: 'refresh-token',
      role: 'TOURIST'
    }));

    let callCount = 0;

    const request = new HttpRequest('GET', '/api/test');

    const next: HttpHandler = {
      handle: jasmine.createSpy().and.callFake((req: HttpRequest<any>) => {
        callCount++;

        if (callCount === 1) {
          return throwError(() => new HttpErrorResponse({ status: 401 }));
        }

        expect(req.headers.get('Authorization')).toBe('Bearer new-token');
        return of({});
      })
    };

    interceptor.intercept(request, next).subscribe({
      complete: () => {
        expect(authService.refreshToken).toHaveBeenCalled();
        done();
      }
    });
  });

  it('should logout if refresh token fails', (done) => {
    authService.getAccessToken.and.returnValue('old-token');
    authService.refreshToken.and.returnValue(
      throwError(() => new Error('refresh failed'))
    );

    const request = new HttpRequest('GET', '/api/test');

    const next: HttpHandler = {
      handle: jasmine.createSpy().and.returnValue(
        throwError(() => new HttpErrorResponse({ status: 401 }))
      )
    };

    interceptor.intercept(request, next).subscribe({
      error: () => {
        expect(authService.logout).toHaveBeenCalled();
        done();
      }
    });
  });
});
