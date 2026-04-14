export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'TOURIST' | 'HOST' | 'ADMIN' | 'ARTISAN';
  preferredLanguage: 'fr' | 'en' | 'ar' | 'FR' | 'EN' | 'AR';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  role: 'TOURIST' | 'HOST' | 'ADMIN' | 'ARTISAN' | string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface RefreshRequest {
  refreshToken: string;
}