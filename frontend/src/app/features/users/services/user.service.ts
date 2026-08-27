import { Injectable, signal } from '@angular/core';
import { UserProfile } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  // Mock Data cho danh sách người dùng
  users = signal<UserProfile[]>([
    {
      id: 'U01',
      code: 'ADMIN-01',
      fullName: 'Quản trị viên Hệ thống',
      email: 'admin@portal.edu.vn',
      role: 'admin',
      status: 'active',
      createdAt: '2026-01-01T00:00:00Z'
    },
    {
      id: 'U02',
      code: 'GV-001',
      fullName: 'PGS. TS. Trần B',
      email: 'tranb@portal.edu.vn',
      role: 'lecturer',
      department: 'Khoa Công nghệ Thông tin',
      status: 'active',
      createdAt: '2026-02-15T00:00:00Z'
    },
    {
      id: 'U03',
      code: 'ST-2021001',
      fullName: 'Nguyễn Văn A',
      email: 'vana@student.edu.vn',
      role: 'student',
      major: 'Kỹ thuật Phần mềm',
      status: 'active',
      createdAt: '2026-08-01T00:00:00Z'
    },
    {
      id: 'U04',
      code: 'ST-2021002',
      fullName: 'Trần Thị B',
      email: 'thib@student.edu.vn',
      role: 'student',
      major: 'Hệ thống Thông tin',
      status: 'inactive',
      createdAt: '2026-08-05T00:00:00Z'
    }
  ]);

  constructor() {}

  // Lấy toàn bộ người dùng
  getAllUsers(): UserProfile[] {
    return this.users();
  }

  // Lọc theo Role
  getUsersByRole(role: string): UserProfile[] {
    return this.users().filter(u => u.role === role);
  }
}
