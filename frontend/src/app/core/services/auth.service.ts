import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, catchError, finalize, map, of, shareReplay, tap, throwError } from 'rxjs';

import { API_BASE_URL } from '../constants/api.constants';
import { ApiResponse } from '../models/api-response.model';
import { AuthUser, LoginRequest, LoginResponse, TokenResponse, UserRole } from '../models/auth.model';
import { TokenStorageService } from './token-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly currentUserSubject = new BehaviorSubject<AuthUser | null>(this.tokenStorage.getCurrentUser());
  private refreshRequest$: Observable<TokenResponse> | null = null;

  readonly currentUser$ = this.currentUserSubject.asObservable();

  get currentUser(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  get accessToken(): string | null {
    return this.tokenStorage.getAccessToken();
  }

  get refreshToken(): string | null {
    return this.tokenStorage.getRefreshToken();
  }

  isAuthenticated(): boolean {
    return Boolean(this.accessToken && this.refreshToken);
  }

  hasRole(roles: readonly UserRole[]): boolean {
    const role = this.currentUser?.role;
    return Boolean(role && roles.includes(role));
  }

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.http.post<ApiResponse<LoginResponse>>(`${API_BASE_URL}/auth/login`, payload).pipe(
      map((response) => response.data),
      tap((data) => {
        this.tokenStorage.setSession(data.access_token, data.refresh_token, data.user);
        this.currentUserSubject.next(data.user);
      }),
    );
  }

  refreshSession(): Observable<TokenResponse> {
    const refreshToken = this.refreshToken;
    if (!refreshToken) {
      this.clearSession();
      return throwError(() => new Error('Refresh token is not available.'));
    }

    if (!this.refreshRequest$) {
      this.refreshRequest$ = this.http
        .post<ApiResponse<TokenResponse>>(`${API_BASE_URL}/auth/refresh`, { refresh_token: refreshToken })
        .pipe(
          map((response) => response.data),
          tap((data) => this.tokenStorage.setTokens(data.access_token, data.refresh_token)),
          shareReplay(1),
          finalize(() => {
            this.refreshRequest$ = null;
          }),
        );
    }

    return this.refreshRequest$;
  }

  logout(): Observable<void> {
    const refreshToken = this.refreshToken;
    if (!refreshToken) {
      this.clearSession();
      return of(void 0);
    }

    return this.http
      .post<ApiResponse<null>>(`${API_BASE_URL}/auth/logout`, { refresh_token: refreshToken })
      .pipe(
        map(() => void 0),
        catchError(() => of(void 0)),
        finalize(() => this.clearSession()),
      );
  }

  loadCurrentUser(): Observable<AuthUser> {
    return this.http.get<ApiResponse<AuthUser>>(`${API_BASE_URL}/auth/me`).pipe(
      map((response) => response.data),
      tap((user) => {
        this.tokenStorage.setCurrentUser(user);
        this.currentUserSubject.next(user);
      }),
    );
  }

  clearSession(): void {
    this.tokenStorage.clear();
    this.currentUserSubject.next(null);
  }
}
