import { Component, OnInit } from '@angular/core';
import { ForumService, ForumPost, ForumStats } from '../../services/forum.service';

@Component({
  selector: 'app-admin-forum-dashboard',
  templateUrl: './admin-forum-dashboard.component.html',
  styleUrls: ['./admin-forum-dashboard.component.css']
})
export class AdminForumDashboardComponent implements OnInit {

  stats: ForumStats = {
    totalPosts: 0,
    totalComments: 0,
    hiddenPosts: 0,
    activeUsers: 0
  };

  posts: ForumPost[] = [];
  filteredPosts: ForumPost[] = [];
  selectedPost: ForumPost | null = null;
  loading = true;

  filters = {
    search: '',
    type: 'ALL',
    status: 'ALL',
    dateFrom: '',
    dateTo: ''
  };

  constructor(private forumService: ForumService) { }

  ngOnInit(): void {
    this.loadStats();
    this.loadPosts();
  }

  loadStats(): void {
    this.forumService.getAdminStats().subscribe({
      next: (stats) => {
        this.stats = stats;
      }
    });
  }

  loadPosts(): void {
    this.forumService.getAllPostsAdmin().subscribe({
      next: (posts) => {
        this.posts = posts;
        this.filteredPosts = posts;
        this.loading = false;
      }
    });
  }

  selectPost(post: ForumPost): void {
    this.selectedPost = post;
  }

  closePanel(): void {
    this.selectedPost = null;
  }

  hidePost(post: ForumPost, event?: Event): void {
    if (event) event.stopPropagation();
    this.forumService.updatePostStatus(post.id, 'HIDDEN').subscribe({
      next: () => {
        post.status = 'HIDDEN';
        this.stats.hiddenPosts++;
      }
    });
  }

  deletePost(post: ForumPost, event?: Event): void {
    if (event) event.stopPropagation();
    this.forumService.updatePostStatus(post.id, 'DELETED').subscribe({
      next: () => {
        post.status = 'DELETED';
      }
    });
  }

  restorePost(post: ForumPost, event?: Event): void {
    if (event) event.stopPropagation();
    this.forumService.updatePostStatus(post.id, 'VISIBLE').subscribe({
      next: () => {
        post.status = 'VISIBLE';
        this.stats.hiddenPosts--;
      }
    });
  }

  getRiskLabel(post: ForumPost): string {
    if (post.commentsCount > 20) return 'HOT';
    if (post.status === 'HIDDEN') return 'FLAGGED';
    return 'NORMAL';
  }

  getRiskClass(post: ForumPost): string {
    if (post.commentsCount > 20) return 'risk-high';
    if (post.status === 'HIDDEN') return 'risk-warning';
    return 'risk-normal';
  }

  sort(key: string) {
    this.filteredPosts.sort((a: any, b: any) => b[key] - a[key]);
  }

  applyFilters(): void {
    this.filteredPosts = this.posts.filter(post => {

      if (this.filters.search && !post.content.toLowerCase().includes(this.filters.search.toLowerCase())) {
        return false;
      }

      const mediaType = post.media && post.media.length ? post.media[0].type : post.mediaType;
      if (this.filters.type !== 'ALL' && mediaType !== this.filters.type) {
        return false;
      }

      if (this.filters.status !== 'ALL' && post.status !== this.filters.status) {
        return false;
      }

      if (this.filters.dateFrom) {
        if (new Date(post.createdAt) < new Date(this.filters.dateFrom)) return false;
      }

      if (this.filters.dateTo) {
        if (new Date(post.createdAt) > new Date(this.filters.dateTo)) return false;
      }

      return true;
    });
  }

}
