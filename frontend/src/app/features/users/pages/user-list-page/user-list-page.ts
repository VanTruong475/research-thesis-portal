import { Component, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UserService } from '../../services/user.service';
import { UserProfile } from '../../models/user.model';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';

@Component({
  selector: 'app-user-list-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, StatusBadge],
  template: `
    <div class="p-8 max-w-7xl mx-auto h-full flex flex-col">
      <!-- Header Trang -->
      <div class="flex justify-between items-end mb-8">
        <div>
          <h1 class="text-3xl font-display font-bold text-heading uppercase tracking-wider">
            Quản Lý Người Dùng
          </h1>
          <p class="text-muted mt-2">Xem và quản lý tài khoản trên hệ thống</p>
        </div>
        
        <div class="flex gap-4">
          <!-- Bộ lọc Role -->
          <select 
            class="ks-input w-48"
            [(ngModel)]="filterRole">
            <option value="all">Tất cả vai trò</option>
            <option value="admin">Quản trị viên</option>
            <option value="lecturer">Giảng viên</option>
            <option value="student">Sinh viên</option>
          </select>

          <!-- Bộ lọc Status -->
          <select 
            class="ks-input w-48"
            [(ngModel)]="filterStatus">
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Đã khóa</option>
          </select>
          
          <button routerLink="/app/users/new" class="ks-button ks-button-primary">
            + Thêm Mới
          </button>
        </div>
      </div>

      <!-- Bảng danh sách người dùng -->
      <div class="ks-card flex-1 overflow-hidden flex flex-col p-0 relative">
        <!-- Loading Overlay -->
        <div *ngIf="isLoading" class="absolute inset-0 bg-surface-deep/50 backdrop-blur-sm z-20 flex items-center justify-center">
          <span class="text-primary font-medium">Đang tải dữ liệu...</span>
        </div>

        <div class="overflow-y-auto custom-scrollbar">
          <table class="w-full text-left border-collapse">
            <thead class="sticky top-0 bg-surface-deep z-10 shadow-sm">
              <tr>
                <th class="p-4 font-sans font-medium text-muted text-sm border-b border-border-subtle">Mã số</th>
                <th class="p-4 font-sans font-medium text-muted text-sm border-b border-border-subtle">Họ và tên</th>
                <th class="p-4 font-sans font-medium text-muted text-sm border-b border-border-subtle">Email</th>
                <th class="p-4 font-sans font-medium text-muted text-sm border-b border-border-subtle">Vai trò</th>
                <th class="p-4 font-sans font-medium text-muted text-sm border-b border-border-subtle">Đơn vị / Lớp</th>
                <th class="p-4 font-sans font-medium text-muted text-sm border-b border-border-subtle">Trạng thái</th>
                <th class="p-4 font-sans font-medium text-muted text-sm border-b border-border-subtle text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border-subtle">
              <tr *ngFor="let user of displayedUsers()" class="hover:bg-surface-raised transition-colors group">
                <td class="p-4 font-mono text-sm">{{ user.institutional_code }}</td>
                <td class="p-4 font-sans font-medium text-body">{{ user.full_name }}</td>
                <td class="p-4 text-sm text-muted">{{ user.email }}</td>
                <td class="p-4 text-sm uppercase tracking-wider text-primary">
                  {{ user.role === 'lecturer' ? 'Giảng Viên' : (user.role === 'student' ? 'Sinh Viên' : 'Admin') }}
                </td>
                <td class="p-4 text-sm text-muted">
                  {{ user.department || user.class_name || '--' }}
                </td>
                <td class="p-4">
                  <app-status-badge [type]="user.status === 'active' ? 'success' : 'danger'">
                    {{ user.status === 'active' ? 'Hoạt động' : 'Đã khóa' }}
                  </app-status-badge>
                </td>
                <td class="p-4 text-right">
                  <button 
                    class="text-sm transition-colors underline"
                    [ngClass]="user.status === 'active' ? 'text-danger hover:text-danger/80' : 'text-success hover:text-success/80'"
                    (click)="toggleUserStatus(user.id, user.status)">
                    {{ user.status === 'active' ? 'Khóa' : 'Mở khóa' }}
                  </button>
                </td>
              </tr>
              
              <tr *ngIf="displayedUsers().length === 0 && !isLoading">
                <td colspan="7" class="p-8 text-center text-muted italic">
                  Không tìm thấy người dùng nào.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class UserListPageComponent implements OnInit {
  userService = inject(UserService);
  
  filterRole = 'all';
  filterStatus = 'all';
  isLoading = false;

  // Signal phụ thuộc vào danh sách gốc và bộ lọc
  displayedUsers = computed(() => {
    let all = this.userService.users();
    
    if (this.filterRole !== 'all') {
      all = all.filter(u => u.role === this.filterRole);
    }
    
    if (this.filterStatus !== 'all') {
      all = all.filter(u => u.status === this.filterStatus);
    }
    
    return all;
  });

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.isLoading = true;
    this.userService.fetchUsers(1, 50).subscribe({
      next: () => this.isLoading = false,
      error: () => this.isLoading = false
    });
  }

  toggleUserStatus(userId: string, currentStatus: string) {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const actionText = currentStatus === 'active' ? 'Khóa' : 'Mở khóa';
    
    if (confirm(`Bạn có chắc chắn muốn ${actionText} tài khoản này không?`)) {
      this.userService.updateUserStatus(userId, newStatus).subscribe({
        next: () => this.loadUsers() // Load lại danh sách sau khi đổi trạng thái thành công
      });
    }
  }
}
