import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, User } from '../../../../core/services/auth';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, StatusBadge],
  template: `
    <div class="p-8 max-w-4xl mx-auto h-full flex flex-col">
      <div class="mb-8">
        <h1 class="text-3xl font-display font-bold text-heading uppercase tracking-wider">
          Hồ Sơ Cá Nhân
        </h1>
        <p class="text-muted mt-2">Quản lý thông tin tài khoản của bạn</p>
      </div>

      <div *ngIf="user" class="ks-card mt-4">
        <div class="flex items-center gap-6 border-b border-border-subtle pb-8 mb-8">
          <!-- Avatar giả lập -->
          <div class="w-24 h-24 rounded-full bg-surface-raised border-2 border-primary flex items-center justify-center text-4xl font-display font-bold text-primary shadow-[0_0_15px_rgba(212,175,55,0.15)]">
            {{ user.name.charAt(0) }}
          </div>
          
          <div>
            <h2 class="text-2xl font-display font-medium text-heading mb-1">{{ user.name }}</h2>
            <div class="flex items-center gap-3 mt-2">
              <span class="text-sm font-mono text-muted">{{ user.email }}</span>
              <span class="text-border-subtle">|</span>
              <app-status-badge type="success">Đang hoạt động</app-status-badge>
            </div>
          </div>
        </div>

        <!-- Thông tin chi tiết -->
        <div class="grid grid-cols-2 gap-8">
          <div class="flex flex-col gap-2">
            <span class="text-sm text-muted">ID Tài khoản</span>
            <span class="font-mono text-body">{{ user.id }}</span>
          </div>
          
          <div class="flex flex-col gap-2">
            <span class="text-sm text-muted">Vai trò hệ thống</span>
            <span class="text-body capitalize font-medium text-primary">{{ user.role }}</span>
          </div>

          <div class="flex flex-col gap-2">
            <span class="text-sm text-muted">Mật khẩu</span>
            <button class="ks-button ks-button-secondary w-fit mt-1 !min-h-[40px] text-sm">
              Đổi mật khẩu
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ProfilePageComponent implements OnInit {
  authService = inject(AuthService);
  user: User | null = null;

  ngOnInit() {
    // Lấy thông tin user đang đăng nhập từ MockAuthService
    this.user = this.authService.currentUser();
  }
}
