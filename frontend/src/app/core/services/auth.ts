import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError, map } from 'rxjs/operators';
import { of, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.model';

export type UserRole = 'student' | 'lecturer' | 'admin';
export type UserStatus = 'active' | 'inactive' | 'locked';

export interface UserResponse {
  id: string;
  institutional_code: string;
  email: string;
  full_name: string;
  role: UserRole;
  status: UserStatus;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface LoginResponse extends TokenResponse {
  user: UserResponse;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private readonly API_URL = environment.apiUrl;

  // Trạng thái user hiện tại
  currentUser = signal<User | null>(null);

  constructor() {
    this.loadUserFromStorage();
  }

  // Khôi phục user từ LocalStorage nếu có
  private loadUserFromStorage() {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      try {
        this.currentUser.set(JSON.parse(userData));
      } catch (e) {
        this.logout();
      }
    }
  }

  login(identifier: string, password: string): Observable<ApiResponse<LoginResponse>> {
    return this.http.post<ApiResponse<LoginResponse>>(`${this.API_URL}/auth/login`, { identifier, password })
      .pipe(
        tap(res => {
          if (res.data) {
            this.handleAuthentication(res.data);
          }
        })
      );
  }

  private handleAuthentication(data: LoginResponse) {
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    
    // Map UserResponse sang Frontend User interface
    const user: User = {
      id: data.user.id,
      name: data.user.full_name,
      role: data.user.role,
      email: data.user.email
    };
    
    localStorage.setItem('user_data', JSON.stringify(user));
    this.currentUser.set(user);
  }

  logout(): Observable<any> {
    const refreshToken = localStorage.getItem('refresh_token');
    
    // Xóa LocalStorage và reset state ngay lập tức để UI cập nhật
    this.clearAuthData();
    this.router.navigate(['/auth/login']);
    
    if (refreshToken) {
      return this.http.post(`${this.API_URL}/auth/logout`, { refresh_token: refreshToken }).pipe(
        catchError(() => of(null)) // Ignored errors on logout
      );
    }
    return of(null);
  }

  private clearAuthData() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    this.currentUser.set(null);
  }

  // Lấy thông tin user mới nhất từ server
  fetchCurrentUser(): Observable<ApiResponse<UserResponse>> {
    return this.http.get<ApiResponse<UserResponse>>(`${this.API_URL}/auth/me`).pipe(
      tap(res => {
        if (res.data) {
          const user: User = {
            id: res.data.id,
            name: res.data.full_name,
            role: res.data.role,
            email: res.data.email
          };
          localStorage.setItem('user_data', JSON.stringify(user));
          this.currentUser.set(user);
        }
      })
    );
  }
}
