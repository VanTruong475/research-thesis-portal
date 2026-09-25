import { Component, ElementRef, inject, OnInit, ViewChild, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UserService } from '../../services/user.service';
import { UserImportRowError, UserProfile, UserStatus } from '../../models/user.model';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';
import { ActionDialogComponent } from '../../../../shared/components/action-dialog/action-dialog';

@Component({
  selector: 'app-user-list-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, StatusBadge, ActionDialogComponent],
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
          
          <input
            #csvInput
            type="file"
            accept=".csv,text/csv"
            class="hidden"
            (change)="onImportFileSelected($event)">
          <button type="button" class="ks-button ks-button-secondary" (click)="downloadImportTemplate()">
            Tải mẫu CSV
          </button>
          <button type="button" class="ks-button ks-button-secondary" [disabled]="isImporting" (click)="openImportPicker()">
            {{ isImporting ? 'Đang import...' : 'Import CSV' }}
          </button>
          <button routerLink="/app/users/new" class="ks-button ks-button-primary">
            + Thêm Mới
          </button>
        </div>
      </div>

      <div *ngIf="successMessage" class="mb-4 p-4 bg-success/10 border border-success/20 text-success text-sm rounded-sm">
        {{ successMessage }}
      </div>
      <div *ngIf="errorMessage" class="mb-4 p-4 bg-danger/10 border border-danger/20 text-danger text-sm rounded-sm">
        {{ errorMessage }}
        <ul *ngIf="importErrors.length > 0" class="mt-3 list-disc pl-5 space-y-1">
          <li *ngFor="let error of importErrors.slice(0, 8)">
            Dòng {{ error.row_number }} - {{ error.field }}: {{ error.message }}
          </li>
          <li *ngIf="importErrors.length > 8" class="italic">
            Và {{ importErrors.length - 8 }} lỗi khác...
          </li>
        </ul>
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

      <app-action-dialog
        [open]="!!pendingUserStatusAction"
        title="Xác nhận cập nhật tài khoản"
        [message]="getUserStatusActionMessage()"
        [confirmLabel]="getUserStatusActionLabel()"
        cancelLabel="Hủy"
        [variant]="pendingUserStatusAction?.newStatus === 'inactive' ? 'danger' : 'primary'"
        (confirmed)="confirmUserStatusAction()"
        (cancelled)="closeUserStatusActionDialog()">
      </app-action-dialog>
    </div>
  `
})
export class UserListPageComponent implements OnInit {
  userService = inject(UserService);
  @ViewChild('csvInput') csvInput?: ElementRef<HTMLInputElement>;

  filterRole = 'all';
  filterStatus = 'all';
  isLoading = false;
  isImporting = false;
  successMessage = '';
  errorMessage = '';
  importErrors: UserImportRowError[] = [];
  pendingUserStatusAction: { userId: string; newStatus: 'active' | 'inactive'; actionText: string } | null = null;

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
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Không thể tải danh sách người dùng.';
      }
    });
  }

  openImportPicker() {
    this.csvInput?.nativeElement.click();
  }

  onImportFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.clearMessages();
    this.isImporting = true;
    this.userService.importUsersCsv(file).subscribe({
      next: (res) => {
        this.isImporting = false;
        const createdCount = res.data?.created_count || 0;
        this.successMessage = `Đã import ${createdCount} tài khoản thành công.`;
        this.loadUsers();
        input.value = '';
      },
      error: (err) => {
        this.isImporting = false;
        this.errorMessage = this.getImportErrorMessage(err);
        this.importErrors = err.error?.error?.details?.errors || [];
        input.value = '';
      }
    });
  }

  downloadImportTemplate() {
    const csvContent = [
      'institutional_code,email,password,full_name,role,status,phone,class_name,department',
      'SV001,sv001@university.edu.vn,StrongPassword123!,Nguyen Van A,student,active,0900000001,DH21IT01,',
      'GV001,gv001@university.edu.vn,StrongPassword123!,Tran Thi B,lecturer,active,0900000002,,Khoa CNTT'
    ].join('\n');
    const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'MauImportNguoiDung.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  toggleUserStatus(userId: string, currentStatus: UserStatus) {
    const newStatus: 'active' | 'inactive' = currentStatus === 'active' ? 'inactive' : 'active';
    const actionText = currentStatus === 'active' ? 'Khóa' : 'Mở khóa';
    this.pendingUserStatusAction = { userId, newStatus, actionText };
    this.clearMessages();
  }

  getUserStatusActionLabel(): string {
    return this.pendingUserStatusAction?.actionText || 'Xác nhận';
  }

  getUserStatusActionMessage(): string {
    if (!this.pendingUserStatusAction) return '';
    return `Bạn có chắc chắn muốn ${this.pendingUserStatusAction.actionText.toLowerCase()} tài khoản này không?`;
  }

  closeUserStatusActionDialog() {
    this.pendingUserStatusAction = null;
  }

  confirmUserStatusAction() {
    if (!this.pendingUserStatusAction) return;

    const { userId, newStatus, actionText } = this.pendingUserStatusAction;
    this.closeUserStatusActionDialog();
    this.userService.updateUserStatus(userId, newStatus).subscribe({
      next: () => {
        this.successMessage = `${actionText} tài khoản thành công.`;
        this.loadUsers();
      },
      error: (err) => {
        const code = err.error?.error?.code;
        if (err.status === 401) this.errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
        else if (err.status === 403 || code === 'PERMISSION_DENIED') this.errorMessage = 'Bạn không có quyền cập nhật tài khoản này.';
        else if (code === 'USER_NOT_FOUND') this.errorMessage = 'Không tìm thấy tài khoản cần cập nhật.';
        else if (err.status === 422 || code === 'VALIDATION_ERROR') this.errorMessage = 'Dữ liệu trạng thái không hợp lệ.';
        else this.errorMessage = err.error?.message || 'Không thể cập nhật trạng thái tài khoản.';
      }
    });
  }

  private clearMessages() {
    this.successMessage = '';
    this.errorMessage = '';
    this.importErrors = [];
  }

  private getImportErrorMessage(err: any): string {
    const code = err.error?.error?.code;
    if (err.status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
    if (err.status === 403 || code === 'PERMISSION_DENIED') return 'Bạn không có quyền import tài khoản.';
    if (code === 'USER_IMPORT_INVALID_FILE') return err.error?.message || 'File CSV không hợp lệ.';
    if (code === 'USER_IMPORT_VALIDATION_ERROR') return 'File CSV có dòng dữ liệu không hợp lệ.';
    if (err.status === 422 || code === 'VALIDATION_ERROR') return 'Dữ liệu import không hợp lệ.';
    return err.error?.message || 'Không thể import danh sách người dùng.';
  }
}
