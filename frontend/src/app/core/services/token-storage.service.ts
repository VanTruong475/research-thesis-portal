import { Injectable } from '@angular/core';

import { AuthUser } from '../models/auth.model';

const ACCESS_TOKEN_KEY = 'research_thesis_portal.access_token';
const REFRESH_TOKEN_KEY = 'research_thesis_portal.refresh_token';
const CURRENT_USER_KEY = 'research_thesis_portal.current_user';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  getCurrentUser(): AuthUser | null {
    const storedUser = localStorage.getItem(CURRENT_USER_KEY);
    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser) as AuthUser;
    } catch {
      this.clear();
      return null;
    }
  }

  setSession(accessToken: string, refreshToken: string, user?: AuthUser): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);

    if (user) {
      this.setCurrentUser(user);
    }
  }

  setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  setCurrentUser(user: AuthUser): void {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  }

  clear(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}
