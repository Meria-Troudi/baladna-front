import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HostEventReservationsComponent } from './host-event-reservations.component';

describe('HostEventReservationsComponent', () => {
  let component: HostEventReservationsComponent;
  let fixture: ComponentFixture<HostEventReservationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostEventReservationsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HostEventReservationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
