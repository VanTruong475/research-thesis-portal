import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth';
import { UserService } from '../../services/user.service';
import { UserProfile, UpdateUserProfileRequest, UserRole, UserStatus } from '../../models/user.model';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, StatusBadge, ReactiveFormsModule],
  template: `
    <div class="p-8 max-w-5xl mx-auto h-full flex flex-col">
      <div class="mb-8">
        <h1 class="text-3xl font-display font-bold text-heading uppercase tracking-wider">
          Hồ Sơ Cá Nhân
        </h1>
        <p class="text-muted mt-2">Quản lý thông tin tài khoản của bạn</p>
      </div>

      <div *ngIf="successMessage" class="mb-4 p-4 bg-success/10 border border-success/20 text-success text-sm rounded-sm">
        {{ successMessage }}
      </div>
      <div *ngIf="errorMessage" class="mb-4 p-4 bg-danger/10 border border-danger/20 text-danger text-sm rounded-sm">
        {{ errorMessage }}
      </div>

      <div *ngIf="isLoading" class="ks-card text-center text-primary py-12">
        Đang tải thông tin hồ sơ...
      </div>

      <div *ngIf="profile && !isLoading" class="ks-card mt-4">
        <div class="flex flex-col md:flex-row md:items-center gap-6 border-b border-border-subtle pb-8 mb-8">
          <div class="w-24 h-24 rounded-full bg-surface-raised border-2 border-primary flex items-center justify-center text-4xl font-display font-bold text-primary shadow-[0_0_15px_rgba(212,175,55,0.15)]">
            {{ profile.full_name.charAt(0) }}
          </div>

          <div class="flex-1">
            <h2 class="text-2xl font-display font-medium text-heading mb-1">{{ profile.full_name }}</h2>
            <div class="flex flex-wrap items-center gap-3 mt-2">
              <span class="text-sm font-mono text-muted">{{ profile.email }}</span>
              <span class="text-border-subtle">|</span>
              <app-status-badge [type]="getStatusBadgeType(profile.status)">
                {{ formatUserStatus(profile.status) }}
              </app-status-badge>
              <app-status-badge type="neutral">{{ formatUserRole(profile.role) }}</app-status-badge>
            </div>
          </div>

          <button class="ks-button ks-button-secondary w-fit !min-h-[40px] text-sm" (click)="openPasswordDialog()">
            Đổi mật khẩu
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div class="flex flex-col gap-2">
            <span class="text-sm text-muted">ID tài khoản</span>
            <span class="font-mono text-body break-all">{{ profile.id }}</span>
          </div>
          <div class="flex flex-col gap-2">
            <span class="text-sm text-muted">Mã định danh</span>
            <span class="font-mono text-body">{{ profile.institutional_code }}</span>
          </div>
          <div class="flex flex-col gap-2">
            <span class="text-sm text-muted">Email</span>
            <span class="text-body">{{ profile.email }}</span>
          </div>
          <div class="flex flex-col gap-2">
            <span class="text-sm text-muted">Lần đăng nhập gần nhất</span>
            <span class="text-body">{{ profile.last_login_at ? (profile.last_login_at | date:'dd/MM/yyyy HH:mm') : 'Chưa ghi nhận' }}</span>
          </div>
        </div>

        <form [formGroup]="profileForm" (ngSubmit)="onUpdateProfile()" class="space-y-5 border-t border-border-subtle pt-8">
          <h3 class="text-xl font-display font-bold text-heading">Cập nhật thông tin cá nhân</h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="ks-label">Họ và tên *</label>
              <input type="text" formControlName="full_name" class="ks-input" placeholder="Nhập họ và tên">
            </div>
            <div>
              <label class="ks-label">Số điện thoại</label>
              <input type="text" formControlName="phone" class="ks-input" placeholder="Nhập số điện thoại">
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div *ngIf="profile.role === 'student'">
              <label class="ks-label">Lớp</label>
              <input type="text" formControlName="class_name" class="ks-input" placeholder="VD: D20CQCN01">
            </div>
            <div *ngIf="profile.role !== 'student'">
              <label class="ks-label">Khoa/Bộ môn</label>
              <input type="text" formControlName="department" class="ks-input" placeholder="VD: Công nghệ thông tin">
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-4">
            <button type="button" class="ks-button ks-button-secondary" (click)="resetProfileForm()" [disabled]="isSubmitting">
              Khôi phục
            </button>
            <button type="submit" class="ks-button ks-button-primary" [disabled]="profileForm.invalid || isSubmitting">
              {{ isSubmitting ? 'Đang lưu...' : 'Lưu thông tin' }}
            </button>
          </div>
        </form>
      </div>

      <div *ngIf="isPasswordDialogOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-surface-deep/80 backdrop-blur-sm">
        <div class="ks-card w-full max-w-md p-6 relative">
          <h2 class="text-2xl font-display font-bold text-heading mb-6">Đổi Mật Khẩu</h2>

          <div *ngIf="passwordSuccessMessage" class="mb-4 p-3 bg-success/10 border border-success/20 text-success text-sm rounded-sm">
            {{ passwordSuccessMessage }}
          </div>
          <div *ngIf="passwordErrorMessage" class="mb-4 p-3 bg-danger/10 border border-danger/20 text-danger text-sm rounded-sm">
            {{ passwordErrorMessage }}
          </div>

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
              <button type="submit" class="ks-button ks-button-primary" [disabled]="passwordForm.invalid || isPasswordSubmitting">
                {{ isPasswordSubmitting ? 'Đang lưu...' : 'Lưu thay đổi' }}
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

  profile: UserProfile | null = null;
  profileForm!: FormGroup;
  passwordForm!: FormGroup;

  isLoading = false;
  isSubmitting = false;
  isPasswordDialogOpen = false;
  isPasswordSubmitting = false;
  successMessage = '';
  errorMessage = '';
  passwordSuccessMessage = '';
  passwordErrorMessage = '';

  ngOnInit() {
    this.initForms();
    this.loadProfile();
  }

  initForms() {
    this.profileForm = this.fb.group({
      full_name: ['', [Validators.required, Validators.maxLength(150)]],
      phone: ['', Validators.maxLength(20)],
      class_name: ['', Validators.maxLength(100)],
      department: ['', Validators.maxLength(150)]
    });

    this.passwordForm = this.fb.group({
      current_password: ['', [Validators.required, Validators.minLength(6)]],
      new_password: ['', [Validators.required, Validators.minLength(6)]],
      confirm_password: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(control: AbstractControl) {
    return control.get('new_password')?.value === control.get('confirm_password')?.value
      ? null : { mismatch: true };
  }

  loadProfile() {
    this.isLoading = true;
    this.errorMessage = '';
    this.userService.fetchCurrentProfile().subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.data) {
          this.profile = res.data;
          this.patchProfileForm(res.data);
          this.syncAuthUser(res.data);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = this.getErrorMessage(err, 'Không thể tải thông tin hồ sơ.');
      }
    });
  }

  patchProfileForm(profile: UserProfile) {
    this.profileForm.patchValue({
      full_name: profile.full_name,
      phone: profile.phone || '',
      class_name: profile.class_name || '',
      department: profile.department || ''
    });
  }

  resetProfileForm() {
    if (!this.profile) return;
    this.patchProfileForm(this.profile);
    this.successMessage = '';
    this.errorMessage = '';
  }

  onUpdateProfile() {
    if (this.profileForm.invalid || !this.profile) return;

    this.isSubmitting = true;
    this.successMessage = '';
    this.errorMessage = '';

    const formValue = this.profileForm.value;
    const payload: UpdateUserProfileRequest = {
      full_name: formValue.full_name,
      phone: this.toNullableString(formValue.phone),
      class_name: this.profile.role === 'student' ? this.toNullableString(formValue.class_name) : null,
      department: this.profile.role !== 'student' ? this.toNullableString(formValue.department) : null
    };

    this.userService.updateCurrentProfile(payload).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        if (res.data) {
          this.profile = res.data;
          this.patchProfileForm(res.data);
          this.syncAuthUser(res.data);
        }
        this.successMessage = 'Cập nhật thông tin thành công.';
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = this.getErrorMessage(err, 'Không thể cập nhật thông tin hồ sơ.');
      }
    });
  }

  openPasswordDialog() {
    this.passwordForm.reset();
    this.passwordSuccessMessage = '';
    this.passwordErrorMessage = '';
    this.isPasswordDialogOpen = true;
  }

  closePasswordDialog() {
    this.isPasswordDialogOpen = false;
    this.passwordSuccessMessage = '';
    this.passwordErrorMessage = '';
  }

  onChangePassword() {
    if (this.passwordForm.invalid) return;
    this.isPasswordSubmitting = true;
    this.passwordSuccessMessage = '';
    this.passwordErrorMessage = '';

    const payload = {
      current_password: this.passwordForm.value.current_password,
      new_password: this.passwordForm.value.new_password
    };

    this.userService.changePassword(payload).subscribe({
      next: () => {
        this.isPasswordSubmitting = false;
        this.passwordSuccessMessage = 'Đổi mật khẩu thành công.';
        this.passwordForm.reset();
      },
      error: (err) => {
        this.isPasswordSubmitting = false;
        this.passwordErrorMessage = this.getErrorMessage(err, 'Có lỗi xảy ra khi đổi mật khẩu.');
      }
    });
  }

  formatUserRole(role: UserRole): string {
    const labels: Record<UserRole, string> = {
      admin: 'Quản trị viên',
      lecturer: 'Giảng viên',
      student: 'Sinh viên'
    };
    return labels[role] || role;
  }

  formatUserStatus(status: UserStatus): string {
    const labels: Record<UserStatus, string> = {
      active: 'Đang hoạt động',
      inactive: 'Tạm ngưng',
      locked: 'Đã khóa'
    };
    return labels[status] || status;
  }

  getStatusBadgeType(status: UserStatus): 'success' | 'warning' | 'danger' | 'neutral' {
    if (status === 'active') return 'success';
    if (status === 'locked') return 'danger';
    return 'neutral';
  }

  private syncAuthUser(profile: UserProfile) {
    const user = {
      id: profile.id,
      name: profile.full_name,
      role: profile.role,
      email: profile.email
    };
    localStorage.setItem('user_data', JSON.stringify(user));
    this.authService.currentUser.set(user);
  }

  private toNullableString(value: string | null | undefined): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private getErrorMessage(err: any, fallbackMessage: string): string {
    const code = err.error?.error?.code;
    if (err.status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
    if (err.status === 403 || code === 'PERMISSION_DENIED') return 'Bạn không có quyền thực hiện thao tác này.';
    if (err.status === 422 || code === 'VALIDATION_ERROR') return 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.';
    return err.error?.message || fallbackMessage;
  }
}
