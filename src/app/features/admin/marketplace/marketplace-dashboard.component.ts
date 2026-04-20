import { Router } from '@angular/router';

import { AuthGuard } from './auth.guard';
import { AuthService } from '../../features/auth/services/auth.service';

describe('AuthGuard', () => {
  it('should allow access for logged-in users', () => {
    const authService = jasmine.createSpyObj<AuthService>('AuthService', ['isLoggedIn']);
    const router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    authService.isLoggedIn.and.returnValue(true);

    const guard = new AuthGuard(authService, router);

    expect(guard.canActivate()).toBeTrue();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should redirect anonymous users', () => {
    const authService = jasmine.createSpyObj<AuthService>('AuthService', ['isLoggedIn']);
    const router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    authService.isLoggedIn.and.returnValue(false);

    const guard = new AuthGuard(authService, router);

    expect(guard.canActivate()).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});