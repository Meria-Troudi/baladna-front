import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { UsersComponent } from './users.component';
import { UserService } from '../user.service';
import { AuthService } from '../../auth/services/auth.service';

describe('UsersComponent', () => {
  let component: UsersComponent;
  let fixture: ComponentFixture<UsersComponent>;

  const userServiceSpy = jasmine.createSpyObj('UserService', [
    'getAllUsers',
    'getAllUsersIncludingDeleted',
    'getUserStats',
    'updateStatus',
    'updateRole',
    'deleteUser',
    'hardDeleteUser'
  ]);

  const authServiceSpy = jasmine.createSpyObj('AuthService', ['getRole']);

  beforeEach(async () => {
    userServiceSpy.getAllUsers.and.returnValue({
      subscribe: (fn: any) => fn([])
    });

    userServiceSpy.getAllUsersIncludingDeleted.and.returnValue({
      subscribe: (fn: any) => fn([])
    });

    userServiceSpy.getUserStats.and.returnValue({
      subscribe: (fn: any) => fn({})
    });

    await TestBed.configureTestingModule({
      declarations: [UsersComponent],
      imports: [HttpClientTestingModule],
      providers: [
        { provide: UserService, useValue: userServiceSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(UsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});