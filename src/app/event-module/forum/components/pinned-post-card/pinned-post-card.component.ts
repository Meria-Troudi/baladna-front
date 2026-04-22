import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ForumPost } from '../../services/forum.service';

@Component({
  selector: 'app-pinned-post-card',
  templateUrl: './pinned-post-card.component.html',
  styleUrls: ['./pinned-post-card.component.css']
})
export class PinnedPostCardComponent {

  @Input() post: ForumPost | null = null;
  @Output() openPost = new EventEmitter<number>();

  constructor() {}

  open(): void {
    if (this.post) {
      this.openPost.emit(this.post.id);
    }
  }
}