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
          <p class="text-muted mt-2">Thiết lập thời gian và theo dõi tiến độ các học kỳ</p>
        </div>
        
        <!-- Nút mở form tạo kỳ học -->
        <button class="ks-button ks-button-primary" (click)="openDialog()">
          + Thêm Kỳ Học
        </button>
      </div>

      <div *ngIf="isLoading" class="text-center py-12 text-primary">Đang tải dữ liệu...</div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6" *ngIf="!isLoading">
        <div *ngFor="let period of periodService.periods()" class="ks-card hover:border-primary transition-colors group cursor-pointer">
          <div class="flex justify-between items-start mb-6">
            <h2 class="text-xl font-display font-bold text-primary">{{ period.name }} ({{ period.academic_year }})</h2>
            <app-status-badge 
              [type]="period.status === 'active' ? 'success' : (period.status === 'closed' ? 'neutral' : 'warning')">
              {{ period.status === 'active' ? 'Đang diễn ra' : (period.status === 'closed' ? 'Đã kết thúc' : 'Nháp') }}
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
          
          <!-- Các nút thao tác hiển thị khi hover -->
          <div class="mt-6 pt-4 border-t border-border-subtle flex justify-end gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <!-- Nút đổi trạng thái -->
            <button *ngIf="period.status === 'draft'" class="text-sm font-medium text-success hover:text-success/80 transition-colors underline" (click)="changeStatus(period.id, 'active')">Mở kỳ học</button>
            <button *ngIf="period.status === 'active'" class="text-sm font-medium text-warning hover:text-warning/80 transition-colors underline" (click)="changeStatus(period.id, 'closed')">Kết thúc</button>
            
            <button class="text-sm font-medium text-muted hover:text-primary transition-colors underline" (click)="openDialog(period)">Sửa</button>
          </div>
        </div>
        
        <div *ngIf="periodService.periods().length === 0" class="col-span-1 md:col-span-2 text-center py-12 text-muted italic ks-card">
          Chưa có kỳ học nào trong hệ thống.
        </div>
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

  ngOnInit() {
    this.initForm();
    this.loadPeriods();
  }

  loadPeriods() {
    this.isLoading = true;
    this.periodService.fetchPeriods().subscribe({
      next: () => this.isLoading = false,
      error: () => this.isLoading = false
    });
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
    
    // Đảm bảo định dạng DateTime hợp lệ cho Backend (thêm T00:00:00Z)
    const formatToISO = (dateStr: string) => {
      if (!dateStr) return dateStr;
      return new Date(dateStr).toISOString();
    };

    payload.proposal_start_at = formatToISO(payload.proposal_start_at);
    payload.proposal_end_at = formatToISO(payload.proposal_end_at);
    payload.registration_start_at = formatToISO(payload.registration_start_at);
    payload.registration_end_at = formatToISO(payload.registration_end_at);

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

  changeStatus(id: string, status: AcademicPeriodStatus) {
    if (confirm(`Bạn có chắc chắn muốn chuyển trạng thái kỳ học này?`)) {
      this.periodService.updatePeriodStatus(id, status).subscribe({
        next: () => this.loadPeriods()
      });
    }
  }
}
