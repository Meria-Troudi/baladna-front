import { HttpHandler, HttpRequest } from '@angular/common/http';
import { of } from 'rxjs';
import { Router } from '@angular/router';

import { JwtInterceptor } from './jwt.interceptor';
import { AuthService } from '../../features/auth/services/auth.service';

describe('JwtInterceptor', () => {
  it('should add the bearer token when available', (done) => {
    const authService = jasmine.createSpyObj<AuthService>('AuthService', ['getAccessToken', 'refreshToken', 'logout']);
    const router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    authService.getAccessToken.and.returnValue('token-123');

    const interceptor = new JwtInterceptor(authService, router);
    const request = new HttpRequest('GET', '/api/demo');
    const next: HttpHandler = {
      handle: jasmine.createSpy('handle').and.callFake((req: HttpRequest<unknown>) => {
        expect(req.headers.get('Authorization')).toBe('Bearer token-123');
        return of();
      })
    };

    interceptor.intercept(request, next).subscribe({
      complete: () => {
        expect(next.handle).toHaveBeenCalled();
        done();
      }
    });
  });
});
