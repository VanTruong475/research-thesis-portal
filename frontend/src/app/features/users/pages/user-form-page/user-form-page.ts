import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { UserRole } from '../../models/user.model';

@Component({
  selector: 'app-user-form-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="p-8 max-w-3xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <button class="text-muted hover:text-primary mb-4 flex items-center text-sm transition-colors" (click)="goBack()">
          ← Quay lại danh sách
        </button>
        <h1 class="text-3xl font-display font-bold text-heading uppercase tracking-wider">
          Thêm Người Dùng Mới
        </h1>
        <p class="text-muted mt-2">Tạo tài khoản mới cho sinh viên, giảng viên hoặc admin</p>
      </div>

      <!-- Khối thông báo lỗi -->
      <div *ngIf="errorMessage" class="bg-danger/10 border border-danger text-danger p-4 rounded-sm mb-6">
        {{ errorMessage }}
      </div>

      <!-- Form Nhập Liệu -->
      <div class="ks-card p-6">
        <form [formGroup]="userForm" (ngSubmit)="onSubmit()" class="space-y-6">
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Mã định danh -->
            <div>
              <label class="ks-label">Mã số (MSSV/MSGV) <span class="text-danger">*</span></label>
              <input type="text" formControlName="institutional_code" class="ks-input" placeholder="VD: SV001, GV001">
              <div *ngIf="userForm.get('institutional_code')?.invalid && userForm.get('institutional_code')?.touched" class="text-danger text-xs mt-1">
                Vui lòng nhập mã định danh
              </div>
            </div>

            <!-- Vai trò -->
            <div>
              <label class="ks-label">Vai trò <span class="text-danger">*</span></label>
              <select formControlName="role" class="ks-input">
                <option value="student">Sinh viên</option>
                <option value="lecturer">Giảng viên</option>
                <option value="admin">Quản trị viên</option>
              </select>
            </div>
          </div>

          <!-- Họ và tên -->
          <div>
            <label class="ks-label">Họ và tên <span class="text-danger">*</span></label>
            <input type="text" formControlName="full_name" class="ks-input" placeholder="Nhập họ và tên đầy đủ">
            <div *ngIf="userForm.get('full_name')?.invalid && userForm.get('full_name')?.touched" class="text-danger text-xs mt-1">
              Vui lòng nhập họ và tên
            </div>
          </div>

          <!-- Email -->
          <div>
            <label class="ks-label">Địa chỉ Email <span class="text-danger">*</span></label>
            <input type="email" formControlName="email" class="ks-input" placeholder="VD: sv001@university.edu.vn">
            <div *ngIf="userForm.get('email')?.invalid && userForm.get('email')?.touched" class="text-danger text-xs mt-1">
              Vui lòng nhập email hợp lệ
            </div>
          </div>
          
          <!-- Mật khẩu (Tùy chọn) -->
          <div>
            <label class="ks-label">Mật khẩu (Tùy chọn)</label>
            <input type="password" formControlName="password" class="ks-input" placeholder="Để trống nếu muốn tự động tạo">
            <p class="text-xs text-muted mt-1">Nếu không nhập, hệ thống sẽ tạo mật khẩu ngẫu nhiên hoặc dùng mật khẩu mặc định.</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Lớp học (Chỉ hiện khi là Sinh viên) -->
            <div *ngIf="userForm.get('role')?.value === 'student'">
              <label class="ks-label">Lớp học</label>
              <input type="text" formControlName="class_name" class="ks-input" placeholder="VD: DH21IT01">
            </div>

            <!-- Khoa / Bộ môn (Chỉ hiện khi là Giảng viên/Admin) -->
            <div *ngIf="userForm.get('role')?.value !== 'student'">
              <label class="ks-label">Khoa / Bộ môn</label>
              <input type="text" formControlName="department" class="ks-input" placeholder="VD: Khoa CNTT">
            </div>
          </div>

          <div class="pt-6 border-t border-border-subtle flex justify-end gap-4">
            <button type="button" class="ks-button ks-button-secondary" (click)="goBack()">Hủy bỏ</button>
            <button type="submit" class="ks-button ks-button-primary" [disabled]="userForm.invalid || isLoading">
              {{ isLoading ? 'Đang lưu...' : 'Lưu Người Dùng' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class UserFormPageComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private router = inject(Router);

  userForm!: FormGroup;
  isLoading = false;
  errorMessage = '';

  ngOnInit() {
    this.initForm();
    
    // Theo dõi thay đổi của trường 'role' để tự động reset các trường không liên quan
    this.userForm.get('role')?.valueChanges.subscribe((role: UserRole) => {
      if (role === 'student') {
        this.userForm.get('department')?.setValue('');
      } else {
        this.userForm.get('class_name')?.setValue('');
      }
    });
  }

  // Khởi tạo form với các quy tắc xác thực (validators)
  private initForm() {
    this.userForm = this.fb.group({
      institutional_code: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: [''], // Không bắt buộc
      full_name: ['', [Validators.required]],
      role: ['student', [Validators.required]],
      class_name: [''],
      department: ['']
    });
  }

  // Xử lý khi bấm nút Lưu
  onSubmit() {
    if (this.userForm.invalid) {
      // Đánh dấu tất cả các ô là đã chạm (touched) để hiển thị lỗi đỏ
      this.userForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    
    const payload = { ...this.userForm.value };
    
    // Nếu password rỗng thì xóa khỏi payload để backend không bị lỗi validator độ dài
    if (!payload.password) {
      delete payload.password;
    }

    this.userService.createUser(payload).subscribe({
      next: (res) => {
        this.isLoading = false;
        // Thành công thì quay về trang danh sách
        this.router.navigate(['/app/users']);
      },
      error: (err) => {
        this.isLoading = false;
        // Lấy thông báo lỗi từ server nếu có
        this.errorMessage = err.error?.message || 'Có lỗi xảy ra khi tạo người dùng. Vui lòng thử lại.';
      }
    });
  }

  goBack() {
    this.router.navigate(['/app/users']);
  }
}
