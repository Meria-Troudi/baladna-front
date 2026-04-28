import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookingFlowComponent } from './booking-flow.component';

describe('BookingFlowComponent', () => {
  let component: BookingFlowComponent;
  let fixture: ComponentFixture<BookingFlowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BookingFlowComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BookingFlowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
