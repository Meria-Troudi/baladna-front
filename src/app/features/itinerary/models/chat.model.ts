/**
 * Chat Domain Models and Interfaces
 * Defines all data structures for the real-time chat feature
 */

/**
 * Represents a single chat message
 */
export interface ChatMessage {
  id: string;
  itineraryId: string;
  senderId: number;
  senderName: string;
  content: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  isEdited?: boolean;
}

/**
 * Response structure for paginated chat history
 */
export interface ChatHistoryResponse {
  itineraryId: string;
  messages: ChatMessage[];
  totalMessages: number;
  page: number;
  size: number;
}

/**
 * Internal state for chat messages with additional UI properties
 */
export interface ChatMessageState extends ChatMessage {
  isPending?: boolean;
  hasError?: boolean;
  errorMessage?: string;
}

/**
 * WebSocket message types
 */
export type WebSocketMessageType = 'SEND' | 'EDIT' | 'DELETE' | 'TYPING' | 'USER_JOINED' | 'USER_LEFT' | 'ERROR';

/**
 * Base structure for WebSocket messages
 */
export interface WebSocketMessage {
  type: WebSocketMessageType;
  timestamp?: string;
  status?: 'SUCCESS' | 'FAILED';
  error?: string;
}

/**
 * WebSocket SEND message (new message)
 */
export interface WebSocketSendMessage extends WebSocketMessage {
  type: 'SEND';
  content: string;
  id?: string;
  itineraryId?: string;
  senderId?: number;
  senderName?: string;
}

/**
 * WebSocket SEND message received from server
 */
export interface WebSocketSendReceived extends ChatMessage {
  type: 'SEND';
  timestamp: string;
  status: 'SUCCESS' | 'FAILED';
}

/**
 * WebSocket EDIT message
 */
export interface WebSocketEditMessage extends WebSocketMessage {
  type: 'EDIT';
  id: string;
  content: string;
  itineraryId?: string;
  senderId?: number;
  senderName?: string;
}

/**
 * WebSocket EDIT message received from server
 */
export interface WebSocketEditReceived extends ChatMessage {
  type: 'EDIT';
  timestamp: string;
  status: 'SUCCESS' | 'FAILED';
}

/**
 * WebSocket DELETE message
 */
export interface WebSocketDeleteMessage extends WebSocketMessage {
  type: 'DELETE';
  id: string;
  itineraryId?: string;
  senderId?: number;
}

/**
 * WebSocket DELETE message received from server
 */
export interface WebSocketDeleteReceived extends WebSocketMessage {
  type: 'DELETE';
  id: string;
  itineraryId: string;
  senderId: number;
  timestamp: string;
  status: 'SUCCESS' | 'FAILED';
}

/**
 * WebSocket TYPING message (user is typing)
 */
export interface WebSocketTypingMessage extends WebSocketMessage {
  type: 'TYPING';
  senderName: string;
  senderId?: number;
}

/**
 * WebSocket TYPING message received from server
 */
export interface WebSocketTypingReceived extends WebSocketMessage {
  type: 'TYPING';
  senderId: number;
  senderName: string;
  timestamp: string;
}

/**
 * WebSocket USER_JOINED message
 */
export interface WebSocketUserJoined extends WebSocketMessage {
  type: 'USER_JOINED';
  senderId: number;
  senderName: string;
  timestamp: string;
}

/**
 * WebSocket USER_LEFT message
 */
export interface WebSocketUserLeft extends WebSocketMessage {
  type: 'USER_LEFT';
  senderId: number;
  timestamp: string;
}

/**
 * WebSocket ERROR message
 */
export interface WebSocketError extends WebSocketMessage {
  type: 'ERROR';
  status: 'FAILED';
  error: string;
}

/**
 * Union type for all WebSocket messages
 */
export type WebSocketMessagePayload = 
  | WebSocketSendMessage 
  | WebSocketEditMessage 
  | WebSocketDeleteMessage 
  | WebSocketTypingMessage;

/**
 * Union type for all WebSocket received messages
 */
export type WebSocketReceivedPayload = 
  | WebSocketSendReceived 
  | WebSocketEditReceived 
  | WebSocketDeleteReceived 
  | WebSocketTypingReceived 
  | WebSocketUserJoined 
  | WebSocketUserLeft 
  | WebSocketError;

/**
 * Chat state management model
 */
export interface ChatState {
  messages: ChatMessageState[];
  totalMessages: number;
  currentPage: number;
  pageSize: number;
  isLoading: boolean;
  error: string | null;
  wsConnected: boolean;
  wsConnecting: boolean;
  typingUsers: Set<number>;
  editingMessageId: string | null;
  selectedMessageId: string | null;
  connectionError: string | null;
  lastSyncTime: string | null;
}

/**
 * REST API response for sending a message
 */
export interface SendMessageRequest {
  content: string;
}

/**
 * REST API response for updating a message
 */
export interface UpdateMessageRequest {
  content: string;
}

/**
 * Chat pagination query parameters
 */
export interface ChatPaginationParams {
  page?: number;
  size?: number;
}

/**
 * Collaborator information for chat context
 */
export interface ChatCollaborator {
  id: number;
  name: string;
  email?: string;
  avatar?: string;
  isOnline?: boolean;
  isTyping?: boolean;
}

/**
 * System notification message (UI only)
 */
export interface SystemNotification {
  id: string;
  type: 'USER_JOINED' | 'USER_LEFT' | 'MESSAGE_EDITED' | 'INFO';
  content: string;
  timestamp: string;
  userId?: number;
}
