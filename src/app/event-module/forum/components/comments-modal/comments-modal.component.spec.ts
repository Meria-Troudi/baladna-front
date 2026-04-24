import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PostViewerModalComponent } from './comments-modal.component';

describe('PostViewerModalComponent', () => {
  let component: PostViewerModalComponent;
  let fixture: ComponentFixture<PostViewerModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PostViewerModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PostViewerModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
