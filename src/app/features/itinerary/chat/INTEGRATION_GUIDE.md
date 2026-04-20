# Chat Feature - Quick Integration Guide

## Step 1: Install Dependencies

```bash
npm install sockjs-client stompjs
npm install --save-dev @types/stompjs
```

## Step 2: Update package.json Scripts (Optional)

```json
{
  "scripts": {
    "start": "ng serve",
    "build": "ng build",
    "build:prod": "ng build --configuration production"
  }
}
```

## Step 3: Import ChatModule in Itinerary Module

Edit `src/app/features/itinerary/itinerary.module.ts`:

```typescript
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ItineraryRoutingModule } from './itinerary-routing.module';
import { ChatModule } from './chat/chat.module';  // ← Add this import

// Components
import { ItineraryDetailComponent } from './pages/itinerary-detail/itinerary-detail.component';
// ... other imports

@NgModule({
  declarations: [
    ItineraryDetailComponent,
    // ... other components
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ItineraryRoutingModule,
    ChatModule  // ← Add ChatModule here
  ]
})
export class ItineraryModule {}
```

## Step 4: Add Chat to Itinerary Detail Component

Edit `src/app/features/itinerary/pages/itinerary-detail/itinerary-detail.component.ts`:

```typescript
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '@app/core/services/auth.service';

@Component({
  selector: 'app-itinerary-detail',
  templateUrl: './itinerary-detail.component.html',
  styleUrls: ['./itinerary-detail.component.css']
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

    // Get current user from auth service
    const currentUser = this.authService.getCurrentUser();
    this.currentUserId = currentUser.id;
    this.currentUserName = currentUser.name;
  }
}
```

Edit `src/app/features/itinerary/pages/itinerary-detail/itinerary-detail.component.html`:

```html
<div class="itinerary-detail-container">
  <!-- Existing content -->
  <div class="itinerary-header">
    <h1>{{ itineraryTitle }}</h1>
  </div>

  <!-- Chat Section -->
  <div class="itinerary-chat-section">
    <app-chat-container
      [itineraryId]="itineraryId"
      [currentUserId]="currentUserId"
      [currentUserName]="currentUserName"
    ></app-chat-container>
  </div>

  <!-- Other sections -->
</div>
```

Add styling to `itinerary-detail.component.css`:

```css
.itinerary-detail-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.itinerary-header {
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  background-color: #f5f5f5;
}

.itinerary-chat-section {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
```

## Step 5: Ensure JWT Interceptor is Set Up

Your `jwt.interceptor.ts` should already add the Authorization header:

```typescript
@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

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

## Step 6: Configure Base URL (Optional)

If your API base URL is different, update `CHAT_CONFIG` in `chat.config.ts`:

```typescript
export const CHAT_CONFIG = {
  api: {
    baseUrl: '/api/itineraries',
    // ... other config
  },
  websocket: {
    baseUrl: '/api/chat/itineraries',
    // ... other config
  }
};
```

## Step 7: Test the Integration

1. Start the development server:
   ```bash
   ng serve
   ```

2. Navigate to an itinerary detail page:
   ```
   http://localhost:4200/itineraries/1
   ```

3. You should see the chat interface at the bottom

4. Try these actions:
   - Type and send a message
   - Edit your own message
   - Delete your own message
   - Watch for typing indicators from other users
   - See user join/leave notifications

## Troubleshooting

### Chat component not showing

1. Check imports in itinerary.module.ts
2. Verify ChatModule is added to imports array
3. Check browser console for errors (F12)

### WebSocket connection errors

1. Check that WS_URL is correct in chat-websocket.service.ts
2. Verify backend is running on correct port
3. Check Network tab in DevTools for WebSocket connection

### JWT errors (401)

1. Verify JWT interceptor is configured
2. Check token is being stored correctly
3. Verify token is valid and not expired

### CORS errors

1. Backend must allow requests from frontend origin
2. Backend must include CORS headers

### High memory usage

1. Reduce page size in chat.config.ts
2. Implement virtual scrolling for large lists
3. Check for memory leaks in browser DevTools

## File Structure

```
src/app/features/itinerary/
├── chat/
│   ├── components/
│   │   ├── chat-container/
│   │   │   ├── chat-container.component.ts
│   │   │   ├── chat-container.component.html
│   │   │   └── chat-container.component.css
│   │   ├── message-list/
│   │   │   ├── message-list.component.ts
│   │   │   ├── message-list.component.html
│   │   │   └── message-list.component.css
│   │   ├── chat-input/
│   │   │   ├── chat-input.component.ts
│   │   │   ├── chat-input.component.html
│   │   │   └── chat-input.component.css
│   │   └── typing-indicator/
│   │       ├── typing-indicator.component.ts
│   │       ├── typing-indicator.component.html
│   │       └── typing-indicator.component.css
│   ├── services/
│   │   ├── chat-api.service.ts
│   │   ├── chat-websocket.service.ts
│   │   └── chat-state.service.ts
│   ├── models/
│   │   └── chat.model.ts
│   ├── chat.module.ts
│   ├── chat.config.ts
│   ├── index.ts
│   ├── CHAT_IMPLEMENTATION_GUIDE.md
│   └── INTEGRATION_GUIDE.md (this file)
├── models/
│   └── chat.model.ts  (also here for easier imports)
├── services/
│   ├── chat-api.service.ts  (also here for easier imports)
│   ├── chat-websocket.service.ts  (also here for easier imports)
│   └── chat-state.service.ts  (also here for easier imports)
├── components/
│   └── ... (existing itinerary components)
└── itinerary.module.ts
```

## Next Steps

1. **Add Message Search** - Implement search for past messages
2. **Add Message Reactions** - Allow emoji reactions to messages
3. **Add File Attachments** - Support uploading files
4. **Add Message Pinning** - Pin important messages
5. **Add Read Receipts** - Show when messages are read
6. **Add Users List** - Display active collaborators in chat
7. **Add Mobile Optimization** - Improve mobile experience
8. **Add Message Notifications** - Desktop/push notifications for new messages

## Support

For more detailed information, see `CHAT_IMPLEMENTATION_GUIDE.md` in the chat folder.

For API documentation, refer to the backend API spec provided in the chat feature overview.
