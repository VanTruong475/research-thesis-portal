import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { UserListResponse, UserProfile, CreateUserRequest } from '../models/user.model';
import { ApiResponse } from '../../../core/models/api.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private readonly API_URL = environment.apiUrl;

  // Signal để bind lên UI
  users = signal<UserProfile[]>([]);
  totalItems = signal<number>(0);

  constructor() {}

  // Hàm gọi API để tạo người dùng mới
  createUser(payload: CreateUserRequest): Observable<ApiResponse<UserProfile>> {
    return this.http.post<ApiResponse<UserProfile>>(`${this.API_URL}/users`, payload);
  }

  // Lấy danh sách users từ Backend
  fetchUsers(page: number = 1, pageSize: number = 50): Observable<ApiResponse<UserListResponse>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('page_size', pageSize.toString());

    return this.http.get<ApiResponse<UserListResponse>>(`${this.API_URL}/users`, { params }).pipe(
      tap(res => {
        if (res.data) {
          this.users.set(res.data.items);
          this.totalItems.set(res.data.pagination.total_items);
        }
      })
    );
  }

  // Khóa hoặc mở khóa tài khoản
  updateUserStatus(userId: string, status: 'active' | 'inactive'): Observable<ApiResponse<UserProfile>> {
    return this.http.patch<ApiResponse<UserProfile>>(`${this.API_URL}/users/${userId}/status`, { status });
  }
}
