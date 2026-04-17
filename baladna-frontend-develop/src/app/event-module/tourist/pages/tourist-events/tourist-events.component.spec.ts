import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TouristEventsComponent } from './tourist-events.component';

describe('TouristEventsComponent', () => {
  let component: TouristEventsComponent;
  let fixture: ComponentFixture<TouristEventsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TouristEventsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TouristEventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
