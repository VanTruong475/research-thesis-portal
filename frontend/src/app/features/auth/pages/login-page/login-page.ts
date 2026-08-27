import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-surface flex items-center justify-center p-4">
      <div class="ks-card w-full max-w-md p-8">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-display font-bold text-primary tracking-widest uppercase mb-2">Thesis Portal</h1>
          <p class="text-muted">Hệ thống Quản lý Đề tài Nghiên cứu</p>
        </div>

        <div *ngIf="errorMessage" class="bg-danger/10 border border-danger text-danger p-3 rounded-sm text-sm mb-6 text-center">
          {{ errorMessage }}
        </div>

        <form (ngSubmit)="onSubmit()" class="space-y-6">
          <div>
            <label class="ks-label">Tài khoản (Mã SV/GV hoặc Email)</label>
            <input 
              type="text" 
              name="identifier"
              [(ngModel)]="identifier"
              class="ks-input" 
              required
              placeholder="Nhập mã số hoặc email">
          </div>

          <div>
            <label class="ks-label">Mật khẩu</label>
            <input 
              type="password" 
              name="password"
              [(ngModel)]="password"
              class="ks-input" 
              required
              placeholder="••••••••">
          </div>

          <button 
            type="submit" 
            [disabled]="isLoading"
            class="ks-button ks-button-primary w-full mt-8">
            {{ isLoading ? 'Đang đăng nhập...' : 'ĐĂNG NHẬP' }}
          </button>
        </form>
        
        <div class="mt-6 text-center">
          <p class="text-sm text-muted">
            Sử dụng tài khoản do Nhà trường cấp để truy cập hệ thống.
          </p>
        </div>
      </div>
    </div>
  `
})
export class LoginPageComponent {
  authService = inject(AuthService);
  router = inject(Router);

  identifier = '';
  password = '';
  isLoading = false;
  errorMessage = '';

  onSubmit() {
    if (!this.identifier || !this.password) {
      this.errorMessage = 'Vui lòng nhập đầy đủ tài khoản và mật khẩu.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.identifier, this.password).subscribe({
      next: () => {
        this.isLoading = false;
        // Đăng nhập thành công, chuyển hướng vào app
        this.router.navigate(['/app/profile']);
      },
      error: (err) => {
        this.isLoading = false;
        if (err.status === 401 || err.status === 400) {
          this.errorMessage = 'Sai tài khoản hoặc mật khẩu.';
        } else {
          this.errorMessage = 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.';
        }
      }
    });
  }
}
