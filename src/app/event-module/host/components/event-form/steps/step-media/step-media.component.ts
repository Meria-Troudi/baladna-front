import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface MediaItem {
  eventId: string;
  url: string;
  type: 'IMAGE' | 'VIDEO';
  isCover: boolean;
  orderIndex: number;
}

@Component({
  selector: 'app-step-media',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './step-media.component.html',
  styleUrls: ['./step-media.component.css']
})
export class StepMediaComponent {
  @Input() existingMedia: MediaItem[] = [];
  @Input() previewUrls: string[] = [];
  @Input() coverIndex: number = -1;
  @Output() fileSelected = new EventEmitter<Event>();
  @Output() fileRemoved = new EventEmitter<number>();
  @Output() coverSet = new EventEmitter<number>();
  @Output() fileMoved = new EventEmitter<{ from: number; to: number }>();

  onFileChange(event: Event): void {
    this.fileSelected.emit(event);
  }

  removeFile(index: number): void {
    this.fileRemoved.emit(index);
  }

  setCover(index: number): void {
    this.coverSet.emit(index);
  }

  moveLeft(index: number): void {
    if (index > 0) {
      this.fileMoved.emit({ from: index, to: index - 1 });
    }
  }

  moveRight(index: number): void {
    if (index < this.previewUrls.length - 1) {
      this.fileMoved.emit({ from: index, to: index + 1 });
    }
  }

  isImage(url: string): boolean {
    return url.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) !== null;
  }

  isVideo(url: string): boolean {
    return url.match(/\.(mp4|webm|ogg|mov)$/i) !== null;
  }

  getMediaType(url: string): 'IMAGE' | 'VIDEO' {
    return this.isVideo(url) ? 'VIDEO' : 'IMAGE';
  }
}