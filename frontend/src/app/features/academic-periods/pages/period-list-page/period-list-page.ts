import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PeriodService } from '../../services/period.service';
import { AcademicPeriod } from '../../models/period.model';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-period-list-page',
  standalone: true,
  imports: [CommonModule, StatusBadge, DatePipe],
  template: `
    <div class="p-8 max-w-6xl mx-auto h-full flex flex-col">
      <div class="flex justify-between items-end mb-8">
        <div>
          <h1 class="text-3xl font-display font-bold text-heading uppercase tracking-wider">
            Quản Lý Kỳ Học
          </h1>
          <p class="text-muted mt-2">Thiết lập thời gian và theo dõi tiến độ các học kỳ</p>
        </div>
        
        <button class="ks-button ks-button-primary">
          + Thêm Kỳ Học
        </button>
      </div>

      <div *ngIf="isLoading" class="text-center py-12 text-primary">Đang tải dữ liệu...</div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6" *ngIf="!isLoading">
        <div *ngFor="let period of periodService.periods()" class="ks-card hover:border-primary transition-colors group cursor-pointer">
          <div class="flex justify-between items-start mb-6">
            <h2 class="text-xl font-display font-bold text-primary">{{ period.name }}</h2>
            <app-status-badge 
              [type]="period.status === 'active' ? 'success' : (period.status === 'closed' ? 'neutral' : 'warning')">
              {{ period.status === 'active' ? 'Đang diễn ra' : (period.status === 'closed' ? 'Đã kết thúc' : 'Sắp tới') }}
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
          
          <div class="mt-6 pt-4 border-t border-border-subtle flex justify-end gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <button class="text-sm font-medium text-muted hover:text-primary transition-colors underline">Sửa</button>
            <button class="text-sm font-medium text-danger hover:text-danger/80 transition-colors underline">Xóa</button>
          </div>
        </div>
        
        <div *ngIf="periodService.periods().length === 0" class="col-span-1 md:col-span-2 text-center py-12 text-muted italic ks-card">
          Chưa có kỳ học nào trong hệ thống.
        </div>
      </div>
    </div>
  `
})
export class PeriodListPageComponent implements OnInit {
  periodService = inject(PeriodService);
  isLoading = false;

  ngOnInit() {
    this.isLoading = true;
    this.periodService.fetchPeriods().subscribe({
      next: () => this.isLoading = false,
      error: () => this.isLoading = false
    });
  }
}
