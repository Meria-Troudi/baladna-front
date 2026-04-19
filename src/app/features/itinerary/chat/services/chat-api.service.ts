import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ChatMessage,
  ChatHistoryResponse,
  SendMessageRequest,
  UpdateMessageRequest,
  ChatPaginationParams
} from '../models/chat.model';

/**
 * REST API Service for Chat Operations
 * Handles all HTTP communication with the backend for chat management
 */
@Injectable({
  providedIn: 'root'
})
export class ChatApiService {
  private apiUrl = '/api/itineraries';

  constructor(private http: HttpClient) {}

  /**
   * Send a new message to the itinerary chat
   * @param itineraryId The itinerary ID
   * @param request The message content
   * @returns Observable of the created message
   */
  sendMessage(itineraryId: string, request: SendMessageRequest): Observable<ChatMessage> {
    return this.http.post<ChatMessage>(
      `${this.apiUrl}/${itineraryId}/chat/messages`,
      request
    );
  }

  /**
   * Retrieve paginated chat history
   * @param itineraryId The itinerary ID
   * @param params Pagination parameters (page, size)
   * @returns Observable of paginated chat history
   */
  getChatHistory(
    itineraryId: string,
    params?: ChatPaginationParams
  ): Observable<ChatHistoryResponse> {
    let httpParams = new HttpParams();

    if (params?.page !== undefined) {
      httpParams = httpParams.set('page', params.page.toString());
    }

    if (params?.size !== undefined) {
      httpParams = httpParams.set('size', params.size.toString());
    }

    return this.http.get<ChatHistoryResponse>(
      `${this.apiUrl}/${itineraryId}/chat/history`,
      { params: httpParams }
    );
  }

  /**
   * Get a specific message by ID
   * @param itineraryId The itinerary ID
   * @param messageId The message ID
   * @returns Observable of the message
   */
  getMessage(itineraryId: string, messageId: string): Observable<ChatMessage> {
    return this.http.get<ChatMessage>(
      `${this.apiUrl}/${itineraryId}/chat/messages/${messageId}`
    );
  }

  /**
   * Update an existing message
   * @param itineraryId The itinerary ID
   * @param messageId The message ID
   * @param request The updated message content
   * @returns Observable of the updated message
   */
  updateMessage(
    itineraryId: string,
    messageId: string,
    request: UpdateMessageRequest
  ): Observable<ChatMessage> {
    return this.http.put<ChatMessage>(
      `${this.apiUrl}/${itineraryId}/chat/messages/${messageId}`,
      request
    );
  }

  /**
   * Delete a message
   * @param itineraryId The itinerary ID
   * @param messageId The message ID
   * @returns Observable that completes when deletion is successful
   */
  deleteMessage(itineraryId: string, messageId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${itineraryId}/chat/messages/${messageId}`
    );
  }

  /**
   * Get the latest message in the chat
   * @param itineraryId The itinerary ID
   * @returns Observable of the latest message or null if no messages
   */
  getLatestMessage(itineraryId: string): Observable<ChatMessage | null> {
    return this.http.get<ChatMessage | null>(
      `${this.apiUrl}/${itineraryId}/chat/latest`
    );
  }

  /**
   * Get the total message count for a chat
   * @param itineraryId The itinerary ID
   * @returns Observable of the message count
   */
  getMessageCount(itineraryId: string): Observable<number> {
    return this.http.get<number>(
      `${this.apiUrl}/${itineraryId}/chat/count`
    );
  }
}
