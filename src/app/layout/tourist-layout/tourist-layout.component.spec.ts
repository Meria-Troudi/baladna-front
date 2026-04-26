import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TouristLayoutComponent } from './tourist-layout.component';

describe('TouristLayoutComponent', () => {
  let component: TouristLayoutComponent;
  let fixture: ComponentFixture<TouristLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TouristLayoutComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TouristLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
