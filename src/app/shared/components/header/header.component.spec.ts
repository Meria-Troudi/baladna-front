import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { HeaderComponent } from './header.component';
import { AuthService } from '../../../features/auth/services/auth.service';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  const authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['getRole', 'getCurrentUser', 'logout']);

  beforeEach(async () => {
    authServiceSpy.getRole.and.returnValue('ADMIN');
    authServiceSpy.getCurrentUser.and.returnValue({
      firstName: 'Kacem',
      lastName: 'User',
      email: 'kacem@example.com'
    });

    await TestBed.configureTestingModule({
      declarations: [HeaderComponent],
      imports: [HttpClientTestingModule],
      providers: [{ provide: AuthService, useValue: authServiceSpy }]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
