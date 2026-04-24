import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TouristReservationsComponent } from './tourist-reservations.component';

describe('TouristReservationsComponent', () => {
  let component: TouristReservationsComponent;
  let fixture: ComponentFixture<TouristReservationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TouristReservationsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TouristReservationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
