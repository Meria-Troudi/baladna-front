export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
<<<<<<< HEAD

  // ✅ roles complets
  role: 'TOURIST' | 'HOST' | 'ADMIN' | 'ARTISAN';

  // ✅ standard unique (backend friendly)
  preferredLanguage: 'FR' | 'EN' | 'AR';
=======
  role?: 'TOURIST' | 'HOST' | 'ADMIN';
  preferredLanguage?: string;
>>>>>>> origin/marketplace-frontend
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
<<<<<<< HEAD

  // ✅ garder flexible pour backend
  role: 'TOURIST' | 'HOST' | 'ADMIN' | 'ARTISAN' | string;

  firstName?: string;
  lastName?: string;
  email?: string;
  userId?: number;
=======
  role: string;
  firstName?: string;
  lastName?: string;
  email?: string;
>>>>>>> origin/marketplace-frontend
}

export interface RefreshRequest {
  refreshToken: string;
}