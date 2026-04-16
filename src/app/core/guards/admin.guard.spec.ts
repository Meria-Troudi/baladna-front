import { Router } from '@angular/router';

import { AdminGuard } from './admin.guard';
import { AuthService } from '../../features/auth/services/auth.service';

describe('AdminGuard', () => {
  it('should allow access for admins', () => {
    const authService = jasmine.createSpyObj<AuthService>('AuthService', ['isAdmin']);
    const router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    authService.isAdmin.and.returnValue(true);

    const guard = new AdminGuard(authService, router);

    expect(guard.canActivate()).toBeTrue();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should redirect non-admin users', () => {
    const authService = jasmine.createSpyObj<AuthService>('AuthService', ['isAdmin']);
    const router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    authService.isAdmin.and.returnValue(false);

    const guard = new AdminGuard(authService, router);

    expect(guard.canActivate()).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/profile']);
  });
});
