import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ForumPost } from '../../services/forum.service';

@Component({
  selector: 'app-saved-posts-strip',
  templateUrl: './saved-posts-strip.component.html',
  styleUrls: ['./saved-posts-strip.component.css']
})
export class SavedPostsStripComponent {

  @Input() posts: ForumPost[] = [];
  @Output() openPost = new EventEmitter<number>();

  constructor() {}

  open(postId: number): void {
    this.openPost.emit(postId);
  }
}