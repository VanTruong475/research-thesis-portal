import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService, User } from '../../../../core/services/auth';
import { UserService } from '../../services/user.service';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, StatusBadge, ReactiveFormsModule],
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
            <button class="ks-button ks-button-secondary w-fit mt-1 !min-h-[40px] text-sm" (click)="openPasswordDialog()">
              Đổi mật khẩu
            </button>
          </div>
        </div>
      </div>

      <!-- Modal Đổi mật khẩu -->
      <div *ngIf="isPasswordDialogOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-surface-deep/80 backdrop-blur-sm">
        <div class="ks-card w-full max-w-md p-6 relative">
          <h2 class="text-2xl font-display font-bold text-heading mb-6">Đổi Mật Khẩu</h2>
          
          <form [formGroup]="passwordForm" (ngSubmit)="onChangePassword()" class="space-y-4">
            <div>
              <label class="ks-label">Mật khẩu hiện tại *</label>
              <input type="password" formControlName="current_password" class="ks-input" placeholder="Nhập mật khẩu hiện tại">
            </div>
            
            <div>
              <label class="ks-label">Mật khẩu mới *</label>
              <input type="password" formControlName="new_password" class="ks-input" placeholder="Tối thiểu 6 ký tự">
            </div>
            
            <div>
              <label class="ks-label">Xác nhận mật khẩu mới *</label>
              <input type="password" formControlName="confirm_password" class="ks-input" placeholder="Nhập lại mật khẩu mới">
              <div *ngIf="passwordForm.errors?.['mismatch'] && passwordForm.get('confirm_password')?.touched" class="text-danger text-sm mt-1">
                Mật khẩu xác nhận không khớp!
              </div>
            </div>

            <div class="pt-6 mt-6 border-t border-border-subtle flex justify-end gap-3">
              <button type="button" class="ks-button ks-button-secondary" (click)="closePasswordDialog()">Hủy</button>
              <button type="submit" class="ks-button ks-button-primary" [disabled]="passwordForm.invalid || isSubmitting">
                {{ isSubmitting ? 'Đang lưu...' : 'Lưu Thay Đổi' }}
              </button>
            </div>
          </form>
        </div>
      </div>

    </div>
  `
})
export class ProfilePageComponent implements OnInit {
  authService = inject(AuthService);
  userService = inject(UserService);
  private fb = inject(FormBuilder);

  user: User | null = null;
  
  isPasswordDialogOpen = false;
  isSubmitting = false;
  passwordForm!: FormGroup;

  ngOnInit() {
    this.user = this.authService.currentUser();
    this.initForm();
  }

  initForm() {
    this.passwordForm = this.fb.group({
      current_password: ['', [Validators.required, Validators.minLength(6)]],
      new_password: ['', [Validators.required, Validators.minLength(6)]],
      confirm_password: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('new_password')?.value === g.get('confirm_password')?.value
      ? null : { mismatch: true };
  }

  openPasswordDialog() {
    this.passwordForm.reset();
    this.isPasswordDialogOpen = true;
  }

  closePasswordDialog() {
    this.isPasswordDialogOpen = false;
  }

  onChangePassword() {
    if (this.passwordForm.invalid) return;
    this.isSubmitting = true;
    
    const payload = {
      current_password: this.passwordForm.value.current_password,
      new_password: this.passwordForm.value.new_password
    };

    this.userService.changePassword(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        alert('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.');
        this.closePasswordDialog();
        // Có thể gọi hàm logout ở đây
      },
      error: (err) => {
        this.isSubmitting = false;
        alert(err.error?.message || 'Có lỗi xảy ra khi đổi mật khẩu.');
      }
    });
  }
}
