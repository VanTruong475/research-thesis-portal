import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
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

        <button class="ks-button ks-button-primary" (click)="openDialog()">
          + Thêm Kỳ Học
        </button>
      </div>

      <div *ngIf="successMessage" class="mb-4 p-4 bg-success/10 border border-success/20 text-success text-sm rounded-sm">
        {{ successMessage }}
      </div>
      <div *ngIf="errorMessage" class="mb-4 p-4 bg-danger/10 border border-danger/20 text-danger text-sm rounded-sm">
        {{ errorMessage }}
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

          <div class="space-y-3">
            <div class="flex justify-between gap-4 border-b border-border-subtle pb-3">
              <span class="text-muted">Đề xuất đề tài</span>
              <span class="font-mono text-body text-sm text-right">{{ getDateRangeLabel(period.proposal_start_at, period.proposal_end_at) }}</span>
            </div>
            <div class="flex justify-between gap-4 border-b border-border-subtle pb-3">
              <span class="text-muted">Đăng ký đề tài</span>
              <span class="font-mono text-body text-sm text-right">{{ getDateRangeLabel(period.registration_start_at, period.registration_end_at) }}</span>
            </div>
            <div class="flex justify-between gap-4 border-b border-border-subtle pb-3">
              <span class="text-muted">Thực hiện</span>
              <span class="font-mono text-body text-sm text-right">{{ getDateRangeLabel(period.execution_start_at, period.execution_end_at) }}</span>
            </div>
            <div class="flex justify-between gap-4 border-b border-border-subtle pb-3">
              <span class="text-muted">Hạn báo cáo</span>
              <span class="font-mono text-body text-sm text-right">{{ getDateLabel(period.report_deadline_at) }}</span>
            </div>
            <div class="flex justify-between gap-4 border-b border-border-subtle pb-3">
              <span class="text-muted">Bảo vệ</span>
              <span class="font-mono text-body text-sm text-right">{{ getDateRangeLabel(period.defense_start_at, period.defense_end_at) }}</span>
            </div>
          </div>

          <div class="mt-6 pt-4 border-t border-border-subtle">
            <p class="text-xs text-muted mb-3">{{ getPeriodActionHint(period.status) }}</p>
            <div class="flex justify-end gap-3 flex-wrap">
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

      <div *ngIf="isDialogOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-surface-deep/80 backdrop-blur-sm p-4">
        <div class="ks-card w-full max-w-3xl p-6 relative max-h-[90vh] overflow-y-auto custom-scrollbar">
          <h2 class="text-2xl font-display font-bold text-heading mb-2">
            {{ editingPeriodId ? 'Cập Nhật Kỳ Học' : 'Thêm Kỳ Học Mới' }}
          </h2>
          <p class="text-muted text-sm mb-6">Nhập đầy đủ các mốc thời gian để hệ thống mở đúng giai đoạn đề xuất, đăng ký, thực hiện và bảo vệ.</p>

          <div *ngIf="periodForm.errors?.['proposalRange'] || periodForm.errors?.['registrationRange'] || periodForm.errors?.['executionRange'] || periodForm.errors?.['defenseRange']" class="mb-4 p-3 bg-danger/10 border border-danger/20 text-danger text-sm rounded-sm">
            Vui lòng kiểm tra lại các cặp ngày: ngày bắt đầu phải trước ngày kết thúc.
          </div>

          <form [formGroup]="periodForm" (ngSubmit)="onSubmit()" class="space-y-5">
            <div>
              <h3 class="font-display text-heading font-bold mb-3">Thông tin chung</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="ks-label">Mã kỳ học *</label>
                  <input type="text" formControlName="code" class="ks-input" placeholder="VD: HK1-2026">
                </div>
                <div>
                  <label class="ks-label">Tên kỳ học *</label>
                  <input type="text" formControlName="name" class="ks-input" placeholder="VD: Học kỳ 1">
                </div>
                <div>
                  <label class="ks-label">Năm học *</label>
                  <input type="text" formControlName="academic_year" class="ks-input" placeholder="VD: 2026-2027">
                </div>
                <div>
                  <label class="ks-label">Học kỳ</label>
                  <input type="number" formControlName="semester" class="ks-input" placeholder="VD: 1" min="1" max="3">
                </div>
              </div>
            </div>

            <div>
              <h3 class="font-display text-heading font-bold mb-3">Giai đoạn đề xuất và đăng ký</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="ks-label">Bắt đầu đề xuất đề tài *</label>
                  <input type="date" formControlName="proposal_start_at" class="ks-input">
                </div>
                <div>
                  <label class="ks-label">Kết thúc đề xuất đề tài *</label>
                  <input type="date" formControlName="proposal_end_at" class="ks-input">
                </div>
                <div>
                  <label class="ks-label">Bắt đầu đăng ký đề tài *</label>
                  <input type="date" formControlName="registration_start_at" class="ks-input">
                </div>
                <div>
                  <label class="ks-label">Kết thúc đăng ký đề tài *</label>
                  <input type="date" formControlName="registration_end_at" class="ks-input">
                </div>
              </div>
            </div>

            <div>
              <h3 class="font-display text-heading font-bold mb-3">Giai đoạn thực hiện và bảo vệ</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="ks-label">Bắt đầu thực hiện</label>
                  <input type="date" formControlName="execution_start_at" class="ks-input">
                </div>
                <div>
                  <label class="ks-label">Kết thúc thực hiện</label>
                  <input type="date" formControlName="execution_end_at" class="ks-input">
                </div>
                <div>
                  <label class="ks-label">Hạn nộp báo cáo</label>
                  <input type="date" formControlName="report_deadline_at" class="ks-input">
                </div>
                <div></div>
                <div>
                  <label class="ks-label">Bắt đầu bảo vệ</label>
                  <input type="date" formControlName="defense_start_at" class="ks-input">
                </div>
                <div>
                  <label class="ks-label">Kết thúc bảo vệ</label>
                  <input type="date" formControlName="defense_end_at" class="ks-input">
                </div>
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
  successMessage = '';
  errorMessage = '';

  ngOnInit() {
    this.initForm();
    this.loadPeriods();
  }

  formatStatus(status: AcademicPeriodStatus): string {
    const statusMap: Record<AcademicPeriodStatus, string> = {
      draft: 'Nháp',
      proposal_open: 'Mở đề xuất đề tài',
      registration_open: 'Mở đăng ký sinh viên',
      in_progress: 'Đang thực hiện',
      defense: 'Bảo vệ',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy'
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
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = this.getPeriodErrorMessage(err, 'Không thể tải danh sách kỳ học.');
      }
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
      semester: [1, [Validators.min(1), Validators.max(3)]],
      proposal_start_at: ['', Validators.required],
      proposal_end_at: ['', Validators.required],
      registration_start_at: ['', Validators.required],
      registration_end_at: ['', Validators.required],
      execution_start_at: [''],
      execution_end_at: [''],
      report_deadline_at: [''],
      defense_start_at: [''],
      defense_end_at: ['']
    }, { validators: this.periodDateRangeValidator });
  }

  openDialog(period?: AcademicPeriod) {
    this.clearMessages();
    this.isDialogOpen = true;
    if (period) {
      this.editingPeriodId = period.id;
      this.periodForm.patchValue({
        code: period.code,
        name: period.name,
        academic_year: period.academic_year,
        semester: period.semester,
        proposal_start_at: this.toDateInputValue(period.proposal_start_at),
        proposal_end_at: this.toDateInputValue(period.proposal_end_at),
        registration_start_at: this.toDateInputValue(period.registration_start_at),
        registration_end_at: this.toDateInputValue(period.registration_end_at),
        execution_start_at: this.toDateInputValue(period.execution_start_at),
        execution_end_at: this.toDateInputValue(period.execution_end_at),
        report_deadline_at: this.toDateInputValue(period.report_deadline_at),
        defense_start_at: this.toDateInputValue(period.defense_start_at),
        defense_end_at: this.toDateInputValue(period.defense_end_at)
      });
    } else {
      this.editingPeriodId = null;
      this.periodForm.reset({ semester: 1 });
    }
  }

  closeDialog() {
    this.isDialogOpen = false;
    this.editingPeriodId = null;
    this.periodForm.reset({ semester: 1 });
  }

  onSubmit() {
    if (this.periodForm.invalid) {
      this.periodForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.clearMessages();
    const payload = this.buildPeriodPayload();

    if (this.editingPeriodId) {
      this.periodService.updatePeriod(this.editingPeriodId, payload).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.successMessage = 'Cập nhật kỳ học thành công.';
          this.closeDialog();
          this.loadPeriods();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.errorMessage = this.getPeriodErrorMessage(err, 'Không thể cập nhật kỳ học.');
        }
      });
    } else {
      this.periodService.createPeriod(payload).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.successMessage = 'Tạo kỳ học thành công.';
          this.closeDialog();
          this.loadPeriods();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.errorMessage = this.getPeriodErrorMessage(err, 'Không thể tạo kỳ học.');
        }
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
    const labelMap: Partial<Record<AcademicPeriodStatus, string>> = {
      draft: 'Mở đề xuất đề tài',
      proposal_open: 'Mở đăng ký sinh viên',
      registration_open: 'Bắt đầu thực hiện',
      in_progress: 'Mở bảo vệ',
      defense: 'Kết thúc'
    };
    return labelMap[status] || '';
  }

  canCancel(status: AcademicPeriodStatus): boolean {
    return ['draft', 'proposal_open', 'registration_open', 'in_progress', 'defense'].includes(status);
  }

  changeStatus(id: string, status: AcademicPeriodStatus) {
    const statusLabel = this.formatStatus(status);
    if (!confirm(`Bạn có chắc chắn muốn chuyển trạng thái kỳ học sang "${statusLabel}"?`)) return;

    this.clearMessages();
    this.periodService.updatePeriodStatus(id, status).subscribe({
      next: () => {
        this.successMessage = `Chuyển trạng thái kỳ học sang "${statusLabel}" thành công.`;
        this.loadPeriods();
      },
      error: (err) => {
        this.errorMessage = this.getStatusChangeErrorMessage(err);
      }
    });
  }

  getDateLabel(value?: string): string {
    if (!value) return '--';
    return new Date(value).toLocaleDateString('vi-VN');
  }

  getDateRangeLabel(start?: string, end?: string): string {
    return `${this.getDateLabel(start)} → ${this.getDateLabel(end)}`;
  }

  private buildPeriodPayload(): CreatePeriodRequest {
    const value = this.periodForm.value;
    const payload: CreatePeriodRequest = {
      code: value.code,
      name: value.name,
      academic_year: value.academic_year,
      semester: value.semester,
      proposal_start_at: this.formatToISO(value.proposal_start_at),
      proposal_end_at: this.formatToISO(value.proposal_end_at, true),
      registration_start_at: this.formatToISO(value.registration_start_at),
      registration_end_at: this.formatToISO(value.registration_end_at, true),
      execution_start_at: this.formatToISOOrUndefined(value.execution_start_at),
      execution_end_at: this.formatToISOOrUndefined(value.execution_end_at, true),
      report_deadline_at: this.formatToISOOrUndefined(value.report_deadline_at, true),
      defense_start_at: this.formatToISOOrUndefined(value.defense_start_at),
      defense_end_at: this.formatToISOOrUndefined(value.defense_end_at, true)
    };
    return payload;
  }

  private formatToISO(dateStr: string, endOfDay = false): string {
    const suffix = endOfDay ? 'T23:59:59.999' : 'T00:00:00.000';
    return new Date(`${dateStr}${suffix}`).toISOString();
  }

  private formatToISOOrUndefined(dateStr?: string | null, endOfDay = false): string | undefined {
    if (!dateStr) return undefined;
    return this.formatToISO(dateStr, endOfDay);
  }

  private toDateInputValue(value?: string): string {
    return value ? value.split('T')[0] : '';
  }

  private clearMessages() {
    this.successMessage = '';
    this.errorMessage = '';
  }

  private periodDateRangeValidator(control: AbstractControl): ValidationErrors | null {
    const errors: ValidationErrors = {};
    const hasInvalidRange = (startField: string, endField: string) => {
      const start = control.get(startField)?.value;
      const end = control.get(endField)?.value;
      return start && end && new Date(start) >= new Date(end);
    };

    if (hasInvalidRange('proposal_start_at', 'proposal_end_at')) errors['proposalRange'] = true;
    if (hasInvalidRange('registration_start_at', 'registration_end_at')) errors['registrationRange'] = true;
    if (hasInvalidRange('execution_start_at', 'execution_end_at')) errors['executionRange'] = true;
    if (hasInvalidRange('defense_start_at', 'defense_end_at')) errors['defenseRange'] = true;

    return Object.keys(errors).length ? errors : null;
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

  private getPeriodErrorMessage(err: any, fallbackMessage: string): string {
    const code = err.error?.error?.code;
    if (err.status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
    if (err.status === 403 || code === 'PERMISSION_DENIED') return 'Bạn không có quyền thực hiện thao tác này.';
    if (code === 'ACADEMIC_PERIOD_CODE_EXISTS') return 'Mã kỳ học đã tồn tại. Vui lòng chọn mã khác.';
    if (code === 'ACADEMIC_PERIOD_INVALID_DATE_RANGE') return 'Khoảng thời gian không hợp lệ. Ngày bắt đầu phải trước ngày kết thúc.';
    if (code === 'ACADEMIC_PERIOD_COMPLETED_READ_ONLY') return 'Kỳ học đã hoàn thành nên không thể cập nhật.';
    if (code === 'ACADEMIC_PERIOD_INVALID_STATUS_TRANSITION') return 'Trạng thái hiện tại không cho phép thao tác này.';
    if (code === 'ACADEMIC_PERIOD_NOT_FOUND') return 'Không tìm thấy kỳ học cần cập nhật.';
    if (err.status === 422 || code === 'VALIDATION_ERROR') return 'Dữ liệu kỳ học không hợp lệ. Vui lòng kiểm tra lại các trường bắt buộc.';
    return err.error?.message || fallbackMessage;
  }
}
