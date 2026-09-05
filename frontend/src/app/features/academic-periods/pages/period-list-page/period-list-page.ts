import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PeriodService } from '../../services/period.service';
import { AcademicPeriod, AcademicPeriodStatus, CreatePeriodRequest } from '../../models/period.model';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';

@Component({
  selector: 'app-period-list-page',
  standalone: true,
  imports: [CommonModule, StatusBadge, DatePipe, ReactiveFormsModule],
  template: `
    <div class="p-8 max-w-6xl mx-auto h-full flex flex-col relative">
      <div class="flex justify-between items-end mb-8">
        <div>
          <h1 class="text-3xl font-display font-bold text-heading uppercase tracking-wider">
            Quản Lý Kỳ Học
          </h1>
          <p class="text-muted mt-2">Thiết lập thời gian, mở từng giai đoạn và theo dõi tiến độ các học kỳ</p>
        </div>

        <!-- Nút mở form tạo kỳ học -->
        <button class="ks-button ks-button-primary" (click)="openDialog()">
          + Thêm Kỳ Học
        </button>
      </div>

      <div *ngIf="isLoading" class="text-center py-12 text-primary">Đang tải dữ liệu...</div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6" *ngIf="!isLoading">
        <div *ngFor="let period of periodService.periods()" class="ks-card hover:border-primary transition-colors">
          <div class="flex justify-between items-start mb-6 gap-4">
            <div>
              <h2 class="text-xl font-display font-bold text-primary">{{ period.name }} ({{ period.academic_year }})</h2>
              <p class="text-xs text-muted mt-2">{{ getPeriodWorkflowHint(period.status) }}</p>
            </div>
            <app-status-badge [type]="getStatusBadgeType(period.status)">
              {{ formatStatus(period.status) }}
            </app-status-badge>
          </div>

          <div class="space-y-4">
            <div class="flex justify-between border-b border-border-subtle pb-3">
              <span class="text-muted">Đề cương</span>
              <span class="font-mono text-body text-sm">{{ period.proposal_start_at | date:'dd/MM/yyyy' }} ➡️ {{ period.proposal_end_at | date:'dd/MM/yyyy' }}</span>
            </div>
            <div class="flex justify-between border-b border-border-subtle pb-3">
              <span class="text-muted">Bảo vệ</span>
              <span class="font-mono text-body text-sm">
                {{ period.defense_start_at ? (period.defense_start_at | date:'dd/MM/yyyy') : '--' }} ➡️ {{ period.defense_end_at ? (period.defense_end_at | date:'dd/MM/yyyy') : '--' }}
              </span>
            </div>
          </div>

          <!-- Các nút thao tác luôn hiển thị để Admin thấy rõ bước tiếp theo -->
          <div class="mt-6 pt-4 border-t border-border-subtle">
            <p class="text-xs text-muted mb-3">{{ getPeriodActionHint(period.status) }}</p>
            <div class="flex justify-end gap-3 flex-wrap">
              <!-- Chỉ hiển thị bước chuyển trạng thái tiếp theo mà Backend cho phép -->
              <button
                *ngIf="getNextStatus(period.status) as nextStatus"
                class="ks-button ks-button-primary text-sm"
                (click)="changeStatus(period.id, nextStatus)">
                {{ getNextStatusLabel(period.status) }}
              </button>
              <button
                *ngIf="canCancel(period.status)"
                class="ks-button ks-button-secondary text-sm text-danger"
                (click)="changeStatus(period.id, 'cancelled')">
                Hủy
              </button>

              <button class="ks-button ks-button-secondary text-sm" (click)="openDialog(period)">Sửa</button>
            </div>
          </div>
        </div>

        <div *ngIf="periodService.periods().length === 0" class="col-span-1 md:col-span-2 text-center py-12 text-muted italic ks-card">
          Chưa có kỳ học nào trong hệ thống.
        </div>
      </div>

      <div *ngIf="!isLoading && getTotalPages() > 1" class="mt-6 flex items-center justify-center gap-3">
        <button
          type="button"
          class="ks-button ks-button-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          [disabled]="currentPage === 1"
          (click)="goToPreviousPage()">
          ‹ Trước
        </button>
        <span class="text-sm text-muted">
          Trang {{ currentPage }} / {{ getTotalPages() }} · Tổng {{ periodService.totalItems() }} kỳ học
        </span>
        <button
          type="button"
          class="ks-button ks-button-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          [disabled]="currentPage === getTotalPages()"
          (click)="goToNextPage()">
          Sau ›
        </button>
      </div>

      <!-- Modal Dialog Thêm/Sửa Kỳ học -->
      <div *ngIf="isDialogOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-surface-deep/80 backdrop-blur-sm">
        <div class="ks-card w-full max-w-2xl p-6 relative">
          <h2 class="text-2xl font-display font-bold text-heading mb-6">
            {{ editingPeriodId ? 'Cập Nhật Kỳ Học' : 'Thêm Kỳ Học Mới' }}
          </h2>

          <form [formGroup]="periodForm" (ngSubmit)="onSubmit()" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="ks-label">Mã kỳ học *</label>
                <input type="text" formControlName="code" class="ks-input" placeholder="VD: HK1-2023">
              </div>
              <div>
                <label class="ks-label">Tên kỳ học *</label>
                <input type="text" formControlName="name" class="ks-input" placeholder="VD: Học kỳ 1">
              </div>
              <div>
                <label class="ks-label">Năm học *</label>
                <input type="text" formControlName="academic_year" class="ks-input" placeholder="VD: 2023-2024">
              </div>
              <div>
                <label class="ks-label">Học kỳ (Số)</label>
                <input type="number" formControlName="semester" class="ks-input" placeholder="VD: 1">
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="ks-label">Bắt đầu nộp đề cương *</label>
                <input type="date" formControlName="proposal_start_at" class="ks-input">
              </div>
              <div>
                <label class="ks-label">Hạn chót đề cương *</label>
                <input type="date" formControlName="proposal_end_at" class="ks-input">
              </div>
              <div>
                <label class="ks-label">Bắt đầu đăng ký ĐT *</label>
                <input type="date" formControlName="registration_start_at" class="ks-input">
              </div>
              <div>
                <label class="ks-label">Hạn chót đăng ký ĐT *</label>
                <input type="date" formControlName="registration_end_at" class="ks-input">
              </div>
            </div>

            <div class="pt-6 mt-6 border-t border-border-subtle flex justify-end gap-3">
              <button type="button" class="ks-button ks-button-secondary" (click)="closeDialog()">Hủy</button>
              <button type="submit" class="ks-button ks-button-primary" [disabled]="periodForm.invalid || isSubmitting">
                {{ isSubmitting ? 'Đang lưu...' : 'Lưu lại' }}
              </button>
            </div>
          </form>
        </div>
      </div>

    </div>
  `
})
export class PeriodListPageComponent implements OnInit {
  periodService = inject(PeriodService);
  private fb = inject(FormBuilder);

  isLoading = false;
  isDialogOpen = false;
  isSubmitting = false;
  editingPeriodId: string | null = null;
  periodForm!: FormGroup;
  currentPage = 1;
  readonly pageSize = 4;

  ngOnInit() {
    this.initForm();
    this.loadPeriods();
  }

  formatStatus(status: AcademicPeriodStatus): string {
    const statusMap: Record<AcademicPeriodStatus, string> = {
      'draft': 'Nháp',
      'proposal_open': 'Mở Đề xuất ĐT',
      'registration_open': 'Mở Đăng ký SV',
      'in_progress': 'Đang thực hiện',
      'defense': 'Bảo vệ',
      'completed': 'Hoàn thành',
      'cancelled': 'Đã hủy'
    };
    return statusMap[status] || status;
  }

  getStatusBadgeType(status: AcademicPeriodStatus): 'success' | 'warning' | 'danger' | 'neutral' {
    if (status === 'proposal_open' || status === 'registration_open' || status === 'in_progress' || status === 'defense') return 'success';
    if (status === 'draft') return 'warning';
    if (status === 'cancelled') return 'danger';
    return 'neutral';
  }

  getPeriodWorkflowHint(status: AcademicPeriodStatus): string {
    if (status === 'completed') return 'Kỳ học đã hoàn thành, chỉ xem lại dữ liệu lịch sử.';
    if (status === 'cancelled') return 'Kỳ học đã hủy, không mở thêm giai đoạn mới.';

    const nextStatus = this.getNextStatus(status);
    const nextLabel = nextStatus ? this.formatStatus(nextStatus) : '';
    return nextStatus
      ? `Hiện tại: ${this.formatStatus(status)}. Bước tiếp theo: ${nextLabel}.`
      : `Hiện tại: ${this.formatStatus(status)}.`;
  }

  getPeriodActionHint(status: AcademicPeriodStatus): string {
    if (status === 'completed') return 'Không còn bước chuyển trạng thái tiếp theo.';
    if (status === 'cancelled') return 'Kỳ học đã hủy nên không thể tiếp tục mở giai đoạn.';
    return 'Chọn hành động bên dưới để mở giai đoạn kế tiếp cho kỳ học này.';
  }

  loadPeriods() {
    this.isLoading = true;
    this.periodService.fetchPeriods(this.currentPage, this.pageSize).subscribe({
      next: () => {
        this.isLoading = false;
        if (this.periodService.periods().length === 0 && this.currentPage > 1) {
          this.currentPage -= 1;
          this.loadPeriods();
        }
      },
      error: () => this.isLoading = false
    });
  }

  getTotalPages(): number {
    return Math.max(1, Math.ceil(this.periodService.totalItems() / this.pageSize));
  }

  goToPreviousPage() {
    if (this.currentPage <= 1) return;
    this.currentPage -= 1;
    this.loadPeriods();
  }

  goToNextPage() {
    if (this.currentPage >= this.getTotalPages()) return;
    this.currentPage += 1;
    this.loadPeriods();
  }

  initForm() {
    this.periodForm = this.fb.group({
      code: ['', Validators.required],
      name: ['', Validators.required],
      academic_year: ['', Validators.required],
      semester: [1],
      proposal_start_at: ['', Validators.required],
      proposal_end_at: ['', Validators.required],
      registration_start_at: ['', Validators.required],
      registration_end_at: ['', Validators.required],
    });
  }

  openDialog(period?: AcademicPeriod) {
    this.isDialogOpen = true;
    if (period) {
      this.editingPeriodId = period.id;
      // Định dạng ngày (YYYY-MM-DD) để gán vào input date
      this.periodForm.patchValue({
        code: period.code,
        name: period.name,
        academic_year: period.academic_year,
        semester: period.semester,
        proposal_start_at: period.proposal_start_at ? period.proposal_start_at.split('T')[0] : '',
        proposal_end_at: period.proposal_end_at ? period.proposal_end_at.split('T')[0] : '',
        registration_start_at: period.registration_start_at ? period.registration_start_at.split('T')[0] : '',
        registration_end_at: period.registration_end_at ? period.registration_end_at.split('T')[0] : '',
      });
    } else {
      this.editingPeriodId = null;
      this.periodForm.reset();
    }
  }

  closeDialog() {
    this.isDialogOpen = false;
    this.editingPeriodId = null;
    this.periodForm.reset();
  }

  onSubmit() {
    if (this.periodForm.invalid) return;

    this.isSubmitting = true;
    const payload = this.periodForm.value as CreatePeriodRequest;

    // Input type="date" không có giờ, nên giữ ngày kết thúc đến cuối ngày để giai đoạn không bị đóng ngay 00:00.
    const formatToISO = (dateStr: string, endOfDay = false) => {
      if (!dateStr) return dateStr;
      const suffix = endOfDay ? 'T23:59:59.999' : 'T00:00:00.000';
      return new Date(`${dateStr}${suffix}`).toISOString();
    };

    payload.proposal_start_at = formatToISO(payload.proposal_start_at);
    payload.proposal_end_at = formatToISO(payload.proposal_end_at, true);
    payload.registration_start_at = formatToISO(payload.registration_start_at);
    payload.registration_end_at = formatToISO(payload.registration_end_at, true);

    if (this.editingPeriodId) {
      this.periodService.updatePeriod(this.editingPeriodId, payload).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.closeDialog();
          this.loadPeriods();
        },
        error: () => this.isSubmitting = false
      });
    } else {
      this.periodService.createPeriod(payload).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.closeDialog();
          this.loadPeriods();
        },
        error: () => this.isSubmitting = false
      });
    }
  }

  getNextStatus(status: AcademicPeriodStatus): AcademicPeriodStatus | null {
    const transitions: Partial<Record<AcademicPeriodStatus, AcademicPeriodStatus>> = {
      draft: 'proposal_open',
      proposal_open: 'registration_open',
      registration_open: 'in_progress',
      in_progress: 'defense',
      defense: 'completed'
    };
    return transitions[status] || null;
  }

  getNextStatusLabel(status: AcademicPeriodStatus): string {
    const nextStatus = this.getNextStatus(status);
    if (!nextStatus) return '';

    const labelMap: Record<AcademicPeriodStatus, string> = {
      draft: 'Mở đề xuất ĐT',
      proposal_open: 'Mở đăng ký SV',
      registration_open: 'Bắt đầu thực hiện',
      in_progress: 'Mở bảo vệ',
      defense: 'Kết thúc',
      completed: '',
      cancelled: ''
    };
    return labelMap[status];
  }

  canCancel(status: AcademicPeriodStatus): boolean {
    return ['draft', 'proposal_open', 'registration_open', 'in_progress', 'defense'].includes(status);
  }

  changeStatus(id: string, status: AcademicPeriodStatus) {
    const statusLabel = this.formatStatus(status);
    if (confirm(`Bạn có chắc chắn muốn chuyển trạng thái kỳ học sang "${statusLabel}"?`)) {
      this.periodService.updatePeriodStatus(id, status).subscribe({
        next: () => {
          alert(`Chuyển trạng thái kỳ học sang "${statusLabel}" thành công.`);
          this.loadPeriods();
        },
        error: (err) => {
          alert(this.getStatusChangeErrorMessage(err));
        }
      });
    }
  }

  private getStatusChangeErrorMessage(err: any): string {
    const code = err.error?.error?.code;
    if (err.status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
    if (err.status === 403 || code === 'PERMISSION_DENIED') return 'Bạn không có quyền chuyển trạng thái kỳ học.';
    if (code === 'ACADEMIC_PERIOD_INVALID_STATUS_TRANSITION') return 'Backend không cho phép chuyển trạng thái kỳ học theo hướng này.';
    if (code === 'ACADEMIC_PERIOD_NOT_FOUND') return 'Không tìm thấy kỳ học cần cập nhật.';
    if (err.status === 422 || code === 'VALIDATION_ERROR') return 'Dữ liệu trạng thái gửi lên không hợp lệ.';
    return err.error?.message || 'Có lỗi xảy ra khi chuyển trạng thái kỳ học.';
  }
}
