import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ViewChild, ElementRef, AfterViewInit, OnInit } from '@angular/core';
import { ForumService, ForumPost, ForumComment } from '../../services/forum.service';
import { UserService } from '../../../../features/user/user.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-comments-modal',
  templateUrl: './comments-modal.component.html',
  styleUrls: ['./comments-modal.component.css']
})
export class CommentsModalComponent implements OnChanges, AfterViewInit, OnInit {
    editingPost = false;
  @Input() visible: boolean = false;
  @Input() postId: number | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() postUpdated = new EventEmitter<ForumPost>();
  @Output() postDeleted = new EventEmitter<number>();

  @ViewChild('modalContainer') modalContainer!: ElementRef;

  post: ForumPost | null = null;
  comments: ForumComment[] = [];
  newComment: string = '';
  replyingTo: ForumComment | null = null;
  loadingPost = false;
  loadingComments = false;
  currentUserId: number | null = null;

  constructor(
    private forumService: ForumService,
    private userService: UserService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.userService.getMyProfile().subscribe({
      next: (u: any) => { this.currentUserId = u?.id ?? null; },
      error: () => { this.currentUserId = null; }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['postId'] || changes['visible']) && this.visible && this.postId) {
      this.loadData();
    }
  }

  ngAfterViewInit(): void {
    if (this.visible) {
      setTimeout(() => this.modalContainer?.nativeElement?.focus(), 0);
    }
  }

  loadData(): void {
    this.loadPost();
    this.loadComments();
  }

  loadPost(): void {
    if (!this.postId) return;
    this.loadingPost = true;
    this.forumService.getPost(this.postId).subscribe({
      next: p => {
        this.post = {
          ...p,
          authorName: p.authorName || ('User ' + p.userId)
        };
        this.loadingPost = false;
      },
      error: () => { this.loadingPost = false; }
    });
  }

  loadComments(): void {
    if (!this.postId) return;
    this.loadingComments = true;
    this.forumService.getComments(this.postId).subscribe({
      next: c => {
        this.comments = c.map(comment => ({
          ...comment,
          authorName: comment.authorName || ('User ' + comment.userId)
        }));
        this.loadingComments = false;
      },
      error: () => { this.loadingComments = false; }
    });
  }

  get isAuthor(): boolean {
    return this.post?.userId === this.currentUserId;
  }

  get hasMedia(): boolean {
    return this.mediaList.length > 0;
  }

  get mediaList(): { url: string; type: string }[] {
    if (this.post?.media?.length) return this.post.media;
    if (this.post?.mediaUrl) return [{ url: this.post.mediaUrl, type: this.post.mediaType || 'IMAGE' }];
    return [];
  }

  submitComment(): void {
    const text = this.newComment.trim();
    if (!text || !this.postId) return;

    const parentId = this.replyingTo?.id;
    this.forumService.addComment(this.postId, text, parentId).subscribe({
      next: (comment) => {
        if (!parentId) {
          this.comments.unshift(comment);
        } else {
          const parent = this.findCommentById(this.comments, parentId);
          if (parent) {
            parent.replies = parent.replies || [];
            parent.replies.push(comment);
          }
        }
        if (this.post) {
          this.post.commentsCount = (this.post.commentsCount || 0) + 1;
          this.postUpdated.emit(this.post);
        }
        this.newComment = '';
        this.replyingTo = null;
        // Refresh notifications after comment
        if (this.notificationService && this.notificationService.getUnreadCount) {
          this.notificationService.getUnreadCount().subscribe();
        }
      }
    });
  }

  replyTo(comment: ForumComment): void {
    this.replyingTo = comment;
    // Focus textarea
  }

  editComment(comment: ForumComment): void {
    this.newComment = comment.content;
    this.replyingTo = null;
    // You can add update logic here.
  }

  deleteComment(commentId: number): void {
    if (confirm('Delete this comment?')) {
      this.forumService.deleteComment(commentId).subscribe(() => {
        this.comments = this.removeComment(this.comments, commentId);
        if (this.post) {
          this.post.commentsCount = Math.max(0, (this.post.commentsCount || 1) - 1);
          this.postUpdated.emit(this.post);
        }
      });
    }
  }


  editPost(): void {
    this.editingPost = true;
    // Optionally, set up editing state, e.g., copy post content to a temp variable
  }

  saveEditPost(): void {
    if (!this.post) return;
    // Call forumService.updatePost with new content (implement UI for editing if needed)
    // For now, just end editing mode
    this.editingPost = false;
    // Emit postUpdated if needed
    // this.postUpdated.emit(this.post);
  }

  deletePost(): void {
    if (confirm('Delete this post permanently?')) {
      this.forumService.deletePost(this.post!.id).subscribe(() => {
        this.postDeleted.emit(this.post!.id);
        this.close();
      });
    }
  }

  autoResize(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  close(): void {
    this.closed.emit();
    this.post = null;
    this.comments = [];
    this.newComment = '';
    this.replyingTo = null;
  }

  private findCommentById(list: ForumComment[], id: number): ForumComment | null {
    for (const c of list) {
      if (c.id === id) return c;
      if (c.replies) {
        const found = this.findCommentById(c.replies, id);
        if (found) return found;
      }
    }
    return null;
  }

  private removeComment(list: ForumComment[], id: number): ForumComment[] {
    return list.filter(c => c.id !== id).map(c => ({
      ...c,
      replies: c.replies ? this.removeComment(c.replies, id) : []
    }));
  }
}