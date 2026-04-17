import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ForumService, ForumPost, Media } from '../../services/forum.service';

interface MediaFile {
  file: File;
  preview: string;
  type: 'IMAGE' | 'VIDEO';
}

@Component({
  selector: 'app-create-post',
  templateUrl: './create-post.component.html',
  styleUrls: ['./create-post.component.scss']
})
export class CreatePostComponent {
  @Output() postCreated = new EventEmitter<ForumPost>();
  @Input() mode: 'default' | 'announcement' = 'default';

  content: string = '';
  selectedTopic: string = 'GENERAL';
  mediaFiles: MediaFile[] = [];
  submitting: boolean = false;
  maxCharacters: number = 500;

  constructor(private forumService: ForumService) {}

  get placeholderText(): string {
    return this.mode === 'announcement'
      ? "Make an announcement for all visitors..."
      : "Share your experience, ask a question...";
  }

  get remainingChars(): number {
    return this.maxCharacters - this.content.length;
  }

  get canSubmit(): boolean {
    const hasContent = !!this.content.trim();
    const hasMedia = this.mediaFiles.length > 0;
    return (hasContent || hasMedia) && !!this.selectedTopic && !this.submitting;
  }

  autoResizeTextarea(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      Array.from(input.files).forEach(file => this.addFile(file));
    }
    input.value = ''; // allow re-upload same file
  }

  private addFile(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = e.target?.result as string;
      const type = file.type.startsWith('image/') ? 'IMAGE' : 'VIDEO';
      this.mediaFiles.push({ file, preview, type });
    };
    reader.readAsDataURL(file);
  }

  removeMedia(index: number): void {
    this.mediaFiles.splice(index, 1);
  }

  async submit(): Promise<void> {
    if (!this.canSubmit) return;
    this.submitting = true;

    try {
      let mediaUrl: string | null = null;
      let mediaType: 'IMAGE' | 'VIDEO' | null = null;

      if (this.mediaFiles.length > 0) {
        const file = this.mediaFiles[0];
        // upload file first
        const res: any = await this.forumService.uploadMedia(file.file).toPromise();
        mediaUrl = res?.url ?? null;
        mediaType = file.type;
      }

      this.forumService.createPost(this.content.trim(), mediaUrl, mediaType, this.selectedTopic)
        .subscribe({
          next: (newPost) => {
            this.postCreated.emit(newPost);
            this.resetForm();
            this.submitting = false;
          },
          error: () => {
            this.submitting = false;
            alert('Failed to create post. Please try again.');
          }
        });
    } catch (e) {
      this.submitting = false;
      alert('Media upload failed. Please try again.');
    }
  }

  resetForm(): void {
    this.content = '';
    this.selectedTopic = 'GENERAL';
    this.mediaFiles = [];
  }
}