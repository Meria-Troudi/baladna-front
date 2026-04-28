import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { ForumPost, ForumService, ReactionType } from '../../services/forum.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-post-card',
  templateUrl: './post-card.component.html',
  styleUrls: ['./post-card.component.css']
})
export class PostCardComponent implements OnInit {
  @Input() post!: ForumPost;
  @Input() showFullContent: boolean = false;
  @Input() canEdit: boolean = false;
  @Input() canDelete: boolean = false;

  @Output() onComment = new EventEmitter<number>();
  @Output() onEdit = new EventEmitter<ForumPost>();
  @Output() onDelete = new EventEmitter<number>();
  @Output() onSave = new EventEmitter<number>();

  showReactionPicker = false;
  reacting = false;
  reactions: ReactionType[] = ['LIKE', 'LOVE', 'HAHA', 'WOW', 'SAD', 'ANGRY'];
  emojis: Record<string, string> = { LIKE: '👍', LOVE: '❤️', HAHA: '😂', WOW: '😮', SAD: '😢', ANGRY: '😡' };
  reactionLabels: Record<string, string> = { LIKE: 'Like', LOVE: 'Love', HAHA: 'Haha', WOW: 'Wow', SAD: 'Sad', ANGRY: 'Angry' };
  isSaved = false;
  quickComment: string = '';

  constructor(
    private forumService: ForumService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    // Determine if current user is author (simplified: compare with stored userId)
const userId = 1; // Replace with actual auth service
this.canEdit = this.canEdit || this.post.userId === userId;
this.canDelete = this.canDelete || this.post.userId === userId;
    // initialize saved state from post payload
    this.isSaved = !!(this.post && (this.post as any).isSaved);

    // Load reactions from server so counts match truth even if the feed DTO is stale.
    this.forumService.getPostReactions(this.post.id).subscribe({
      next: res => {
        this.post.reactions = res.counts;
        this.post.userReaction = res.userReaction;
        this.post.likesCount = this.sumCounts(res.counts);
      },
      error: () => { /* ignore */ }
    });
  }

  get totalReactions(): number {
    if (this.post?.reactions) return this.sumCounts(this.post.reactions);
    return this.post?.likesCount || 0;
  }

  /**
   * Top 2 emoji reactions by count, in descending order. Used for the facebook-style
   * stacked preview above the action row.
   */
  get topEmojis(): string[] {
    const r: Record<string, number> = (this.post?.reactions as any) || {};
    return Object.keys(r)
      .filter(k => (r[k] || 0) > 0)
      .sort((a, b) => (r[b] || 0) - (r[a] || 0))
      .slice(0, 2)
      .map(k => this.emojis[k] || '👍');
  }

  private sumCounts(counts: Record<string, number> | null | undefined): number {
    if (!counts) return 0;
    return Object.values(counts).reduce((a: number, b: any) => a + Number(b || 0), 0);
  }

  get contentPreview(): string {
    if (this.showFullContent || this.post.content.length <= 280) {
      return this.post.content;
    }
    return this.post.content.substring(0, 280) + '...';
  }

  get mediaList(): { url: string; type: string }[] {
    if (this.post.media && this.post.media.length) return this.post.media;
    if (this.post.mediaUrl) return [{ url: this.post.mediaUrl, type: this.post.mediaType || 'IMAGE' }];
    return [];
  }

  get hasMedia(): boolean {
    return this.mediaList.length > 0;
  }

  toggleReactionPicker(): void {
    this.showReactionPicker = !this.showReactionPicker;
  }

  react(type: ReactionType): void {
    if (this.reacting) return;
    this.reacting = true;
    this.showReactionPicker = false;

    this.forumService.reactToPost(this.post.id, type).subscribe({
      next: (res) => {
        this.post.reactions = res.counts;
        this.post.userReaction = res.userReaction;
        this.post.likesCount = this.sumCounts(res.counts);
        try {
          if (res.userReaction) {
            localStorage.setItem(`forum_reaction_${this.post.id}`, res.userReaction);
          } else {
            localStorage.removeItem(`forum_reaction_${this.post.id}`);
          }
        } catch {}
        // Refresh notifications after like
        if (this.notificationService && this.notificationService.getUnreadCount) {
          this.notificationService.getUnreadCount().subscribe();
        }
      },
      error: () => { /* ignore */ },
      complete: () => (this.reacting = false)
    });
  }

  get displayEmoji(): string {
    const r = (this.post?.userReaction || '').toString().toUpperCase();
    return r && this.emojis[r] ? this.emojis[r] : '👍';
  }

  get displayLabel(): string {
    const r = (this.post?.userReaction || '').toString().toUpperCase();
    return r && this.reactionLabels[r] ? this.reactionLabels[r] : 'Like';
  }

    toggleSave(): void {
      this.forumService.toggleSave(this.post.id).subscribe({
        next: (saved: boolean) => {
          this.isSaved = saved;
          (this.post as any).isSaved = saved;
          try {
            const key = 'forum_saved_ids';
            const raw = JSON.parse(localStorage.getItem(key) || '[]');
            const set = new Set<string>(raw.map(String));
            if (saved) set.add(String(this.post.id));
            else set.delete(String(this.post.id));
            localStorage.setItem(key, JSON.stringify(Array.from(set)));
          } catch (e) { /* ignore storage errors */ }
          this.onSave.emit(this.post.id);
        },
        error: () => {
          // noop or show error
        }
      });
    }



  sendQuickComment(): void {
    const text = this.quickComment?.trim();
    if (!text) return;
    this.forumService.addComment(this.post.id, text).subscribe({
      next: () => {
        this.quickComment = '';
        this.post.commentsCount = (this.post.commentsCount || 0) + 1;
      }
    });
  }

  getTimeAgo(date: string): string {
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'now';
    if (minutes < 60) return minutes + 'm';
    if (minutes < 1440) return Math.floor(minutes / 60) + 'h';
    return Math.floor(minutes / 1440) + 'd';
  }
}