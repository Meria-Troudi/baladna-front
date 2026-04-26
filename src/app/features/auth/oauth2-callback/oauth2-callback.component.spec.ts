import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OAuth2CallbackComponent } from './oauth2-callback.component';

describe('OAuth2CallbackComponent', () => {
  let component: OAuth2CallbackComponent;
  let fixture: ComponentFixture<OAuth2CallbackComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OAuth2CallbackComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OAuth2CallbackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
