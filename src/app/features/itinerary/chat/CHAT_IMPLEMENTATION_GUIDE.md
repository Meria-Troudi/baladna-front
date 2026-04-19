# Chat Feature Implementation Guide

## Overview

This document provides a complete guide for implementing and using the real-time chat feature for itinerary collaborators. The chat system uses Angular with WebSocket (STOMP over SockJS) for real-time communication and REST API for message history and management.

## Architecture

### Three-Layer Architecture

1. **Services Layer**
   - `ChatApiService`: REST API communication
   - `ChatWebSocketService`: WebSocket/STOMP connection management
   - `ChatStateService`: State management and coordination

2. **Components Layer**
   - `ChatContainerComponent`: Main container component
   - `MessageListComponent`: Displays and manages messages
   - `ChatInputComponent`: Message composition interface
   - `TypingIndicatorComponent`: Shows typing status

3. **Models Layer**
   - `ChatModule`: Barrel export for all chat exports
   - Type definitions and interfaces in `chat.model.ts`

## Installation & Setup

### 1. Install Dependencies

```bash
npm install sockjs-client stompjs --save
npm install --save-dev @types/stompjs
```

### 2. Import Chat Module

In your itinerary module file:

```typescript
import { ChatModule } from './chat';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ChatModule  // Add chat module
  ]
})
export class ItineraryModule {}
```

### 3. Update App Module HTTP Interceptor

Ensure your JWT interceptor adds the Authorization header:

```typescript
@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();
    
    if (token) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
    
    return next.handle(req);
  }
}
```

## Component Usage

### Basic Implementation

```typescript
// In your itinerary-detail component

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-itinerary-detail',
  template: `
    <app-chat-container
      [itineraryId]="itineraryId"
      [currentUserId]="currentUserId"
      [currentUserName]="currentUserName"
    ></app-chat-container>
  `
})
export class ItineraryDetailComponent implements OnInit {
  itineraryId: string = '';
  currentUserId: number = 0;
  currentUserName: string = '';

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Get itinerary ID from route
    this.itineraryId = this.route.snapshot.paramMap.get('id') || '';

    // Get current user info from auth service
    const currentUser = this.authService.getCurrentUser();
    this.currentUserId = currentUser.id;
    this.currentUserName = currentUser.name;
  }
}
```

## Service Usage

### ChatStateService

```typescript
// In a component
import { ChatStateService } from './chat/services/chat-state.service';

constructor(private chatState: ChatStateService) {}

// Subscribe to state
this.chatState.getState$().subscribe(state => {
  console.log('Chat state:', state);
});

// Subscribe to messages
this.chatState.getMessages$().subscribe(messages => {
  console.log('Messages:', messages);
});

// Load chat history
this.chatState.loadChatHistory(itineraryId);

// Send message (via WebSocket)
this.chatState.sendMessage(itineraryId, 'Hello everyone!');

// Edit message
this.chatState.editMessage(itineraryId, messageId, 'Updated text');

// Delete message
this.chatState.deleteMessage(itineraryId, messageId);

// Handle system notifications
this.chatState.onSystemNotification$().subscribe(notification => {
  console.log('System notification:', notification);
});
```

### ChatWebSocketService

```typescript
import { ChatWebSocketService } from './chat/services/chat-websocket.service';

constructor(private webSocket: ChatWebSocketService) {}

// Connect to WebSocket
this.webSocket.connect(itineraryId, currentUserId)
  .then(() => console.log('Connected'))
  .catch(error => console.error('Connection failed:', error));

// Listen for incoming messages
this.webSocket.onMessageReceived$().subscribe(message => {
  console.log('Received:', message);
});

// Send message via WebSocket
this.webSocket.sendMessage('Hello');

// Send edit via WebSocket
this.webSocket.editMessage(messageId, 'Updated');

// Send delete via WebSocket
this.webSocket.deleteMessage(messageId);

// Send typing indicator
this.webSocket.sendTypingIndicator('John Doe');

// Disconnect
this.webSocket.disconnect();

// Check connection status
const connected = this.webSocket.isConnected();
```

### ChatApiService

```typescript
import { ChatApiService } from './chat/services/chat-api.service';

constructor(private chatApi: ChatApiService) {}

// Send message
this.chatApi.sendMessage(itineraryId, { content: 'Hello' })
  .subscribe(message => console.log('Sent:', message));

// Get chat history
this.chatApi.getChatHistory(itineraryId, { page: 0, size: 20 })
  .subscribe(history => console.log('History:', history));

// Get specific message
this.chatApi.getMessage(itineraryId, messageId)
  .subscribe(message => console.log('Message:', message));

// Update message
this.chatApi.updateMessage(itineraryId, messageId, { content: 'Updated' })
  .subscribe(updated => console.log('Updated:', updated));

// Delete message
this.chatApi.deleteMessage(itineraryId, messageId)
  .subscribe(() => console.log('Deleted'));

// Get latest message
this.chatApi.getLatestMessage(itineraryId)
  .subscribe(latest => console.log('Latest:', latest));

// Get message count
this.chatApi.getMessageCount(itineraryId)
  .subscribe(count => console.log('Total:', count));
```

## API Endpoints Reference

### REST Endpoints

- **POST** `/api/itineraries/{itineraryId}/chat/messages` - Send message
- **GET** `/api/itineraries/{itineraryId}/chat/history?page=0&size=20` - Get chat history
- **GET** `/api/itineraries/{itineraryId}/chat/messages/{messageId}` - Get specific message
- **PUT** `/api/itineraries/{itineraryId}/chat/messages/{messageId}` - Update message
- **DELETE** `/api/itineraries/{itineraryId}/chat/messages/{messageId}` - Delete message
- **GET** `/api/itineraries/{itineraryId}/chat/latest` - Get latest message
- **GET** `/api/itineraries/{itineraryId}/chat/count` - Get message count

### WebSocket Connection

**URL:** `ws://localhost:8080/api/chat/itineraries/{itineraryId}?userId={currentUserId}`

**Destinations:**
- **Send To:** `/app/itinerary` - Send messages to server
- **Subscribe From:** `/topic/itinerary/{itineraryId}` - Receive messages from server

## WebSocket Message Types

### SEND - New Message
```json
{
  "type": "SEND",
  "content": "Hello everyone!"
}
```

### EDIT - Edit Message
```json
{
  "type": "EDIT",
  "id": "message-id",
  "content": "Updated text"
}
```

### DELETE - Delete Message
```json
{
  "type": "DELETE",
  "id": "message-id"
}
```

### TYPING - User Typing
```json
{
  "type": "TYPING",
  "senderName": "John Doe"
}
```

## Error Handling

### Common Error Scenarios

1. **User not a collaborator**
   - HTTP 403 Forbidden
   - Handle in interceptor and redirect to unauthorized page

2. **WebSocket connection failed**
   - Automatic reconnection with exponential backoff (5 attempts max)
   - Connection error displayed in UI
   - User can manually retry

3. **Message sending failed**
   - Message shows error state
   - User can retry sending
   - Error notification shown

4. **Network timeout**
   - Automatic retry after delay
   - User can force reconnect

5. **Unauthorized (401)**
   - Redirect to login
   - Clear authentication tokens

### Error Handling in Components

```typescript
this.chatState.getError$().subscribe(error => {
  if (error) {
    // Show error toast/snackbar
    this.snackBar.open(error, 'Close', { duration: 5000 });
  }
});

this.webSocket.getConnectionError$().subscribe(error => {
  if (error) {
    // Show connection error banner
    console.error('Connection error:', error);
  }
});
```

## Performance Optimization

### 1. Change Detection Strategy

All components use `ChangeDetectionStrategy.OnPush` for better performance:

```typescript
@Component({
  selector: 'app-message-list',
  changeDetection: ChangeDetectionStrategy.OnPush
})
```

### 2. TrackBy Functions

Message list uses trackBy for efficient rendering:

```typescript
trackByMessageId(index: number, message: ChatMessageState): string {
  return message.id;
}
```

### 3. Pagination & Infinite Scroll

- Load only 20 messages initially
- Lazy load older messages on scroll up
- Prevents DOM from growing too large

### 4. Typing Indicator Debouncing

- Typing indicator sent max every 1-2 seconds
- Auto-dismiss after 3-5 seconds of inactivity
- Reduces unnecessary WebSocket traffic

### 5. Memoization

Use OnPush strategy to prevent unnecessary re-renders:

```typescript
// Only re-renders when inputs change
messages$ = this.chatState.getMessages$();
```

## Customization

### Styling

Override component styles:

```scss
// In your global styles
.chat-container {
  --primary-color: #3498db;
  --secondary-color: #2c3e50;
  --message-bg: #e8e8e8;
  --own-message-bg: #3498db;
}

.message-bubble {
  border-radius: 16px; // More rounded bubbles
  font-size: 15px;
}
```

### Custom Avatar Component

Replace avatar in MessageList:

```typescript
// Create custom avatar component
@Component({
  selector: 'app-custom-avatar',
  template: `
    <img [src]="avatarUrl" class="custom-avatar" />
  `
})
export class CustomAvatarComponent {
  @Input() userId: number;
  @Input() userName: string;

  avatarUrl: string = '';

  ngOnInit(): void {
    this.avatarUrl = `https://api.example.com/avatars/${this.userId}`;
  }
}

// Update MessageListComponent template to use custom avatar
```

### Feature Flags

Add feature flags for optional features:

```typescript
export const CHAT_FEATURES = {
  enableTypingIndicators: true,
  enableMessageEditing: true,
  enableMessageDeletion: true,
  enableMessageSearch: false,
  enableAttachments: false,
  maxMessageLength: 1000
};
```

## Testing

### Unit Tests

```typescript
describe('ChatStateService', () => {
  let service: ChatStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ChatStateService, ChatApiService, ChatWebSocketService]
    });
    service = TestBed.inject(ChatStateService);
  });

  it('should load chat history', (done) => {
    service.loadChatHistory('itinerary-1');
    
    service.getState$().subscribe(state => {
      if (state.messages.length > 0) {
        expect(state.totalMessages).toBeGreaterThan(0);
        done();
      }
    });
  });

  it('should handle incoming message', () => {
    const message = {
      type: 'SEND',
      id: '1',
      itineraryId: 'itinerary-1',
      senderId: 1,
      senderName: 'John',
      content: 'Hello',
      timestamp: new Date().toISOString(),
      status: 'SUCCESS'
    };

    // Simulate incoming message
    // Assert message was added to state
  });
});
```

### E2E Tests

```typescript
describe('Chat Feature E2E', () => {
  let page: ChatPage;

  beforeEach(() => {
    page = new ChatPage();
    page.navigateTo('/itineraries/1');
  });

  it('should load and display messages', async () => {
    await page.waitForMessages();
    const messages = await page.getMessageCount();
    expect(messages).toBeGreaterThan(0);
  });

  it('should send a message', async () => {
    const text = 'Hello World';
    await page.typeMessage(text);
    await page.clickSend();
    
    const lastMessage = await page.getLastMessage();
    expect(lastMessage.text).toContain(text);
  });
});
```

## Troubleshooting

### WebSocket Connection Issues

1. **Check NetworkTab** in Chrome DevTools
2. **Verify URL** is correct with proper ws:// scheme
3. **Check CORS** settings on backend
4. **Verify Token** is being sent in headers
5. **Check Firewall** for WebSocket port 8080

### Message Not Appearing

1. Check browser console for errors
2. Verify WebSocket connection status
3. Check if you're a collaborator on the itinerary
4. Check backend logs for permission issues

### High Memory Usage

1. Reduce page size (default 20)
2. Enable virtual scrolling for large message lists
3. Implement message cleanup for old messages
4. Monitor memory usage with DevTools

## Browser Support

- Chrome/Chromium 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Security Considerations

1. **JWT Token** - Always sent in Authorization header
2. **CSRF Protection** - Backend should implement CSRF tokens
3. **Message Validation** - Validate message content length
4. **Rate Limiting** - Implement rate limiting on backend
5. **SQL Injection** - Use parameterized queries on backend
6. **XSS Protection** - Angular automatically escapes content
7. **HTTPS/WSS** - Always use secure connections in production

## Production Checklist

- [ ] Enable HTTPS/WSS
- [ ] Implement rate limiting
- [ ] Add comprehensive error logging
- [ ] Set up monitoring and alerting
- [ ] Implement message archiving
- [ ] Add analytics tracking
- [ ] Test with high message volume
- [ ] Load test WebSocket connections
- [ ] Implement backup/recovery
- [ ] Document admin procedures

## Support & Maintenance

For issues or feature requests, please refer to:
- Backend API documentation
- Angular best practices guide
- WebSocket implementation guide
- Type definitions in chat.model.ts

## Changelog

### v1.0.0 (Initial Release)
- Real-time chat with WebSocket
- Message send, edit, delete
- Typing indicators
- User presence (join/leave notifications)
- Pagination for message history
- Connection status indicators
- Error handling and reconnection logic
