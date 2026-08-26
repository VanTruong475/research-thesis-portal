export type UserRole = 'student' | 'lecturer' | 'admin';

export type UserStatus = 'active' | 'inactive' | 'locked';

export interface AuthUser {
  id: string;
  institutional_code: string;
  email: string;
  full_name: string;
  role: UserRole;
  status: UserStatus;
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface LogoutRequest {
  refresh_token: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer';
  expires_in: number;
}

export interface LoginResponse extends TokenResponse {
  user: AuthUser;
}
