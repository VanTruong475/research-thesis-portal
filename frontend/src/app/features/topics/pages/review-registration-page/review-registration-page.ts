import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TopicService } from '../../services/topic.service';
import { AuthService } from '../../../../core/services/auth';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';
import { ActionDialogComponent } from '../../../../shared/components/action-dialog/action-dialog';
import { Registration, RegistrationStatus } from '../../models/topic.model';

type RegistrationTab = 'pending' | 'active' | 'closed' | 'all';
type RegistrationActionType = 'approve' | 'reject';

@Component({
  selector: 'app-review-registration-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, StatusBadge, ActionDialogComponent],
  template: `
    <div class="p-4 md:p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
        <div>
          <h1 class="text-2xl md:text-3xl font-display font-bold text-heading uppercase tracking-wider">
            {{ getPageTitle() }}
          </h1>
          <p class="text-muted mt-2">{{ getPageSubtitle() }}</p>
        </div>
        
        <button class="ks-button ks-button-secondary w-full md:w-auto" (click)="exportRegistrationsToCsv()">
          <span class="material-symbols-outlined text-sm mr-2">download</span> Xuất CSV
        </button>
      </div>

      <div *ngIf="successMessage" class="mb-4 p-4 bg-success/10 border border-success/20 text-success text-sm rounded-sm">
        {{ successMessage }}
      </div>
      <div *ngIf="errorMessage" class="mb-4 p-4 bg-danger/10 border border-danger/20 text-danger text-sm rounded-sm">
        {{ errorMessage }}
      </div>

      <div class="mb-4">
        <input
          type="text"
          class="ks-input w-full"
          placeholder="Tìm theo sinh viên, mã sinh viên, đề tài, kỳ học hoặc giảng viên..."
          [(ngModel)]="registrationKeyword"
          (ngModelChange)="onRegistrationKeywordChange()">
      </div>

      <div class="flex flex-wrap gap-2 mb-4">
        <button
          *ngFor="let tab of getRegistrationTabs()"
          type="button"
          class="px-4 py-2 rounded-sm border text-sm font-medium transition-colors"
          [ngClass]="selectedRegistrationTab === tab.key ? 'border-primary bg-primary/10 text-primary' : 'border-border-subtle text-muted hover:text-primary hover:border-primary/40'"
          (click)="selectRegistrationTab(tab.key)">
          {{ tab.label }}
          <span class="ml-2 text-xs opacity-70">{{ tab.count }}</span>
        </button>
      </div>

      <div class="ks-card flex-1 overflow-hidden flex flex-col p-0 relative">
        <div *ngIf="isLoading" class="absolute inset-0 bg-surface-deep/50 backdrop-blur-sm z-20 flex items-center justify-center">
          <span class="text-primary font-medium">Đang tải dữ liệu...</span>
        </div>

        <div class="overflow-auto custom-scrollbar">
          <table class="w-full text-left border-collapse min-w-[800px]">
            <thead class="sticky top-0 bg-surface-deep z-10 shadow-sm">
              <tr>
                <th class="p-4 font-sans font-medium text-muted text-sm border-b border-border-subtle">Ngày ĐK</th>
                <th class="p-4 font-sans font-medium text-muted text-sm border-b border-border-subtle">Sinh viên</th>
                <th class="p-4 font-sans font-medium text-muted text-sm border-b border-border-subtle">Đề tài</th>
                <th class="p-4 font-sans font-medium text-muted text-sm border-b border-border-subtle">Trạng thái</th>
                <th class="p-4 font-sans font-medium text-muted text-sm border-b border-border-subtle text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border-subtle">
              <tr *ngFor="let reg of getPaginatedRegistrations()" class="hover:bg-surface-raised transition-colors align-top">
                <td class="p-4 text-sm font-mono text-muted">{{ (reg.registered_at || reg.created_at) | date:'dd/MM/yyyy' }}</td>
                <td class="p-4">
                  <div class="font-medium text-body">{{ getStudentLabel(reg) }}</div>
                  <div class="text-xs text-muted font-mono mt-1">{{ reg.student_institutional_code || reg.student_id }}</div>
                </td>
                <td class="p-4 text-sm text-body max-w-sm">
                  <div class="font-medium truncate">{{ getTopicLabel(reg) }}</div>
                  <div class="text-xs text-muted mt-1">Kỳ: {{ getAcademicPeriodLabel(reg) }}</div>
                  <div *ngIf="reg.supervisor_full_name" class="text-xs text-muted mt-1">GVHD: {{ getSupervisorLabel(reg) }}</div>
                  <div *ngIf="reg.review_reason && (reg.status === 'rejected' || reg.status === 'cancelled')" class="text-xs text-danger mt-2">
                    Lý do: {{ reg.review_reason }}
                  </div>
                </td>
                <td class="p-4">
                  <app-status-badge [type]="getRegistrationStatusBadgeType(reg.status)">
                    {{ formatRegistrationStatus(reg.status) }}
                  </app-status-badge>
                </td>
                <td class="p-4 text-right">
                  <div *ngIf="reg.status === 'pending'" class="flex justify-end gap-3">
                    <button
                      [disabled]="isProcessing === reg.id"
                      (click)="approveRegistration(reg.id)"
                      class="px-4 py-1.5 bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-dark-ink transition-colors rounded-sm text-sm font-medium disabled:opacity-50">
                      Duyệt
                    </button>
                    <button
                      [disabled]="isProcessing === reg.id"
                      (click)="rejectRegistration(reg.id)"
                      class="px-4 py-1.5 bg-transparent text-danger border border-border-subtle hover:border-danger transition-colors rounded-sm text-sm font-medium disabled:opacity-50">
                      Từ chối
                    </button>
                  </div>

                  <div *ngIf="reg.status === 'approved' || reg.status === 'in_progress'" class="flex justify-end gap-3">
                    <a [routerLink]="['/app/registrations', reg.id, 'progress']" class="text-sm font-medium text-primary hover:underline" title="Theo dõi tiến độ">Tiến độ</a>
                    <a [routerLink]="['/app/registrations', reg.id, 'reports']" class="text-sm font-medium text-primary hover:underline" title="Xem báo cáo sinh viên đã nộp">Báo cáo</a>
                    <a [routerLink]="['/app/registrations', reg.id, 'evaluation']" class="text-sm font-medium text-primary hover:underline" title="Chấm điểm">Chấm điểm</a>
                  </div>

                  <div *ngIf="reg.status !== 'pending' && reg.status !== 'approved' && reg.status !== 'in_progress'" class="text-muted text-sm italic">
                    Không có thao tác
                  </div>
                </td>
              </tr>

              <tr *ngIf="getFilteredRegistrations().length === 0 && !isLoading">
                <td colspan="5" class="p-8 text-center text-muted italic">
                  {{ getEmptyRegistrationMessage() }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div *ngIf="!isLoading && getRegistrationTotalPages() > 1" class="mt-6 flex items-center justify-center gap-3">
        <button
          type="button"
          class="ks-button ks-button-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          [disabled]="registrationCurrentPage === 1"
          (click)="goToPreviousRegistrationPage()">
          ‹ Trước
        </button>
        <span class="text-sm text-muted">
          Trang {{ registrationCurrentPage }} / {{ getRegistrationTotalPages() }} · Tổng {{ getFilteredRegistrations().length }} đăng ký
        </span>
        <button
          type="button"
          class="ks-button ks-button-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          [disabled]="registrationCurrentPage === getRegistrationTotalPages()"
          (click)="goToNextRegistrationPage()">
          Sau ›
        </button>
      </div>

      <app-action-dialog
        [open]="!!pendingRegistrationAction"
        [title]="getRegistrationActionDialogTitle()"
        [message]="getRegistrationActionDialogMessage()"
        [confirmLabel]="getRegistrationActionConfirmLabel()"
        cancelLabel="Hủy"
        [variant]="pendingRegistrationAction?.type === 'reject' ? 'danger' : 'warning'"
        [textareaLabel]="pendingRegistrationAction?.type === 'reject' ? 'Lý do từ chối *' : ''"
        textareaPlaceholder="Nhập lý do từ chối đăng ký"
        [textareaRequired]="pendingRegistrationAction?.type === 'reject'"
        (confirmed)="confirmRegistrationAction($event)"
        (cancelled)="closeRegistrationActionDialog()">
      </app-action-dialog>
    </div>
  `
})
export class ReviewRegistrationPageComponent implements OnInit {
  topicService = inject(TopicService);
  authService = inject(AuthService);

  isLoading = false;
  isProcessing: string | null = null;
  successMessage = '';
  errorMessage = '';
  selectedRegistrationTab: RegistrationTab = 'pending';
  pendingRegistrationAction: { type: RegistrationActionType; registrationId: string } | null = null;
  registrationKeyword = '';
  registrationCurrentPage = 1;
  readonly registrationPageSize = 8;

  ngOnInit() {
    this.loadRegistrations();
  }

  loadRegistrations() {
    const user = this.authService.currentUser();
    if (user && (user.role === 'lecturer' || user.role === 'admin')) {
      this.isLoading = true;
      this.topicService.fetchLecturerRegistrations().subscribe({
        next: () => {
          this.isLoading = false;
          this.ensureValidRegistrationPage();
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = this.getRegistrationActionErrorMessage(err, 'Không thể tải danh sách đăng ký.');
        }
      });
    }
  }

  get isAdmin(): boolean {
    return this.authService.currentUser()?.role === 'admin';
  }

  getPageTitle(): string {
    return this.isAdmin ? 'Quản Lý Đăng Ký' : 'Đăng Ký Hướng Dẫn';
  }

  getPageSubtitle(): string {
    if (this.isAdmin) {
      return 'Theo dõi, duyệt và quản lý các đăng ký đề tài trong hệ thống';
    }
    return 'Duyệt yêu cầu đăng ký, theo dõi tiến độ, báo cáo và chấm điểm sinh viên bạn phụ trách';
  }

  selectRegistrationTab(tab: RegistrationTab) {
    this.selectedRegistrationTab = tab;
    this.registrationCurrentPage = 1;
  }

  onRegistrationKeywordChange() {
    this.registrationCurrentPage = 1;
  }

  getRegistrationTabs(): Array<{ key: RegistrationTab; label: string; count: number }> {
    const registrations = this.topicService.registrations();
    const labels: Record<RegistrationTab, string> = this.isAdmin
      ? {
        pending: 'Cần xử lý',
        active: 'Đang thực hiện',
        closed: 'Đã từ chối / hủy',
        all: 'Tất cả'
      }
      : {
        pending: 'Chờ duyệt',
        active: 'Đang hướng dẫn',
        closed: 'Đã xong / khác',
        all: 'Tất cả'
      };

    return (['pending', 'active', 'closed', 'all'] as RegistrationTab[]).map(key => ({
      key,
      label: labels[key],
      count: key === 'all' ? registrations.length : registrations.filter(reg => this.matchesRegistrationTab(reg, key)).length
    }));
  }

  getFilteredRegistrations(): Registration[] {
    const keyword = this.normalizeSearchText(this.registrationKeyword);
    return this.topicService.registrations().filter(registration => {
      const matchesTab = this.selectedRegistrationTab === 'all' || this.matchesRegistrationTab(registration, this.selectedRegistrationTab);
      const searchableText = this.normalizeSearchText([
        this.getStudentLabel(registration),
        registration.student_institutional_code,
        registration.student_id,
        this.getTopicLabel(registration),
        this.getAcademicPeriodLabel(registration),
        this.getSupervisorLabel(registration),
        this.formatRegistrationStatus(registration.status),
        registration.review_reason
      ].join(' '));
      return matchesTab && (!keyword || searchableText.includes(keyword));
    });
  }

  getPaginatedRegistrations(): Registration[] {
    const registrations = this.getFilteredRegistrations();
    const startIndex = (this.registrationCurrentPage - 1) * this.registrationPageSize;
    return registrations.slice(startIndex, startIndex + this.registrationPageSize);
  }

  getRegistrationTotalPages(): number {
    return Math.max(1, Math.ceil(this.getFilteredRegistrations().length / this.registrationPageSize));
  }

  goToPreviousRegistrationPage() {
    if (this.registrationCurrentPage <= 1) return;
    this.registrationCurrentPage -= 1;
  }

  goToNextRegistrationPage() {
    if (this.registrationCurrentPage >= this.getRegistrationTotalPages()) return;
    this.registrationCurrentPage += 1;
  }

  ensureValidRegistrationPage() {
    if (this.registrationCurrentPage > this.getRegistrationTotalPages()) {
      this.registrationCurrentPage = this.getRegistrationTotalPages();
    }
  }

  getEmptyRegistrationMessage(): string {
    if (this.registrationKeyword.trim()) return 'Không tìm thấy đăng ký phù hợp với từ khóa hiện tại.';

    if (this.isAdmin) {
      if (this.selectedRegistrationTab === 'pending') return 'Không có đăng ký nào đang chờ xử lý.';
      if (this.selectedRegistrationTab === 'active') return 'Không có đăng ký nào đang thực hiện.';
      if (this.selectedRegistrationTab === 'closed') return 'Không có đăng ký nào đã bị từ chối hoặc hủy.';
      return 'Chưa có đăng ký nào trong hệ thống.';
    }

    if (this.selectedRegistrationTab === 'pending') return 'Chưa có đăng ký nào đang chờ bạn duyệt.';
    if (this.selectedRegistrationTab === 'active') return 'Chưa có sinh viên nào đang thực hiện đề tài bạn hướng dẫn.';
    if (this.selectedRegistrationTab === 'closed') return 'Chưa có đăng ký nào đã hoàn thành hoặc ở trạng thái khác.';
    return 'Chưa có đăng ký nào liên quan đến đề tài bạn hướng dẫn.';
  }

  formatRegistrationStatus(status: RegistrationStatus): string {
    const statusMap: Record<RegistrationStatus, string> = {
      pending: 'Chờ duyệt',
      approved: 'Đã duyệt',
      rejected: 'Từ chối',
      cancelled: 'Đã hủy',
      in_progress: 'Đang thực hiện',
      completed: 'Hoàn thành'
    };
    return statusMap[status] || status;
  }

  getRegistrationStatusBadgeType(status: RegistrationStatus): 'success' | 'warning' | 'danger' | 'neutral' {
    if (status === 'approved' || status === 'in_progress' || status === 'completed') return 'success';
    if (status === 'pending') return 'warning';
    if (status === 'rejected' || status === 'cancelled') return 'danger';
    return 'neutral';
  }

  getStudentLabel(registration: Registration): string {
    return registration.student_full_name || registration.studentName || 'Chưa cập nhật';
  }

  getTopicLabel(registration: Registration): string {
    const title = registration.topic_title || registration.topicName || 'Chưa cập nhật';
    return registration.topic_code ? `${registration.topic_code} - ${title}` : title;
  }

  getAcademicPeriodLabel(registration: Registration): string {
    const name = registration.academic_period_name || 'Chưa cập nhật';
    return registration.academic_period_code ? `${registration.academic_period_code} - ${name}` : name;
  }

  getSupervisorLabel(registration: Registration): string {
    const name = registration.supervisor_full_name || 'Chưa phân công';
    return registration.supervisor_institutional_code ? `${registration.supervisor_institutional_code} - ${name}` : name;
  }

  approveRegistration(registrationId: string) {
    this.openRegistrationActionDialog('approve', registrationId);
  }

  rejectRegistration(registrationId: string) {
    this.openRegistrationActionDialog('reject', registrationId);
  }

  openRegistrationActionDialog(type: RegistrationActionType, registrationId: string) {
    this.pendingRegistrationAction = { type, registrationId };
    this.successMessage = '';
    this.errorMessage = '';
  }

  closeRegistrationActionDialog() {
    this.pendingRegistrationAction = null;
  }

  getRegistrationActionDialogTitle(): string {
    if (this.pendingRegistrationAction?.type === 'approve') return 'Xác nhận duyệt đăng ký';
    if (this.pendingRegistrationAction?.type === 'reject') return 'Từ chối đăng ký';
    return 'Xác nhận thao tác';
  }

  getRegistrationActionDialogMessage(): string {
    if (this.pendingRegistrationAction?.type === 'approve') return 'Bạn có chắc chắn muốn duyệt cho sinh viên này thực hiện đề tài?';
    if (this.pendingRegistrationAction?.type === 'reject') return 'Vui lòng nhập lý do từ chối đăng ký.';
    return '';
  }

  getRegistrationActionConfirmLabel(): string {
    return this.pendingRegistrationAction?.type === 'reject' ? 'Từ chối' : 'Duyệt';
  }

  confirmRegistrationAction(reason: string) {
    if (!this.pendingRegistrationAction) return;

    const { type, registrationId } = this.pendingRegistrationAction;
    this.closeRegistrationActionDialog();
    if (type === 'approve') {
      this.performApproveRegistration(registrationId);
      return;
    }
    this.performRejectRegistration(registrationId, reason);
  }

  private performApproveRegistration(registrationId: string) {
    this.isProcessing = registrationId;
    this.successMessage = '';
    this.errorMessage = '';
    this.topicService.approveRegistration(registrationId).subscribe({
      next: () => {
        this.isProcessing = null;
        this.successMessage = 'Duyệt đăng ký thành công.';
        this.loadRegistrations();
      },
      error: (err) => {
        this.isProcessing = null;
        this.errorMessage = this.getRegistrationActionErrorMessage(err, 'Có lỗi xảy ra khi duyệt đăng ký.');
      }
    });
  }

  private performRejectRegistration(registrationId: string, reason: string) {
    this.isProcessing = registrationId;
    this.successMessage = '';
    this.errorMessage = '';
    this.topicService.rejectRegistration(registrationId, { review_reason: reason }).subscribe({
      next: () => {
        this.isProcessing = null;
        this.successMessage = 'Từ chối đăng ký thành công.';
        this.loadRegistrations();
      },
      error: (err) => {
        this.isProcessing = null;
        this.errorMessage = this.getRegistrationActionErrorMessage(err, 'Có lỗi xảy ra khi từ chối đăng ký.');
      }
    });
  }

  private matchesRegistrationTab(registration: Registration, tab: RegistrationTab): boolean {
    if (tab === 'pending') return registration.status === 'pending';
    if (tab === 'active') return registration.status === 'approved' || registration.status === 'in_progress';
    if (tab === 'closed') return registration.status === 'rejected' || registration.status === 'cancelled' || registration.status === 'completed';
    return true;
  }

  private normalizeSearchText(value: string | null | undefined): string {
    return (value || '').toLowerCase().trim();
  }

  private getRegistrationActionErrorMessage(err: any, fallbackMessage: string): string {
    const code = err.error?.error?.code;
    if (err.status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
    if (err.status === 403 || code === 'PERMISSION_DENIED') return 'Bạn không có quyền thực hiện thao tác này.';
    if (code === 'REGISTRATION_NOT_FOUND') return 'Không tìm thấy đăng ký cần xử lý.';
    if (code === 'REGISTRATION_INVALID_STATUS_TRANSITION') return 'Trạng thái đăng ký hiện tại không cho phép thao tác này.';
    if (code === 'REGISTRATION_REJECTION_REASON_REQUIRED') return 'Vui lòng nhập lý do từ chối đăng ký.';
    if (code === 'REGISTRATION_ALREADY_EFFECTIVE') return 'Sinh viên đã có đăng ký hiệu lực trong kỳ học này.';
    if (code === 'REGISTRATION_TOPIC_FULL' || code === 'TOPIC_FULL') return 'Đề tài đã đủ số lượng sinh viên.';
    if (code === 'REGISTRATION_PERIOD_CLOSED') return 'Hiện không nằm trong thời gian đăng ký đề tài.';
    if (err.status === 422 || code === 'VALIDATION_ERROR') return 'Dữ liệu gửi lên không hợp lệ. Vui lòng kiểm tra lại.';
    return err.error?.message || fallbackMessage;
  }

  exportRegistrationsToCsv() {
    const registrations = this.getFilteredRegistrations();
    if (registrations.length === 0) {
      this.errorMessage = 'Không có dữ liệu đăng ký để xuất.';
      return;
    }

    // CSV Header
    let csvContent = 'Ngày ĐK,Mã SV,Tên SV,Mã Đề Tài,Tên Đề Tài,GVHD,Trạng Thái\n';

    // CSV Rows
    registrations.forEach(r => {
      const dateStr = (r.registered_at || r.created_at)?.substring(0, 10) || '';
      const ms = r.student_institutional_code || r.student_id || '';
      const ts = this.getStudentLabel(r);
      const mt = r.topic_code || '';
      const tt = this.getTopicLabel(r);
      const gv = r.supervisor_full_name || '';
      const statusStr = this.formatRegistrationStatus(r.status);
      
      csvContent += `"${dateStr}","${ms}","${ts}","${mt}","${tt}","${gv}","${statusStr}"\n`;
    });

    this.downloadCsv(csvContent, 'DanhSachDangKy.csv');
  }

  private downloadCsv(csvContent: string, fileName: string) {
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
