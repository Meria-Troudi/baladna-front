import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventActionsComponent } from './event-actions.component';

describe('EventActionsComponent', () => {
  let component: EventActionsComponent;
  let fixture: ComponentFixture<EventActionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventActionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventActionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
