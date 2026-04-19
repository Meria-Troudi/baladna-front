# Google Calendar OAuth Frontend Integration Guide

## ✅ Implementation Complete

All frontend components for Google Calendar OAuth integration have been successfully implemented. This guide explains the architecture and what backend configuration is needed.

## 📁 New Files Created

### 1. **GoogleCalendarService** (Updated)
📂 `src/app/features/itinerary/services/google-calendar.service.ts`

**Key Features:**
- `openGoogleCalendarAuth()` - Opens popup with built-in popup monitoring
- Listens for messages from popup using `window.postMessage()`
- Handles popup closure detection and timeout management
- Emits OAuth results via `oAuthResult$` observable
- All HTTP endpoints abstracted with proper error handling

**Methods:**
```typescript
openGoogleCalendarAuth(): Observable<OAuthResponse>     // Opens popup
getAuthUrl(): Observable<string>                         // Gets Google OAuth URL
handleOAuthCallback(code: string): Observable<OAuthResponse>  // Legacy method
checkConnectionStatus(): Observable<boolean>             // Check if connected
syncItinerary(itineraryId: string): Observable<any>     // Sync to calendar
disconnectCalendar(): Observable<any>                   // Disconnect account
getConnectionStatusSync(): boolean                      // Get sync status
emitOAuthResult(result: OAuthResponse): void           // Emit OAuth result
```

### 2. **OAuthCallbackComponent** (New)
📂 `src/app/features/itinerary/pages/oauth-callback/oauth-callback.component.ts`

**Purpose:** Handles the OAuth callback in the popup window

**Flow:**
1. Receives authorization code from Google redirect
2. Calls backend `/oauth/callback` endpoint
3. Extracts JSON response from backend
4. Posts message to parent window via `window.postMessage()`
5. Closes popup automatically

**Features:**
- Loading state with spinner animation
- Success/error display
- Automatic message posting to parent window
- Auto-closes after 1.5-3 seconds
- Styled modal with animations

### 3. **NotificationService** (New)
📂 `src/app/shared/services/notification.service.ts`

**Methods:**
```typescript
success(message: string, duration?: number): void
error(message: string, duration?: number): void
info(message: string, duration?: number): void
warning(message: string, duration?: number): void
```

**Observable:** `notification$` - Subscribe to display notifications

### 4. **NotificationDisplayComponent** (New)
📂 `src/app/shared/components/notification-display/notification-display.component.ts`

**Features:**
- Displays toast notifications at top-right
- Auto-closes based on duration
- Smooth animations (slide-in/slide-out)
- Responsive design (mobile-friendly)
- Icons for different notification types
- Dark-themed for different types (success/error/info/warning)
- Already added to `app.component.html` and SharedModule

### 5. **PlanningCalendarModalComponent** (Updated)
📂 `src/app/features/itinerary/pages/planning-calendar-modal/planning-calendar-modal.component.ts`

**Updates:**
- Uses new `openGoogleCalendarAuth()` method
- Subscribes to `oAuthResult$` for popup communication
- Integrated NotificationService for user feedback
- Better error handling and states
- Proper cleanup with observables

## 🔄 Frontend OAuth Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  User Clicks "Connect to Google Calendar"                       │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  Frontend calls getAuthUrl()                                    │
│  GET /api/itineraries/calendar/auth-url                        │
│  Returns: "https://accounts.google.com/o/oauth2/v2/auth?..."  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  Open Popup to Google Auth URL                                 │
│  - 600x700 window                                              │
│  - Centered on screen                                          │
│  - Monitor for closure                                         │
│  - Set 5-minute timeout                                        │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼ (in popup)
┌─────────────────────────────────────────────────────────────────┐
│  User Logs In & Authorizes on Google                           │
│  Google Redirects to: /api/itineraries/calendar/oauth/callback │
│  ?code=xxx&state=userId                                        │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼ (in popup)
┌─────────────────────────────────────────────────────────────────┐
│  OAuthCallbackComponent Detects Callback                       │
│  Receives code from query params                               │
│  Shows "Processing authorization..." spinner                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼ (in popup)
┌─────────────────────────────────────────────────────────────────┐
│  Popup Calls Backend Callback Handler                          │
│  POST /api/itineraries/calendar/oauth/callback                 │
│  Body: { authorizationCode: code }                            │
│  Response: { success: true, userId: 1, ... }                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼ (in popup)
┌─────────────────────────────────────────────────────────────────┐
│  Popup Sends Message to Parent Window                          │
│  window.opener.postMessage({                                   │
│    type: 'oauth-callback-result',                             │
│    data: { success: true, userId: 1, ... }                    │
│  }, window.location.origin)                                   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼ (in popup)
┌─────────────────────────────────────────────────────────────────┐
│  Popup Shows Success or Error                                  │
│  Auto-closes after 1.5-3 seconds                              │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼ (back to parent)
┌─────────────────────────────────────────────────────────────────┐
│  Parent Window Receives Message                                │
│  Updates isConnected = true                                    │
│  Shows "✅ Connected!" toast notification                       │
│  Loads recent itineraries                                      │
│  Updates UI: Show Sync & Disconnect buttons                    │
└─────────────────────────────────────────────────────────────────┘
```

## 🚨 CRITICAL BACKEND CONFIGURATION NEEDED

### Issue: Backend Returns JSON Instead of Redirecting

Currently, the backend returns JSON directly:
```
GET /api/itineraries/calendar/oauth/callback?code=xxx&state=userId
Response: {"success":true,"message":"...","userId":1}
```

**Problem:** The popup shows raw JSON text instead of closing automatically.

**Solution Options:**

#### ✅ Option A (RECOMMENDED): Backend Redirects to Frontend Route

Modify backend to redirect to our frontend callback handler:

```
GET /api/itineraries/calendar/oauth/callback?code=xxx&state=userId
Response: 302 Redirect
Location: http://localhost:4200/oauth/callback?code=xxx&state=userId
```

**Why this works:**
- Popup loads our `OAuthCallbackComponent`
- Component handles the callback elegantly
- Shows success/error message
- Sends result to parent window
- Auto-closes

#### ✅ Option B: Backend Returns HTML with JavaScript

Modify backend to return HTML instead of JSON:

```html
<!DOCTYPE html>
<html>
<body>
  <script>
    const result = {{JSON_RESPONSE_HERE}};
    window.opener.postMessage({
      type: 'oauth-callback-result',
      data: result
    }, window.location.origin);
    window.close();
  </script>
</body>
</html>
```

### 🔧 Temporary Workaround (Not Recommended)

Until backend is updated, users will see:
1. ✅ "Processing authorization..." spinner in popup
2. ❌ Raw JSON displayed after callback
3. ⚠️ Popup must be closed manually
4. ⏳ Parent window waits for timeout (5 minutes)

**Note:** The OAuth still succeeds on the backend, but UX is poor without the redirect.

## 📝 Route Configuration

The following route has been added to `app-routing.module.ts`:

```typescript
{ path: 'oauth/callback', component: OAuthCallbackComponent }
```

**Important:** This route does NOT require authentication (no guards) because Google redirects here before the user is properly authenticated.

## 🧪 Testing the Implementation

### Manual Test Flow:

1. **Start the application:**
   ```bash
   ng serve
   ```

2. **Navigate to Planning Calendar:**
   - As a Tourist user
   - Open Planning Calendar modal
   - Click "Connect to Google Calendar"

3. **Verify Popup:**
   - ✅ Popup opens to Google login
   - ✅ Popup is 600x700 pixels
   - ✅ Popup is centered
   - ✅ Title is "Google Calendar Auth"

4. **Complete OAuth:**
   - Log in with Google account
   - Authorize the application
   - **Observe what happens:**
     - With redirect fix: Popup closes, success message shows, UI updates
     - Without redirect: Popup shows JSON, must close manually

5. **Verify Success State:**
   - ✅ Status shows "✅ Connected to Google"
   - ✅ "Sync to Google Calendar" button appears
   - ✅ "Disconnect" button appears
   - ✅ Toast notification shows success

6. **Test Sync:**
   - Click "Sync to Google Calendar"
   - Select an itinerary
   - Verify sync completes
   - Check Google Calendar for events

7. **Test Disconnect:**
   - Click "Disconnect"
   - Confirm in dialog
   - Verify status returns to "Not Connected"

### Error Test Flows:

1. **User Closes Popup:**
   - Opens popup, closes it immediately
   - Error message: "Authorization cancelled by user"
   - UI remains in "Not Connected" state

2. **Network Error:**
   - Simulate network error while opening popup
   - Error message: "Popup blocked" or network error
   - Retry button still available

3. **Timeout (5 minutes):**
   - Open popup but don't authorize
   - Wait 5 minutes
   - Popup auto-closes
   - Error message: "Authorization timeout"

## 📱 Component Usage

### In Planning Calendar Component:

```typescript
// Already implemented, but here's what happens:

// 1. Connect to Google Calendar
this.googleCalendarService.openGoogleCalendarAuth()
  .subscribe({
    next: (response) => {
      this.isConnected = true;
      this.notificationService.success(response.message);
      this.loadRecentItineraries();
    },
    error: (error) => {
      this.notificationService.error(error.message);
    }
  });

// 2. Listen for OAuth results
this.googleCalendarService.oAuthResult$
  .subscribe((result) => {
    // Handle result from popup
  });

// 3. Show notifications
this.notificationService.success('Calendar synced!');
this.notificationService.error('Sync failed');
```

## 🛡️ Security Considerations

1. **postMessage Origin Check:**
   ```typescript
   if (event.origin !== window.location.origin) return;
   ```
   - Prevents messages from other origins
   - Only accepts messages from same domain

2. **JWT Token Handling:**
   - OAuth callback endpoint does NOT require JWT
   - Other endpoints require valid JWT in Authorization header
   - Service automatically includes JWT (via JwtInterceptor)

3. **CORS:**
   - Ensure backend allows popup redirects
   - Frontend and Backend on same origin (preferred)

## 📊 API Endpoints Summary

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/auth-url` | GET | JWT | Get Google OAuth URL |
| `/oauth/callback` | GET | None | **NEEDS UPDATE**: Should redirect to frontend |
| `/status` | GET | JWT | Check connection status |
| `/sync` | POST | JWT | Sync itinerary to calendar |
| `/disconnect` | DELETE | JWT | Remove connection |

## 📋 Checklist for Backend Team

- [ ] Update `/oauth/callback` endpoint to redirect to `http://localhost:4200/oauth/callback?code=...&state=...`
- [ ] Ensure redirect preserves query parameters (code, state)
- [ ] Test that popup callback loads OAuthCallbackComponent
- [ ] Verify response JSON is correct format
- [ ] Test with popup window (not in iframe)

## 🐛 Troubleshooting

### Popup Not Opening

**Symptom:** Error "Popup blocked"

**Fix:**
- Check browser popup blocker settings
- ensure no JS errors in console
- Verify host allows popups

### Popup Shows JSON

**Symptom:** Raw JSON displayed in popup

**Fix:**
- Backend needs to redirect to `/oauth/callback` route
- Currently returns JSON directly (see Backend Configuration section above)

### Parent Window Doesn't Update

**Symptom:** Connected but no UI update

**Check:**
- Browser console for JavaScript errors
- Verify OAuthCallbackComponent is loaded at `/oauth/callback` route
- Check `postMessage` connection (open DevTools Network tab)

### Notifications Not Showing

**Symptom:** Toast notifications don't appear

**Fix:**
- Ensure `app-notification-display` component is in `app.component.html`
- Check that NotificationService is injected
- Verify CSS is imported correctlyOAuth callback error handling in component

## 🚀 Deployment Notes

1. **Environment Variables:**
   - Ensure backend OAuth configuration matches deployment domain
   - Google OAuth redirect URI must match exactly
   - Frontend and backend must be on same domain (or CORS configured)

2. **HTTPS Requirement:**
   - Google OAuth requires HTTPS in production
   - Localhost development uses HTTP (fine for development)

3. **Service Workers:**
   - Not needed for this implementation
   - Standard window.postMessage() is sufficient

## 📞 Support

If you encounter issues:

1. Check browser console for errors
2. Verify backend is configured correctly (see Backend Configuration section)
3. Test with different browser
4. Clear browser cache and local storage
5. Check network requests in DevTools

---

**Implementation Date:** April 18, 2026
**Status:** ✅ Complete (Awaiting Backend Redirect Configuration)
**Next Step:** Coordinate with backend team to update `/oauth/callback` endpoint
