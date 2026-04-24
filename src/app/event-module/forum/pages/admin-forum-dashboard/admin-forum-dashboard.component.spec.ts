import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminForumDashboardComponent } from './admin-forum-dashboard.component';

describe('AdminForumDashboardComponent', () => {
  let component: AdminForumDashboardComponent;
  let fixture: ComponentFixture<AdminForumDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdminForumDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminForumDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
