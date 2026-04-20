import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule
      ]
    });

    service = TestBed.inject(AuthService);
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return false when not logged in', () => {
    expect(service.isLoggedIn()).toBeFalse();
  });

  it('should return true when token exists', () => {
    localStorage.setItem('accessToken', 'test-token');
    expect(service.isLoggedIn()).toBeTrue();
  });

  it('should detect admin role', () => {
    localStorage.setItem('role', 'ADMIN');
    expect(service.isAdmin()).toBeTrue();
  });

  it('should clear tokens on logout', () => {
    localStorage.setItem('accessToken', 'test');
    localStorage.setItem('refreshToken', 'test');

    service.logout();

    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
  });
});