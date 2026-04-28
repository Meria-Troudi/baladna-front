export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: 'TOURIST' | 'HOST' | 'ADMIN' | 'ARTISAN';
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  preferredLanguage: string;
  profilePhoto?: string | null;
  lastLogin?: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  preferredLanguage?: string;
  profilePhoto?: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface UpdateStatusRequest {
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
}

export interface UpdateRoleRequest {
  role: 'TOURIST' | 'HOST' | 'ADMIN' | 'ARTISAN';
}

export interface ActivityLog {
  id: number;
  action: string;
  timestamp: string;
}

export interface Session {
  id: string;
  token: string;
  expiresAt: string;
}