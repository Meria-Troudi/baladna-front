# Real-Time Chat Feature for Itinerary Collaborators

A comprehensive Angular implementation of a real-time chat system for itinerary collaborators with WebSocket support, message history, user presence, and typing indicators.

## Features

✅ **Real-Time Messaging**
- WebSocket-based communication using STOMP over SockJS
- Automatic reconnection with exponential backoff
- Connection status indicators

✅ **Message Management**
- Send, edit, and delete messages
- Soft-delete (message marked as deleted, not removed)
- Edit history tracking
- Optimistic UI updates

✅ **User Experience**
- Infinite scroll for message history pagination
- Auto-scroll to latest messages
- Typing indicators for active users
- User join/leave notifications
- System messages support

✅ **UI/UX**
- Responsive design (mobile, tablet, desktop)
- Smooth animations
- Message bubbles with sender avatars
- Relative timestamps
- Keyboard shortcuts (Enter to send, Shift+Enter for new line)
- Auto-growing text area

✅ **Performance**
- OnPush change detection strategy
- TrackBy functions for efficient rendering
- Pagination to manage memory
- Debounced typing indicators
- Lazy loading of message history

✅ **Error Handling**
- Comprehensive error messages
- Automatic reconnection logic
- Graceful degradation
- Network failure recovery

✅ **Security**
- JWT token authentication
- Authorization checks
- HTTPS/WSS support
- Input validation

## Project Structure

```
chat/
├── components/
│   ├── chat-container/              # Main chat container
│   │   ├── chat-container.component.ts
│   │   ├── chat-container.component.html
│   │   └── chat-container.component.css
│   ├── message-list/                # Message display list
│   │   ├── message-list.component.ts
│   │   ├── message-list.component.html
│   │   └── message-list.component.css
│   ├── chat-input/                  # Message composition
│   │   ├── chat-input.component.ts
│   │   ├── chat-input.component.html
│   │   └── chat-input.component.css
│   └── typing-indicator/            # Typing status display
│       ├── typing-indicator.component.ts
│       ├── typing-indicator.component.html
│       └── typing-indicator.component.css
├── services/
│   ├── chat-api.service.ts          # REST API calls
│   ├── chat-websocket.service.ts    # WebSocket management
│   └── chat-state.service.ts        # State management
├── models/
│   └── chat.model.ts                # TypeScript interfaces
├── chat.module.ts                   # Feature module
├── chat.config.ts                   # Configuration
├── index.ts                         # Barrel export
├── INTEGRATION_GUIDE.md             # Integration instructions
├── CHAT_IMPLEMENTATION_GUIDE.md     # Detailed implementation docs
└── README.md                        # This file
```

## Key Components

### ChatContainerComponent
Main orchestrator component that:
- Manages chat initialization and cleanup
- Coordinates between services and sub-components
- Handles message operations (send, edit, delete)
- Manages connection status and errors

### MessageListComponent
Displays paginated message list with:
- Auto-scroll to bottom on new messages
- Infinite scroll up to load older messages
- Message editing interface
- Delete confirmation
- Typing indicators

### ChatInputComponent
Message composition with:
- Auto-growing textarea
- Character counter
- Connection status
- Keyboard shortcuts
- Typing indicator emission

### TypingIndicatorComponent
Shows animated typing status when users are composing messages.

## Core Services

### ChatApiService
REST API communication:
- Send message
- Get chat history (paginated)
- Update message
- Delete message
- Get latest message
- Get message count

### ChatWebSocketService
WebSocket (STOMP) management:
- Connection initialization and cleanup
- Automatic reconnection
- Message subscription
- Typing indicator handling
- Connection status tracking

### ChatStateService
State management:
- Centralized state store
- Message list management
- Pagination handling
- Event emission
- WebSocket integration
- Error handling

## Installation

### 1. Install Dependencies

```bash
npm install sockjs-client stompjs
npm install --save-dev @types/stompjs
```

### 2. Import Chat Module

```typescript
import { ChatModule } from './chat';

@NgModule({
  imports: [ChatModule]
})
export class ItineraryModule {}
```

### 3. Use Chat Component

```typescript
<app-chat-container
  [itineraryId]="itineraryId"
  [currentUserId]="userId"
  [currentUserName]="userName"
></app-chat-container>
```

## API Specification

### REST Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/itineraries/{id}/chat/messages` | Send message |
| GET | `/api/itineraries/{id}/chat/history?page=0&size=20` | Get message history |
| GET | `/api/itineraries/{id}/chat/messages/{msgId}` | Get specific message |
| PUT | `/api/itineraries/{id}/chat/messages/{msgId}` | Update message |
| DELETE | `/api/itineraries/{id}/chat/messages/{msgId}` | Delete message |
| GET | `/api/itineraries/{id}/chat/latest` | Get latest message |
| GET | `/api/itineraries/{id}/chat/count` | Get message count |

### WebSocket Events

**SEND** - New message
**EDIT** - Edit message
**DELETE** - Delete message
**TYPING** - User typing
**USER_JOINED** - User joined
**USER_LEFT** - User left
**ERROR** - Error occurred

## Configuration

Edit `chat.config.ts` to customize:

```typescript
const CHAT_CONFIG = {
  websocket: {
    maxReconnectAttempts: 5,
    reconnectDelay: 3000,
    typingIndicatorTimeout: 3000
  },
  api: {
    defaultPageSize: 20,
    maxMessageLength: 5000
  },
  ui: {
    showTimestamps: true,
    showAvatars: true,
    autoScrollToBottom: true
  },
  features: {
    enableMessageEditing: true,
    enableMessageDeletion: true,
    enableTypingIndicators: true,
    enableUserPresence: true
  }
};
```

## Usage Examples

### Basic Usage

```typescript
<app-chat-container
  [itineraryId]="'itinerary-123'"
  [currentUserId]="456"
  [currentUserName]="'John Doe'"
></app-chat-container>
```

### Advanced - Using Services Directly

```typescript
constructor(private chatState: ChatStateService) {}

ngOnInit() {
  // Load history
  this.chatState.loadChatHistory('itinerary-123');

  // Subscribe to messages
  this.messages$ = this.chatState.getMessages$();

  // Subscribe to connection status
  this.connected$ = this.chatState.getConnectionStatus$();

  // Send message
  this.chatState.sendMessage('itinerary-123', 'Hello!');

  // Edit message
  this.chatState.editMessage('itinerary-123', 'msg-id', 'Updated text');

  // Delete message
  this.chatState.deleteMessage('itinerary-123', 'msg-id');
}
```

## Error Handling

The system handles common errors:

| Error | Cause | Resolution |
|-------|-------|-----------|
| Connection failed | Network issue | Auto-reconnect with exponential backoff |
| Not a collaborator | Permission issue | Show error modal, disable chat |
| Message send failed | Server error | Show error toast, allow retry |
| Unauthorized | Invalid token | Redirect to login |
| Network timeout | Slow connection | Automatic retry |

## Performance Optimization

- **OnPush Change Detection** - Only updates when inputs change
- **TrackBy Functions** - Efficient list rendering
- **Pagination** - Prevents DOM from growing too large
- **Debouncing** - Reduces WebSocket traffic for typing indicators
- **Lazy Loading** - Loads older messages on demand

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Security

- JWT-based authentication
- Authorization checks for all operations
- Input validation and sanitization
- HTTPS/WSS for encrypted connections
- CSRF protection (backend)

## Testing

### Unit Tests

```bash
ng test --include='**/chat/**/*.spec.ts'
```

### E2E Tests

```bash
ng e2e
```

## Troubleshooting

### WebSocket Connection Issues
1. Check Network tab in DevTools
2. Verify WS URL is correct
3. Check backend is running
4. Verify JWT token is valid

### Messages Not Appearing
1. Check browser console for errors
2. Verify connection is established
3. Ensure you're a collaborator
4. Check backend logs

### High Memory Usage
1. Reduce page size in config
2. Implement virtual scrolling
3. Clear old messages periodically

## Best Practices

- ✅ Always handle connection errors
- ✅ Use ChangeDetectionStrategy.OnPush
- ✅ Unsubscribe from observables
- ✅ Validate input before sending
- ✅ Implement proper error boundaries
- ✅ Use trackBy in ngFor loops
- ✅ Debounce high-frequency events

## Future Enhancements

- Message search
- Message reactions (emoji)
- File attachments
- Message pinning
- Read receipts
- Voice/video calling
- Message threads
- Custom emojis
- Message translations
- Message formatting

## Documentation

- [Integration Guide](./INTEGRATION_GUIDE.md) - Step-by-step integration
- [Implementation Guide](./CHAT_IMPLEMENTATION_GUIDE.md) - Detailed documentation
- [Type Definitions](./models/chat.model.ts) - TypeScript interfaces

## Contribution Guidelines

1. Follow Angular style guide
2. Use TypeScript strict mode
3. Add unit tests for new features
4. Update documentation
5. Test on multiple browsers

## License

This feature is part of the Baladna project.

## Support

For issues or questions:
1. Check documentation
2. Review type definitions
3. Check error logs
4. Contact development team

## Changelog

### v1.0.0 (Release)
- Real-time chat with WebSocket
- Message CRUD operations
- Typing indicators
- User presence (join/leave)
- Message history pagination
- Connection management
- Error handling
- Responsive design
