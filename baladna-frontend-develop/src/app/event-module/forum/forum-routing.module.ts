import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FeedPageComponent } from './pages/feed-page/feed-page.component';
import { AdminForumDashboardComponent } from './pages/admin-forum-dashboard/admin-forum-dashboard.component';
import { AdminGuard } from '../../core/guards/admin.guard';

const routes: Routes = [
  { path: 'dashboard', component: AdminForumDashboardComponent, canActivate: [AdminGuard] },
  { path: 'feed', component: FeedPageComponent },
  { path: '', redirectTo: 'feed', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ForumRoutingModule { }