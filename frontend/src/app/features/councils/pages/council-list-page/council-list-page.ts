import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { CouncilService } from '../../services/council';
import { Council, CouncilMemberRole } from '../../models/council.model';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';

@Component({
  selector: 'app-council-list-page',
  standalone: true,
  imports: [CommonModule, StatusBadge, DatePipe],
  template: `
    <div class="p-8 max-w-7xl mx-auto h-full flex flex-col">
      <!-- Header -->
      <div class="flex justify-between items-end mb-8">
        <div>
          <h1 class="text-3xl font-display font-bold text-heading uppercase tracking-wider">
            Quản Lý Hội Đồng Bảo Vệ
          </h1>
          <p class="text-muted mt-2">Thành lập hội đồng, phân công giảng viên và xếp lịch bảo vệ</p>
        </div>
        
        <button class="ks-button ks-button-primary">
          + Thành lập Hội đồng
        </button>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-2 gap-8 relative">
        <div *ngIf="isLoading" class="absolute inset-0 z-10 flex items-start justify-center pt-10">
          <span class="text-primary font-medium">Đang tải dữ liệu hội đồng...</span>
        </div>

        <div *ngFor="let council of councilService.councils()" class="ks-card p-0 overflow-hidden flex flex-col">
          <!-- Card Header -->
          <div class="p-6 border-b border-border-subtle bg-surface-deep flex justify-between items-start">
            <div>
              <div class="text-sm font-mono text-muted mb-1">{{ council.code }}</div>
              <h2 class="text-xl font-display font-bold text-primary">{{ council.name }}</h2>
            </div>
            <app-status-badge [type]="council.status === 'published' ? 'success' : (council.status === 'draft' ? 'warning' : 'neutral')">
              {{ council.status === 'published' ? 'Đã chốt' : (council.status === 'draft' ? 'Bản nháp' : 'Hoàn thành') }}
            </app-status-badge>
          </div>

          <div class="p-6 flex-1 flex flex-col gap-6">
            <!-- Thành viên hội đồng -->
            <div>
              <h3 class="text-sm font-bold text-heading uppercase tracking-wider mb-3">Thành viên Hội đồng</h3>
              <ul class="space-y-2">
                <li *ngFor="let member of council.members" class="flex justify-between text-sm">
                  <span class="text-body font-medium">{{ member.name || member.lecturer_id }}</span>
                  <span class="text-muted">{{ formatRole(member.member_role) }}</span>
                </li>
                <li *ngIf="council.members.length === 0" class="text-sm text-muted italic">Chưa phân công thành viên</li>
              </ul>
              <button class="mt-3 text-sm text-primary hover:underline font-medium">+ Thêm thành viên</button>
            </div>

            <!-- Lịch bảo vệ -->
            <div class="flex-1">
              <h3 class="text-sm font-bold text-heading uppercase tracking-wider mb-3">Lịch bảo vệ ({{ council.schedules.length }})</h3>
              <div class="space-y-3">
                <div *ngFor="let schedule of council.schedules" class="p-3 border border-border-subtle rounded-sm bg-surface-deep">
                  <div class="font-medium text-body text-sm mb-1 truncate">{{ schedule.topic_name || 'Đề tài chưa rõ' }}</div>
                  <div class="text-xs text-muted mb-2">SV: <span class="font-medium">{{ schedule.student_name || 'SV' }}</span></div>
                  <div class="flex justify-between items-center text-xs font-mono">
                    <span class="text-primary">{{ schedule.scheduled_at | date:'dd/MM/yyyy HH:mm' }} ({{ schedule.duration_minutes }}p)</span>
                    <span class="text-muted">Phòng: {{ schedule.room }}</span>
                  </div>
                </div>
                <div *ngIf="council.schedules.length === 0" class="text-sm text-muted italic p-3 border border-dashed border-border-subtle text-center">
                  Chưa xếp lịch bảo vệ
                </div>
              </div>
            </div>
          </div>

          <!-- Card Footer -->
          <div class="p-4 border-t border-border-subtle bg-surface-deep flex justify-end gap-3">
            <button class="text-sm font-medium text-muted hover:text-primary transition-colors underline">Chỉnh sửa</button>
            <button class="text-sm font-medium text-primary hover:text-primary/80 transition-colors underline">Xếp lịch</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CouncilListPageComponent implements OnInit {
  councilService = inject(CouncilService);
  isLoading = false;

  // Giả lập ID học kỳ
  private readonly DUMMY_PERIOD_ID = '123e4567-e89b-12d3-a456-426614174000';

  ngOnInit() {
    this.isLoading = true;
    this.councilService.getCouncilsByPeriod(this.DUMMY_PERIOD_ID).subscribe({
      next: () => this.isLoading = false,
      error: () => this.isLoading = false
    });
  }

  formatRole(role: CouncilMemberRole): string {
    const roles: Record<CouncilMemberRole, string> = {
      chairperson: 'Chủ tịch',
      secretary: 'Thư ký',
      reviewer: 'Phản biện',
      member: 'Ủy viên'
    };
    return roles[role] || role;
  }
}
