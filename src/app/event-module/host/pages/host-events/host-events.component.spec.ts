import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HostEventsComponent } from './host-events.component';

describe('HostEventsComponent', () => {
  let component: HostEventsComponent;
  let fixture: ComponentFixture<HostEventsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HostEventsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HostEventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
