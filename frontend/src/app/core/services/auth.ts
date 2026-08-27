import { Injectable, signal } from '@angular/core';

export type UserRole = 'student' | 'lecturer' | 'admin';

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
  // Mock current user - Dùng signal để dễ dàng binding trên UI (Angular 16+)
  // Thay đổi role ở đây để test các UI khác nhau
  currentUser = signal<User | null>({
    id: 'mock-user-1',
    name: 'Nguyễn Quốc Vũ (Mock)',
    role: 'lecturer', // Đổi thành 'student' hoặc 'admin' để test
    email: 'vu.nq@example.com'
  });

  constructor() { }

  // Các hàm này hiện tại chỉ giả lập
  login(role: UserRole) {
    this.currentUser.set({
      id: `mock-${role}-1`,
      name: `User ${role}`,
      role: role,
      email: `${role}@example.com`
    });
  }

  logout() {
    this.currentUser.set(null);
  }
}
