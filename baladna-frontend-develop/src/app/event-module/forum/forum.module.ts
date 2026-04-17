import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';

import { ForumRoutingModule } from './forum-routing.module';

import { FeedPageComponent } from './pages/feed-page/feed-page.component';
import { CreatePostComponent } from './components/create-post/create-post.component';
import { PostCardComponent } from './components/post-card/post-card.component';
import { AdminForumDashboardComponent } from './pages/admin-forum-dashboard/admin-forum-dashboard.component';
import { CommentsModalComponent } from './components/comments-modal/comments-modal.component';
import { NotificationsPanelComponent } from './components/notifications/notifications-panel.component';
import { SavedPostsStripComponent } from './components/saved-posts-strip/saved-posts-strip.component';
import { PinnedPostCardComponent } from './components/pinned-post-card/pinned-post-card.component';


@NgModule({
  declarations: [
    FeedPageComponent,
    CreatePostComponent,
    PostCardComponent,
    AdminForumDashboardComponent,
    CommentsModalComponent,
    NotificationsPanelComponent,
    SavedPostsStripComponent,
    PinnedPostCardComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    ForumRoutingModule
  ],
  exports: [
    CreatePostComponent,
    PostCardComponent
  ]
})
export class ForumModule { }