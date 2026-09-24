import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService, DashboardStats } from '../../services/dashboard.service';
import { AuthService } from '../../../../core/services/auth';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="space-y-6">
      <div class="flex justify-between items-end">
        <div>
          <h1 class="text-3xl font-display font-bold text-heading">Bảng Điều Khiển (Hội Đồng & Kết Quả)</h1>
          <p class="text-muted mt-1">Tổng quan thông tin quá trình thực hiện và đánh giá đề tài.</p>
        </div>
      </div>

      <div *ngIf="isLoading" class="text-primary py-8 text-center font-medium">
        Đang tải dữ liệu...
      </div>
      
      <div *ngIf="errorMessage" class="bg-danger/10 text-danger p-4 rounded-sm border border-danger">
        {{ errorMessage }}
      </div>

      <div *ngIf="!isLoading && stats" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <!-- Dành cho Admin -->
        <ng-container *ngIf="auth.currentUser()?.role === 'admin'">
          <div class="ks-card p-6 flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-muted uppercase">Hội đồng đã lập</p>
              <h2 class="text-4xl font-display font-bold text-primary mt-2">{{ stats.councils_count || 0 }}</h2>
            </div>
          </div>
          <div class="ks-card p-6 flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-muted uppercase">Lịch bảo vệ</p>
              <h2 class="text-4xl font-display font-bold text-secondary mt-2">{{ stats.schedules_count || 0 }}</h2>
            </div>
          </div>
          <div class="ks-card p-6 flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-muted uppercase">Điểm đã tính</p>
              <h2 class="text-4xl font-display font-bold text-success mt-2">{{ stats.calculated_results || 0 }}</h2>
            </div>
          </div>
          <div class="ks-card p-6 flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-muted uppercase">Đã công bố</p>
              <h2 class="text-4xl font-display font-bold text-info mt-2">{{ stats.published_results || 0 }}</h2>
            </div>
          </div>
        </ng-container>

        <!-- Dành cho Giảng viên -->
        <ng-container *ngIf="auth.currentUser()?.role === 'lecturer'">
          <div class="ks-card p-6 flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-muted uppercase">Tiến độ cần duyệt</p>
              <h2 class="text-4xl font-display font-bold text-warning mt-2">{{ stats.pending_progress || 0 }}</h2>
            </div>
          </div>
          <div class="ks-card p-6 flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-muted uppercase">Báo cáo mới</p>
              <h2 class="text-4xl font-display font-bold text-info mt-2">{{ stats.new_reports || 0 }}</h2>
            </div>
          </div>
          <div class="ks-card p-6 flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-muted uppercase">Hội đồng tham gia</p>
              <h2 class="text-4xl font-display font-bold text-primary mt-2">{{ stats.assigned_councils || 0 }}</h2>
            </div>
          </div>
          <div class="ks-card p-6 flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-muted uppercase">Lịch sắp tới</p>
              <h2 class="text-4xl font-display font-bold text-secondary mt-2">{{ stats.upcoming_schedules || 0 }}</h2>
            </div>
          </div>
        </ng-container>

        <!-- Dành cho Sinh viên -->
        <ng-container *ngIf="auth.currentUser()?.role === 'student'">
          <div class="ks-card p-6">
            <p class="text-sm font-medium text-muted uppercase">Deadline gần nhất</p>
            <h2 class="text-xl font-display font-bold text-primary mt-2">{{ stats.next_deadline || 'Chưa có' }}</h2>
          </div>
          <div class="ks-card p-6">
            <p class="text-sm font-medium text-muted uppercase">Báo cáo đã nộp</p>
            <h2 class="text-4xl font-display font-bold text-info mt-2">{{ stats.submitted_reports || 0 }}</h2>
          </div>
          <div class="ks-card p-6">
            <p class="text-sm font-medium text-muted uppercase">Lịch bảo vệ</p>
            <h2 class="text-xl font-display font-bold text-secondary mt-2">{{ stats.defense_schedule || 'Chưa xếp lịch' }}</h2>
          </div>
          <div class="ks-card p-6">
            <p class="text-sm font-medium text-muted uppercase">Kết quả</p>
            <h2 class="text-2xl font-display font-bold text-success mt-2">{{ stats.final_result || 'Chưa công bố' }}</h2>
          </div>
        </ng-container>

      </div>
    </div>
  `
})
export class DashboardPageComponent implements OnInit {
  dashboardService = inject(DashboardService);
  auth = inject(AuthService);

  stats: DashboardStats | null = null;
  isLoading = false;
  errorMessage = '';

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.isLoading = true;
    this.dashboardService.getMemberBStats().subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.data) {
          this.stats = res.data;
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Không thể tải thống kê lúc này.';
      }
    });
  }
}
