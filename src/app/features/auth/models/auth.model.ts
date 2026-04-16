export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: 'TOURIST' | 'HOST' | 'ADMIN';
  preferredLanguage?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  role: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  userId?: number;
}

export interface RefreshRequest {
  refreshToken: string;
}