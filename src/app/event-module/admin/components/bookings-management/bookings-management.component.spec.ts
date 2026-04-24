import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookingsManagementComponent } from './bookings-management.component';

describe('BookingsManagementComponent', () => {
  let component: BookingsManagementComponent;
  let fixture: ComponentFixture<BookingsManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BookingsManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BookingsManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
