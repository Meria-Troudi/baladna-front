# Quick Start - Frontend Google Calendar Sync

## Prerequisites
✅ Backend running on `http://localhost:8081`
✅ Backend endpoints verified working

## Quick Start (3 Steps)

### 1. Install & Run
```bash
# From: c:\Users\amine gh\Desktop\baladna-main\baladna-eventMG\baladna-frontend-develop\baladna-frontend-develop

npm install
npm start
```

### 2. Access Application
```
Frontend: http://localhost:4200
Dashboard: http://localhost:4200/tourist/dashboard
API Proxy: /api → http://localhost:8081/api
```

### 3. Test Google Calendar Sync
1. Log in as a tourist user
2. Go to Tourist Dashboard
3. Click "Planning Calendar" card
4. Click "Connect to Google Calendar"
5. Authorize with your Google account
6. Select an itinerary and click "Sync"
7. Check your Google Calendar! 🎉

## What Was Implemented

### New Components
- **GoogleCalendarOAuthCallbackComponent** - Handles OAuth redirect
  ```
  Route: /tourist/itineraries/calendar-oauth-callback
  Location: src/app/features/itinerary/pages/itinerary-calendar/
  ```

### Configuration Changes
- **proxy.conf.json** - Routes API calls to backend
- **angular.json** - Configured dev server proxy
- **src/index.html** - Added Bootstrap Icons CDN

### Existing Components (Updated)
- **ItineraryComponent** (module) - Added new route
- **PlanningCalendarModalComponent** - Already integrated in dashboard
- **GoogleCalendarService** - Already fully implemented

## How It Works

```
User Flow:
┌─────────────────┐
│ Tourist User    │
└────────┬────────┘
         │ 1. Logs in
         ↓
┌─────────────────────────┐
│ Tourist Dashboard       │
│ "Planning Calendar" →   │
└────────┬────────────────┘
         │ 2. Clicks card (opens modal)
         ↓
┌──────────────────────────────────────┐
│ PlanningCalendarModalComponent       │
│ "Connect Google Calendar" button     │
└────────┬─────────────────────────────┘
         │ 3. Click to connect
         ↓
┌──────────────────────────────────────┐
│ GoogleCalendarService                │
│ Calls: GET /api/itineraries/calendar/│
│        calendar/auth-url             │
└────────┬─────────────────────────────┘
         │ 4. Gets Google OAuth URL
         ↓
┌──────────────────────────────────────┐
│ Redirects to Google OAuth            │
│ User authorizes app                  │
│ Google redirects back with code      │
└────────┬─────────────────────────────┘
         │ 5. Redirected to callback URL
         ↓
┌──────────────────────────────────────────────────┐
│ GoogleCalendarOAuthCallbackComponent            │
│ /tourist/itineraries/calendar-oauth-callback    │
│ Extracts authorization code from URL            │
└────────┬─────────────────────────────────────────┘
         │ 6. Sends code to backend
         ↓
┌──────────────────────────────────────┐
│ GoogleCalendarService                │
│ POST /api/itineraries/calendar/      │
│ oauth/callback {authorizationCode}   │
└────────┬─────────────────────────────┘
         │ 7. Connection successful
         ↓
┌──────────────────────────────────────┐
│ Modal shows connected status         │
│ Lists user's itineraries             │
│ User selects itinerary & clicks Sync │
└────────┬─────────────────────────────┘
         │ 8. Syncs to Google Calendar
         ↓
┌──────────────────────────────────────┐
│ GoogleCalendarService                │
│ POST /api/itineraries/calendar/sync  │
│ {itineraryId}                        │
└────────┬─────────────────────────────┘
         │ 9. Sync complete
         ↓
┌──────────────────────────────────────┐
│ Success! Events now in Google        │
│ Calendar with all itinerary steps    │
└──────────────────────────────────────┘
```

## Network Configuration

### Proxy Setup
The frontend uses a proxy to communicate with the backend:

`proxy.conf.json`:
```json
{
  "/api": {
    "target": "http://localhost:8081",
    "secure": false,
    "pathRewrite": { "^/api": "/api" },
    "changeOrigin": true
  }
}
```

### How Requests Work
```
Frontend Request:
GET /api/itineraries/calendar/auth-url

Proxy Routes To:
http://localhost:8081/api/itineraries/calendar/auth-url

Response Returns To:
Frontend Component
```

## Files at a Glance

### Created Files
```
proxy.conf.json
├─ Proxy configuration for API routes
├─ Routes /api/* to http://localhost:8081

src/app/features/itinerary/pages/itinerary-calendar/
├─ google-calendar-oauth-callback.component.ts (78 lines)
├─ google-calendar-oauth-callback.component.html (33 lines)
└─ google-calendar-oauth-callback.component.css (220 lines)
├─ Handles OAuth redirect and callback

Total New Code: ~331 lines
```

### Modified Files
```
angular.json
├─ Added proxyConfig: "proxy.conf.json" to dev server

src/index.html
├─ Added Bootstrap Icons CDN link

src/app/features/itinerary/itinerary.component.ts
├─ Imported GoogleCalendarOAuthCallbackComponent
├─ Declared component in module
├─ Added route for calendar-oauth-callback
├─ Added HttpClientModule import
```

### Existing (No Changes Needed)
```
src/app/features/itinerary/services/google-calendar.service.ts
└─ Already fully implemented ✓

src/app/features/itinerary/pages/planning-calendar-modal/
├─ Already fully implemented
└─ Already integrated in dashboard ✓

src/app/features/tourist/dashboard/
└─ Already has modal integration ✓

src/app/app.module.ts
└─ PlanningCalendarModalComponent already declared ✓
```

## Testing Commands

### Check Backend is Running
```bash
curl http://localhost:8081/api/itineraries/calendar/auth-url
# Should return Google OAuth URL string
```

### Check Frontend Proxy
```bash
# Open browser console at http://localhost:4200
# Any request to /api will be logged
# Check Network tab for requests to /api/...

# Or test:
fetch('/api/itineraries/calendar/status')
  .then(r => r.json())
  .then(d => console.log('Connected:', d))
```

### Check Proxy Configuration
```bash
# Verify proxy.conf.json exists
ls proxy.conf.json

# Verify angular.json has proxy setting
grep -A2 "proxyConfig" angular.json
```

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| 404 errors on /api requests | Verify proxy.conf.json exists and ng serve was restarted |
| Bootstrap icons not showing | Clear browser cache (Ctrl+Shift+Delete) + hard refresh |
| "Cannot find module" errors | Run `npm install` again |
| Backend connection refused | Check backend is running on port 8081 |
| OAuth redirect fails | Verify Google Cloud Console redirect URL settings |
| Cannot connect to Google | Check JWT token is valid (still logged in) |

## Environment Info
- **Frontend**: Angular 18.2.0
- **Package Manager**: npm
- **Backend**: Node.js (port 8081)
- **Development Server**: ng serve (port 4200)
- **Proxy**: Built-in Angular dev server proxy

## Next Steps

1. ✅ Frontend implementation complete
2. ✅ Backend integration ready
3. 👉 **Test the feature** (start with Quick Start steps above)
4. 👉 **Configure Google Cloud Console** if not done
5. 👉 **Monitor logs** for any issues

## Support

If you encounter issues:
1. Check browser console (F12)
2. Check Network tab for failed requests
3. Check server logs on backend
4. Review error messages in modal
5. Verify proxy is configured correctly

---

**Implementation Date**: April 17, 2026
**Status**: ✅ READY FOR TESTING
**Total Implementation**: ~331 lines of new code + configuration
