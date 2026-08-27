import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PeriodService } from '../../services/period.service';
import { AcademicPeriod } from '../../models/period.model';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';

@Component({
  selector: 'app-period-list-page',
  standalone: true,
  imports: [CommonModule, StatusBadge],
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

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div *ngFor="let period of periods" class="ks-card hover:border-primary transition-colors group cursor-pointer">
          <div class="flex justify-between items-start mb-6">
            <h2 class="text-xl font-display font-bold text-primary">{{ period.name }}</h2>
            <app-status-badge 
              [type]="period.status === 'active' ? 'success' : (period.status === 'completed' ? 'neutral' : 'warning')">
              {{ period.status === 'active' ? 'Đang diễn ra' : (period.status === 'completed' ? 'Đã kết thúc' : 'Sắp tới') }}
            </app-status-badge>
          </div>
          
          <div class="space-y-4">
            <div class="flex justify-between border-b border-border-subtle pb-3">
              <span class="text-muted">Thời gian</span>
              <span class="font-mono text-body">{{ period.startDate }} ➡️ {{ period.endDate }}</span>
            </div>
            <div class="flex justify-between border-b border-border-subtle pb-3">
              <span class="text-muted">Tổng số đề tài</span>
              <span class="font-bold text-heading">{{ period.totalTopics }}</span>
            </div>
            <div class="flex justify-between pb-1">
              <span class="text-muted">Sinh viên tham gia</span>
              <span class="font-bold text-heading">{{ period.totalStudents }}</span>
            </div>
          </div>
          
          <div class="mt-6 pt-4 border-t border-border-subtle flex justify-end gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <button class="text-sm font-medium text-muted hover:text-primary transition-colors underline">Sửa</button>
            <button class="text-sm font-medium text-danger hover:text-danger/80 transition-colors underline">Xóa</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PeriodListPageComponent implements OnInit {
  periodService = inject(PeriodService);
  periods: AcademicPeriod[] = [];

  ngOnInit() {
    this.periods = this.periodService.getAllPeriods();
  }
}
