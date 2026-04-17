import { Component, OnInit, HostListener } from '@angular/core';
import { ForumService, ForumPost, FeedResponse } from '../../services/forum.service';
import { UserService } from '../../../../features/user/user.service';

@Component({
  selector: 'app-feed-page',
  templateUrl: './feed-page.component.html',
  styleUrls: ['./feed-page.component.scss']
})
export class FeedPageComponent implements OnInit {
  posts: ForumPost[] = [];
  savedPosts: ForumPost[] = [];
  myPosts: ForumPost[] = [];
  pinnedPost: ForumPost | null = null;

  cursor: string | null = null;
  size: number = 10;
  loading: boolean = false;
  hasMore: boolean = true;

  showPostModal: boolean = false;
  selectedPostId: number | null = null;

  activeSort: 'latest' | 'popular' = 'latest';
  loggedInUserName: string = '';

  constructor(
    private forumService: ForumService,
    private userService: UserService
  ) {}
  
  commentMap: Record<number, string> = {};
  
  sendComment(post: ForumPost): void {
    const content = this.commentMap[post.id];
    if (!content?.trim()) return;
  
    this.forumService.addComment(post.id, content).subscribe({
      next: () => {
        const p = this.posts.find(x => x.id === post.id);
        if (p) p.commentsCount = (p.commentsCount || 0) + 1;
        this.commentMap[post.id] = '';
        // refresh sidebar/my posts counters if necessary
        this.loadMyPosts();
      }
    });
  }
  
  onEdit(post: ForumPost): void {
    this.openEditPostModal(post);
  }
  
  onDelete(postId: number): void {
    this.deletePost(postId);
  }
  
  ngOnInit(): void {
    this.loadInitialData();
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.userService.getMyProfile().subscribe({
      next: (user: any) => {
        this.loggedInUserName = `${user.firstName} ${user.lastName}`;
      },
      error: () => {
        this.loggedInUserName = 'Voyageur';
      }
    });
  }

  loadInitialData(): void {
    this.loadFeed();
    this.loadSavedPosts();
    this.loadMyPosts();
    this.loadPinnedPost();
  }

  loadFeed(): void {
    if (this.loading || !this.hasMore) return;
    this.loading = true;
    this.forumService.getFeed(this.cursor, this.size, this.activeSort).subscribe({
      next: (response: FeedResponse) => {
      // Add userAvatarUrl, userName, prefer local reaction and mark saved state (merge localStorage)
      const localSavedRaw = (() => { try { return JSON.parse(localStorage.getItem('forum_saved_ids') || '[]'); } catch (e) { return []; } })();
      const localSavedSet = new Set<number>(localSavedRaw.map((id: any) => Number(id)).filter((n: number) => !isNaN(n)));
        const posts = response.posts.map(post => {
          const localReaction = (() => { try { return localStorage.getItem(`forum_reaction_${post.id}`) as any; } catch (e) { return null; } })();
          const isSavedLocal = localSavedSet.has(post.id);
          
          let authorName = post.authorName;
          if (post.user && post.user.firstName && post.user.lastName) {
            authorName = `${post.user.firstName} ${post.user.lastName}`;
          }

          return {
            ...post,
            authorName: authorName,
            userReaction: localReaction ?? (post.userReaction || null),
            isSaved: isSavedLocal || !!(this.savedPosts && this.savedPosts.find(sp => sp.id === post.id))
          };
        });
      this.posts = [...this.posts, ...posts];
      this.cursor = response.nextCursor;
      this.hasMore = !!response.nextCursor;
      this.loading = false;
      },
      error: () => (this.loading = false)
    });
  }

  loadSavedPosts(): void {
    this.forumService.getSavedPosts().subscribe(r => {
      this.savedPosts = r;

      // merge server saved ids with localStorage saved ids to avoid false positives
      let localIds: string[] = [];
      try { localIds = JSON.parse(localStorage.getItem('forum_saved_ids') || '[]'); } catch (e) { localIds = []; }
      const mergedSet = new Set<number>([...r.map(p => p.id), ...localIds.map((id: any) => Number(id)).filter((n: number) => !isNaN(n))]);

      // update posts isSaved flag
      this.posts = this.posts.map(p => ({ ...p, isSaved: !!mergedSet.has(p.id) }));

      // persist normalized saved ids back to localStorage
      try { localStorage.setItem('forum_saved_ids', JSON.stringify(Array.from(mergedSet).map(String))); } catch (e) {}
    });
  }

  loadPinnedPost(): void {
    this.forumService.getPinnedPost().subscribe(r => (this.pinnedPost = r));
  }

  loadMyPosts(): void {
    this.forumService.getMyPosts().subscribe(r => {
      this.myPosts = r.map(post => {
        let authorName = post.authorName;
        if (post.user && post.user.firstName && post.user.lastName) {
          authorName = `${post.user.firstName} ${post.user.lastName}`;
        }
        return {
          ...post,
          authorName: authorName
        };
      });
    });
  }

  loadMorePosts(): void {
    this.loadFeed();
  }

  changeSort(sort: 'latest' | 'popular'): void {
    this.activeSort = sort;
    this.cursor = null;
    this.posts = [];
    this.hasMore = true;
    this.loadMorePosts();
  }

  onPostCreated(newPost: ForumPost): void {
    this.posts.unshift(newPost);
    this.loadMyPosts(); // refresh my posts list
  }

  openPostModal(postId: number): void {
    this.selectedPostId = postId;
    this.showPostModal = true;
  }

  closePostModal(): void {
    this.showPostModal = false;
    this.selectedPostId = null;
  }

  openEditPostModal(post: ForumPost): void {
    // You can implement an edit modal or reuse the comments modal with edit mode.
    // For simplicity, we can open the same modal and let the modal handle edit.
    this.selectedPostId = post.id;
    this.showPostModal = true;
  }

  deletePost(postId: number): void {
    if (confirm('Are you sure you want to delete this post?')) {
      this.forumService.deletePost(postId).subscribe(() => {
        this.posts = this.posts.filter(p => p.id !== postId);
        this.loadMyPosts();
      });
    }
  }

  onPostUpdated(updatedPost: ForumPost): void {
    const index = this.posts.findIndex(p => p.id === updatedPost.id);
    if (index !== -1) this.posts[index] = updatedPost;
    this.loadMyPosts();
  }

  onPostDeleted(postId: number): void {
    this.posts = this.posts.filter(p => p.id !== postId);
    this.loadMyPosts();
  }

  getTimeAgo(date: string): string {
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'now';
    if (minutes < 60) return minutes + 'm';
    if (minutes < 1440) return Math.floor(minutes / 60) + 'h';
    return Math.floor(minutes / 1440) + 'd';
  }

  @HostListener('window:scroll', ['$event'])
  onScroll(): void {
    const pos = (document.documentElement.scrollTop || document.body.scrollTop) + document.documentElement.offsetHeight;
    const max = document.documentElement.scrollHeight;
    if (pos >= max - 500) {
      this.loadMorePosts();
    }
  }
}