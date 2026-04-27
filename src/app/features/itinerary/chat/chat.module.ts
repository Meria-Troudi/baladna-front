import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../../shared/shared.module';

// Components
import { ChatContainerComponent } from './components/chat-container/chat-container.component';
import { MessageListComponent } from './components/message-list/message-list.component';
import { ChatInputComponent } from './components/chat-input/chat-input.component';
import { TypingIndicatorComponent } from './components/typing-indicator/typing-indicator.component';

// Services
import { ChatApiService } from './services/chat-api.service';
import { ChatWebSocketService } from './services/chat-websocket.service';
import { ChatStateService } from './services/chat-state.service';

/**
 * Chat Module
 * Encapsulates all chat feature components, services, and functionality
 */
@NgModule({
  declarations: [
    ChatContainerComponent,
    MessageListComponent,
    ChatInputComponent,
    TypingIndicatorComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule
  ],
  providers: [
    ChatApiService,
    ChatWebSocketService,
    ChatStateService
  ],
  exports: [
    ChatContainerComponent,
    MessageListComponent,
    ChatInputComponent,
    TypingIndicatorComponent
  ]
})
export class ChatModule {}
