export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;

  // ✅ roles complets
  role: 'TOURIST' | 'HOST' | 'ADMIN' | 'ARTISAN';

  // ✅ standard unique (backend friendly)
  preferredLanguage: 'FR' | 'EN' | 'AR';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;

  // ✅ garder flexible pour backend
  role: 'TOURIST' | 'HOST' | 'ADMIN' | 'ARTISAN' | string;

  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface RefreshRequest {
  refreshToken: string;
}