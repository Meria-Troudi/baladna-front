# 🏛️ BALADNA Frontend

A modern Angular application for the BALADNA platform with role-based layouts and user management system.

## 📋 Table of Contents

- [🏗️ Architecture Overview](#-architecture-overview)
- [🚀 Getting Started](#-getting-started)
- [👥 User Roles & Access](#-user-roles--access)
- [🎯 Project Structure](#-project-structure)
- [🔧 How to Add New Management Pages](#-how-to-add-new-management-pages)
- [🛣️ Routing Configuration](#️-routing-configuration)
- [🎨 Components & Styling](#-components--styling)
- [🔐 Authentication Flow](#-authentication-flow)
- [📚 Development Guidelines](#-development-guidelines)

---

## 🏗️ Architecture Overview

BALADNA uses a **clean, scalable architecture** with separation of concerns:

```
📁 src/app/
├── 🔧 core/           → Global logic (auth, interceptors, models)
├── 🎨 shared/         → Reusable UI components (header, sidebar, footer)
├── 🏗️ layout/         → Role-based layout shells (admin/host/tourist)
├── 🎯 features/       → Business logic (user, auth, future modules)
└── 📦 app.module.ts   → Main application configuration
```

### **Key Architectural Concepts:**

- **Role-Based Layouts**: Each user role (Admin/Host/Tourist) has its own layout
- **Shared Components**: Header, Sidebar, Footer are reused across all layouts
- **Feature Modules**: Business logic organized by domain
- **Dynamic Navigation**: Sidebar adapts based on user role
- **Clean Separation**: Layout vs Features vs Core logic

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Angular CLI
- Backend API running on `http://localhost:8081`

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

### Access Points
- **Development**: `http://localhost:4200`
- **Login**: `http://localhost:4200/login`
- **Register**: `http://localhost:4200/register`

---

## 👥 User Roles & Access

### 🎯 Role-Based Navigation

| Role | Layout | Sidebar Menu | Profile Route | Default Redirect |
|------|--------|--------------|--------------|-----------------|
| **Admin** | AdminLayout | Users, Overview, Role Requests, Moderation | `/admin/profile` | `/admin/profile` |
| **Host** | HostLayout | Dashboard, My Events, Accommodations, Bookings | `/host/profile` | `/host/profile` |
| **Tourist** | TouristLayout | Discover, Events, Stays, Transport, Marketplace | `/tourist/profile` | `/tourist/profile` |

### 🔐 Authentication Flow
1. User logs in via `/login` or registers via `/register`
2. Backend returns user role and tokens
3. Frontend redirects to role-specific profile page
4. Layout and sidebar adapt to user role
5. User can access profile features based on their role

---

## 🎯 Project Structure

### 📁 Detailed Directory Structure

```
src/app/
├── 📁 core/                          # Core application logic
│   ├── 📁 guards/                    # Route protection
│   │   ├── auth.guard.ts             # Protect authenticated routes
│   │   └── admin.guard.ts            # Admin-only routes
│   ├── 📁 interceptors/               # HTTP interceptors
│   │   └── jwt.interceptor.ts        # JWT token injection
│   ├── 📁 models/                    # Data models and interfaces
│   │   └── auth.model.ts              # Authentication models
│   └── 📁 services/                  # Core services
│       └── auth.service.ts            # Authentication service
│
├── 📁 shared/                        # Reusable UI components
│   ├── 📁 components/                # Shared UI components
│   │   ├── 📁 header/                # Application header
│   │   ├── 📁 sidebar/               # Dynamic navigation sidebar
│   │   ├── 📁 footer/                # Application footer
│   │   └── 📁 profile-layout/        # Legacy profile layout
│   └── 📄 shared.module.ts            # Shared module exports
│
├── 📁 layout/                        # 🔥 Role-based layout shells
│   ├── 📁 admin-layout/              # Admin layout wrapper
│   ├── 📁 host-layout/               # Host layout wrapper
│   └── 📁 tourist-layout/            # Tourist layout wrapper
│
├── 📁 features/                      # Business logic modules
│   ├── 📁 auth/                      # Authentication features
│   │   ├── 📁 login/                 # Login component
│   │   └── 📁 register/              # Registration component
│   └── 📁 user/                      # User management
│       ├── 📁 admin/                  # Admin user management
│       ├── 📁 pages/profile/          # Profile functionality
│       ├── 📄 user.service.ts         # User API service
│       └── 📄 user.model.ts           # User data models
│
├── 📄 app-routing.module.ts           # 🛣️ Route configuration
├── 📄 app.module.ts                   # Main Angular module
└── 📄 app.component.ts                # Root component
```

---

## 🔧 How to Add New Management Pages

### 📝 Step-by-Step Guide

#### 1. **Create Your Component**
```bash
# Example: Create Events management page
ng generate component features/events/pages/events-management
```

#### 2. **Add Your Route**
Open `src/app/app-routing.module.ts` and uncomment/add your route:

```typescript
// TOURIST ROUTES - Add your new route
{
  path: 'tourist',
  component: TouristLayoutComponent,
  canActivate: [AuthGuard],
  children: [
    { path: '', redirectTo: 'profile', pathMatch: 'full' },
    { path: 'profile', component: ProfileComponent },
    // 🆕 ADD YOUR NEW ROUTE HERE:
    { path: 'events', component: EventsManagementComponent },
    // Other routes commented out for now...
  ]
},
```

#### 3. **Update Sidebar Menu**
Open `src/app/shared/components/sidebar/sidebar.component.ts` and add your menu item:

```typescript
private menus: Record<string, MenuItem[]> = {
  TOURIST: [
    { label: 'Discover', icon: '🗺️', route: '/tourist/discover' },
    // 🆕 ADD YOUR MENU ITEM:
    { label: 'Events', icon: '🎪', badge: '3', route: '/tourist/events' },
    // ... other items
  ]
};
```

#### 4. **Create Your Service (Optional)**
```bash
# Create service for your feature
ng generate service features/events/events
```

#### 5. **Add Models (Optional)**
Create your data models in `src/app/features/events/events.model.ts`

### 🎯 Role-Specific Pages

#### **For Admin Pages:**
```typescript
// In app-routing.module.ts - ADMIN ROUTES section
{
  path: 'admin',
  component: AdminLayoutComponent,
  canActivate: [AuthGuard],
  children: [
    { path: 'users', component: UsersManagementComponent, canActivate: [AdminGuard] },
    { path: 'statistics', component: StatisticsComponent },
    // Add more admin routes...
  ]
}
```

#### **For Host Pages:**
```typescript
// In app-routing.module.ts - HOST ROUTES section
{
  path: 'host',
  component: HostLayoutComponent,
  canActivate: [AuthGuard],
  children: [
    { path: 'my-events', component: HostEventsComponent },
    { path: 'accommodations', component: AccommodationsComponent },
    // Add more host routes...
  ]
}
```

#### **For Tourist Pages:**
```typescript
// In app-routing.module.ts - TOURIST ROUTES section
{
  path: 'tourist',
  component: TouristLayoutComponent,
  canActivate: [AuthGuard],
  children: [
    { path: 'discover', component: DiscoverComponent },
    { path: 'events', component: EventsComponent },
    // Add more tourist routes...
  ]
}
```

---

## 🛣️ Routing Configuration

### 📋 Current Active Routes

```typescript
const routes: Routes = [
  // Auth routes
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  
  // Admin routes (only profile active)
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'profile', component: ProfileComponent }
      // Uncomment when ready:
      // { path: 'users', component: UsersComponent, canActivate: [AdminGuard] },
    ]
  },
  
  // Host routes (only profile active)
  {
    path: 'host',
    component: HostLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'profile', component: ProfileComponent }
      // Uncomment when ready:
      // { path: 'dashboard', component: DashboardComponent },
    ]
  },
  
  // Tourist routes (only profile active)
  {
    path: 'tourist',
    component: TouristLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'profile', component: ProfileComponent }
      // Uncomment when ready:
      // { path: 'discover', component: DiscoverComponent },
    ]
  }
];
```

### 🔄 Route Guards

- **AuthGuard**: Protects routes from unauthenticated access
- **AdminGuard**: Restricts routes to admin users only

---

## 🎨 Components & Styling

### 📱 Layout Components

#### **Header Component** (`shared/components/header/`)
- Dynamic user information display
- Role badge showing current user role
- Sidebar toggle functionality
- Logout functionality

#### **Sidebar Component** (`shared/components/sidebar/`)
- **Dynamic menu based on user role**
- Collapsible functionality
- Active route highlighting
- Badge notifications support

#### **Footer Component** (`shared/components/footer/`)
- Application links and social media
- Copyright information

### 🎯 Role-Based Layouts

#### **Admin Layout** (`layout/admin-layout/`)
```
┌─────────────────────────────────────────┐
│              Admin Header               │
├──────────┬─────────────────────────────┤
│          │                             │
│ Admin    │      Main Content           │
│ Sidebar  │   ← Your Pages Here →      │
│          │                             │
└──────────┴─────────────────────────────┘
│              Admin Footer               │
└─────────────────────────────────────────┘
```

#### **Host Layout** (`layout/host-layout/`)
- Same structure as admin but with host-specific sidebar

#### **Tourist Layout** (`layout/tourist-layout/`)
- Same structure as admin but with tourist-specific sidebar

### 🎨 Styling Architecture

- **SCSS**: Used for component-specific styling
- **Bootstrap**: For responsive grid and components
- **Custom CSS**: For layout and component styling
- **Responsive Design**: Mobile-friendly layouts

---

## 🔐 Authentication Flow

### 📋 Login Process

1. **User submits credentials** → `LoginComponent`
2. **AuthService.login()** → Backend API
3. **Backend response** → JWT tokens + user role
4. **Token storage** → localStorage
5. **Role-based redirect** → `/admin/profile` | `/host/profile` | `/tourist/profile`
6. **Layout activation** → Role-specific layout + sidebar

### 🔄 Token Management

- **Access Token**: Stored in localStorage
- **Refresh Token**: Stored in localStorage
- **JWT Interceptor**: Automatically adds token to API requests
- **Auto-logout**: When token expires

### 🛡️ Route Protection

```typescript
// Example: Protected route
{
  path: 'admin',
  component: AdminLayoutComponent,
  canActivate: [AuthGuard], // Must be logged in
  children: [
    { 
      path: 'users', 
      component: UsersComponent, 
      canActivate: [AdminGuard] // Must be admin
    }
  ]
}
```

---

## 📚 Development Guidelines

### 🎯 Best Practices

#### **Component Development**
```typescript
// ✅ Good: Use proper TypeScript typing
export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: 'TOURIST' | 'HOST' | 'ADMIN';
}

// ✅ Good: Use services for API calls
@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private http: HttpClient) {}
  
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>('/api/users');
  }
}
```

#### **Routing Best Practices**
```typescript
// ✅ Good: Group routes by role
{
  path: 'admin',
  component: AdminLayoutComponent,
  canActivate: [AuthGuard],
  children: [
    { path: 'users', component: UsersComponent },
    { path: 'settings', component: SettingsComponent }
  ]
}
```

#### **Styling Best Practices**
```scss
// ✅ Good: Use SCSS variables and nesting
.component {
  background: $primary-color;
  
  &__header {
    padding: 1rem;
    
    &__title {
      font-size: 1.5rem;
    }
  }
}
```

### 🚀 Quick Start for New Developers

#### **1. Setup Your Environment**
```bash
# Clone and install
git clone <repository-url>
cd baladna-frontend
npm install
```

#### **2. Start Development**
```bash
# Start the server
npm start

# Navigate to http://localhost:4200
```

#### **3. Create Your First Page**
```bash
# Generate a component
ng generate component features/my-feature/my-page

# Add route to app-routing.module.ts
# Add menu item to sidebar.component.ts
```

#### **4. Test Your Changes**
- Login with different roles to see layout changes
- Test responsive design on different screen sizes
- Verify route protection works correctly

### 🐛 Common Issues & Solutions

#### **Issue: Route not found**
```typescript
// ✅ Check: Route is properly defined
// ✅ Check: Component is imported correctly
// ✅ Check: Route path matches sidebar menu
```

#### **Issue: Sidebar not showing**
```typescript
// ✅ Check: AuthService.getRole() returns correct value
// ✅ Check: Menu items are defined for the role
// ✅ Check: Component is exported from SharedModule
```

#### **Issue: Layout not centered**
```scss
// ✅ Check: main-content has proper margin-left
// ✅ Check: sidebar has correct position: fixed
// ✅ Check: Layout styles are not conflicting
```

---

## 🤝 Contributing Guidelines

### 📝 Adding New Features

1. **Create a feature branch**: `git checkout -b feature/your-feature`
2. **Follow the architecture**: Use the established folder structure
3. **Add proper routing**: Include role-based routes
4. **Update documentation**: Add your feature to this README
5. **Test thoroughly**: Test with all user roles
6. **Submit pull request**: With clear description of changes

### 🎯 Code Quality Standards

- **TypeScript**: Use strict typing for all variables and functions
- **Components**: Keep components focused and reusable
- **Services**: Use services for API calls and business logic
- **Styling**: Use SCSS with proper nesting and variables
- **Testing**: Add unit tests for new components and services

---

## 📞 Support & Contact

For questions about the architecture or development process:

1. **Check this README** first for common solutions
2. **Review existing components** for patterns to follow
3. **Ask the team** for clarification on architecture decisions
4. **Document your changes** for future developers

---

## 🚀 Deployment

### 📦 Build Process
```bash
# Build for production
npm run build

# Output: dist/baladna-frontend/
```

### 🔧 Environment Configuration
- **Development**: `http://localhost:4200`
- **API Backend**: `http://localhost:8081`
- **Production**: Configure environment variables as needed

---

**Happy Coding! 🎉**

*Built with Angular 18, TypeScript, SCSS, and Bootstrap*
