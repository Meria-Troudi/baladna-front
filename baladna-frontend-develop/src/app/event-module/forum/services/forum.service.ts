import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type ReactionType = 'LIKE' | 'LOVE' | 'HAHA' | 'WOW' | 'SAD' | 'ANGRY';

export interface ReactionResponse {
  userReaction: ReactionType | null;
  counts: Record<ReactionType, number>;
}

export interface Media {
  url: string;
  type: 'IMAGE' | 'VIDEO';
  position?: number;
}

export interface ForumPost {
  id: number;
  userId: number;
  content: string;
  mediaUrl?: string;
  mediaType?: 'IMAGE' | 'VIDEO';
  media?: Media[]; // backward compatibility
  finalTopic?: string;
  aiTopic?: string;
  userTopic?: string;
  topicConfidence?: number;
  aiTopicReason?: string;
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  status: string;
  createdAt: string;
  updatedAt?: string;
  userReaction?: ReactionType | null;
  reactions?: Record<ReactionType, number>;
  isSaved?: boolean;
  authorName?: string;
  authorAvatar?: string;
  // AI moderation verdict populated by the backend (llama3.2 via Ollama)
  moderationLabel?: 'SAFE' | 'TOXIC' | 'SPAM' | string;
  moderationReason?: string;
  user?: {
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
  };
}

export interface FeedResponse {
  posts: ForumPost[];
  nextCursor: string;
}

export interface ForumComment {
  id: number;
  postId: number;
  userId: number;
  content: string;
  parentId?: number;
  createdAt: string;
  replies?: ForumComment[];
  authorName?: string;
  authorAvatar?: string;
}

export interface CreatePostRequest {
  content: string;
  topic?: string;
  mediaUrl?: string | null;
  mediaType?: 'IMAGE' | 'VIDEO' | null;
}

export interface ForumStats {
  totalPosts: number;
  totalComments: number;
  hiddenPosts: number;
  activeUsers: number;
  aiFlaggedToxic?: number;
  aiFlaggedSpam?: number;
}

export interface TopicPreview {
  topic: string;
  confidence: number;
  reason: string;
}

@Injectable({ providedIn: 'root' })
export class ForumService {
  // During local development Angular dev server may serve index.html for unknown /api paths.
  // Prefer direct backend host when running frontend locally to avoid JSON parse errors.
  private baseUrl = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.port === '4200'))
    ? 'http://localhost:8081/api/forum'
    : '/api/forum';

  constructor(private http: HttpClient) {}

  getFeed(cursor: string | null, size: number = 10, mode: string = 'LATEST'): Observable<FeedResponse> {
    const params: any = { size: String(size), mode: (mode || 'LATEST').toUpperCase() };
    if (cursor) params.cursor = cursor;
    return this.http.get<FeedResponse>(`${this.baseUrl}/feed`, { params });
  }

  getPost(postId: number): Observable<ForumPost> {
    return this.http.get<ForumPost>(`${this.baseUrl}/posts/${postId}`);
  }

  createPost(content: string, mediaUrl: string | null, mediaType: 'IMAGE' | 'VIDEO' | null, topic?: string) {
    const payload: CreatePostRequest = { content, topic, mediaUrl, mediaType };
    return this.http.post<ForumPost>(`${this.baseUrl}/posts`, payload);
  }

  previewTopic(content: string) {
    return this.http.post<TopicPreview>(`${this.baseUrl}/posts/ai/topic-preview`, { content });
  }

  uploadMedia(file: File) {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<{url: string}>(`${this.baseUrl}/media/upload`, form);
  }

  deletePost(postId: number) {
    return this.http.delete<void>(`${this.baseUrl}/posts/${postId}`);
  }

  getMyPosts() {
    return this.http.get<ForumPost[]>(`${this.baseUrl}/posts/me`);
  }

  // Reactions
  reactToPost(postId: number, type: ReactionType) {
    return this.http.post<ReactionResponse>(`${this.baseUrl}/interactions/posts/${postId}/react`, { type });
  }

  getPostReactions(postId: number) {
    return this.http.get<ReactionResponse>(`${this.baseUrl}/interactions/posts/${postId}/reactions`);
  }

  // Comments
  getComments(postId: number) {
    return this.http.get<ForumComment[]>(`${this.baseUrl}/interactions/posts/${postId}/comments`);
  }

  addComment(postId: number, content: string, parentId?: number) {
    return this.http.post<ForumComment>(`${this.baseUrl}/interactions/posts/${postId}/comments`, { content, parentId });
  }

  deleteComment(commentId: number) {
    return this.http.delete<void>(`${this.baseUrl}/interactions/comments/${commentId}`);
  }

  // Saved posts
  getSavedPosts() {
    return this.http.get<ForumPost[]>(`${this.baseUrl}/flags/saved`);
  }

  toggleSave(postId: number) {
    return this.http.post<boolean>(`${this.baseUrl}/flags/save/${postId}`, {});
  }

  // Pinned
  getPinnedPost() {
    return this.http.get<ForumPost>(`${this.baseUrl}/flags/pinned`);
  }

  // Admin
  getAdminStats() {
    return this.http.get<any>(`${this.baseUrl}/admin/posts/stats`);
  }

  getAllPostsAdmin() {
    return this.http.get<ForumPost[]>(`${this.baseUrl}/admin/posts`);
  }

  updatePostStatus(postId: number, status: string) {
    return this.http.put<void>(`${this.baseUrl}/admin/posts/${postId}/status?status=${status}`, {});
  }

  /** Admin-only hard delete: removes post row + all dependent rows (comments, reactions, saved). */
  hardDeletePostAdmin(postId: number) {
    return this.http.delete<void>(`${this.baseUrl}/admin/posts/${postId}`);
  }
}