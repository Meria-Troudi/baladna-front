/**
 * Chat Feature - Barrel Export
 * Central point for importing chat components and services
 */

// Components
export { ChatContainerComponent } from './components/chat-container/chat-container.component';
export { MessageListComponent } from './components/message-list/message-list.component';
export { ChatInputComponent } from './components/chat-input/chat-input.component';
export { TypingIndicatorComponent } from './components/typing-indicator/typing-indicator.component';

// Services
export { ChatApiService } from './services/chat-api.service';
export { ChatWebSocketService } from './services/chat-websocket.service';
export { ChatStateService } from './services/chat-state.service';

// Models
export * from './models/chat.model';

// Module
export { ChatModule } from './chat.module';
