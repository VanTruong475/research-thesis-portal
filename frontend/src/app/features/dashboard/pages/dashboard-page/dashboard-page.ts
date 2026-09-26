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
          <h1 class="text-3xl font-display font-bold text-heading">Bảng Điều Khiển</h1>
          <p class="text-muted mt-1">Tổng quan nhanh các hoạt động học phần và đề tài.</p>
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
              <p class="text-sm font-medium text-muted uppercase">Người dùng</p>
              <h2 class="text-4xl font-display font-bold text-primary mt-2">{{ stats.users_count || 0 }}</h2>
            </div>
          </div>
          <div class="ks-card p-6 flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-muted uppercase">Sinh viên</p>
              <h2 class="text-4xl font-display font-bold text-secondary mt-2">{{ stats.students_count || 0 }}</h2>
            </div>
          </div>
          <div class="ks-card p-6 flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-muted uppercase">Giảng viên</p>
              <h2 class="text-4xl font-display font-bold text-success mt-2">{{ stats.lecturers_count || 0 }}</h2>
            </div>
          </div>
          <div class="ks-card p-6 flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-muted uppercase">Đợt học đang hoạt động</p>
              <h2 class="text-4xl font-display font-bold text-info mt-2">{{ stats.active_periods_count || 0 }}</h2>
            </div>
          </div>
          <div class="ks-card p-6 flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-muted uppercase">Đề tài chờ duyệt</p>
              <h2 class="text-4xl font-display font-bold text-warning mt-2">{{ stats.pending_topics_count || 0 }}</h2>
            </div>
          </div>
          <div class="ks-card p-6 flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-muted uppercase">Đăng ký chờ xử lý</p>
              <h2 class="text-4xl font-display font-bold text-danger mt-2">{{ stats.pending_registrations_count || 0 }}</h2>
            </div>
          </div>
        </ng-container>

        <!-- Các card bổ sung cho Admin (Phase 3) -->
        <ng-container *ngIf="auth.currentUser()?.role === 'admin'">
          <div class="ks-card p-6 flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-muted uppercase">Số hội đồng đã lập</p>
              <h2 class="text-4xl font-display font-bold text-primary mt-2">{{ stats.councils_count || 0 }}</h2>
            </div>
          </div>
          <div class="ks-card p-6 flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-muted uppercase">Số lịch bảo vệ</p>
              <h2 class="text-4xl font-display font-bold text-secondary mt-2">{{ stats.schedules_count || 0 }}</h2>
            </div>
          </div>
          <div class="ks-card p-6 flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-muted uppercase">Kết quả đã tính</p>
              <h2 class="text-4xl font-display font-bold text-success mt-2">{{ stats.calculated_results || 0 }}</h2>
            </div>
          </div>
          <div class="ks-card p-6 flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-muted uppercase">Kết quả đã công bố</p>
              <h2 class="text-4xl font-display font-bold text-info mt-2">{{ stats.published_results || 0 }}</h2>
            </div>
          </div>
        </ng-container>

        <!-- Dành cho Giảng viên -->
        <ng-container *ngIf="auth.currentUser()?.role === 'lecturer'">
          <!-- Member A -->
          <div class="ks-card p-6 flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-muted uppercase">Đề tài của tôi</p>
              <h2 class="text-4xl font-display font-bold text-primary mt-2">{{ stats.my_topics_count || 0 }}</h2>
            </div>
          </div>
          <div class="ks-card p-6 flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-muted uppercase">Đề tài chờ duyệt</p>
              <h2 class="text-4xl font-display font-bold text-warning mt-2">{{ stats.my_pending_topics_count || 0 }}</h2>
            </div>
          </div>
          <div class="ks-card p-6 flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-muted uppercase">Đề tài đã duyệt</p>
              <h2 class="text-4xl font-display font-bold text-success mt-2">{{ stats.my_approved_topics_count || 0 }}</h2>
            </div>
          </div>
          <div class="ks-card p-6 flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-muted uppercase">Đăng ký chờ duyệt</p>
              <h2 class="text-4xl font-display font-bold text-info mt-2">{{ stats.pending_registrations_count || 0 }}</h2>
            </div>
          </div>
          <div class="ks-card p-6 flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-muted uppercase">Đang hướng dẫn</p>
              <h2 class="text-4xl font-display font-bold text-secondary mt-2">{{ stats.supervising_registrations_count || 0 }}</h2>
            </div>
          </div>
          <!-- Member B -->
          <div class="ks-card p-6 flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-muted uppercase">Tiến độ chờ nhận xét</p>
              <h2 class="text-4xl font-display font-bold text-warning mt-2">{{ stats.pending_progress || 0 }}</h2>
            </div>
          </div>
          <div class="ks-card p-6 flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-muted uppercase">Báo cáo mới nộp</p>
              <h2 class="text-4xl font-display font-bold text-primary mt-2">{{ stats.new_reports || 0 }}</h2>
            </div>
          </div>
          <div class="ks-card p-6 flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-muted uppercase">Hội đồng phân công</p>
              <h2 class="text-4xl font-display font-bold text-info mt-2">{{ stats.assigned_councils || 0 }}</h2>
            </div>
          </div>
          <div class="ks-card p-6 flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-muted uppercase">Lịch bảo vệ sắp tới</p>
              <h2 class="text-4xl font-display font-bold text-success mt-2">{{ stats.upcoming_schedules || 0 }}</h2>
            </div>
          </div>
        </ng-container>

        <!-- Dành cho Sinh viên -->
        <ng-container *ngIf="auth.currentUser()?.role === 'student'">
          <!-- Member A -->
          <div class="ks-card p-6 flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-muted uppercase">Đề tài có thể đăng ký</p>
              <h2 class="text-4xl font-display font-bold text-primary mt-2">{{ stats.available_topics_count || 0 }}</h2>
            </div>
          </div>
          <div class="ks-card p-6 flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-muted uppercase">Đăng ký của tôi</p>
              <h2 class="text-4xl font-display font-bold text-info mt-2">{{ stats.my_registrations_count || 0 }}</h2>
            </div>
          </div>
          <div class="ks-card p-6 flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-muted uppercase">Đăng ký chờ duyệt</p>
              <h2 class="text-4xl font-display font-bold text-warning mt-2">{{ stats.pending_registrations_count || 0 }}</h2>
            </div>
          </div>
          <div class="ks-card p-6 flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-muted uppercase">Đăng ký đang hiệu lực</p>
              <h2 class="text-4xl font-display font-bold text-success mt-2">{{ stats.active_registrations_count || 0 }}</h2>
            </div>
          </div>
          <!-- Member B -->
          <div class="ks-card p-6 flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-muted uppercase">Số báo cáo đã nộp</p>
              <h2 class="text-4xl font-display font-bold text-primary mt-2">{{ stats.submitted_reports || 0 }}</h2>
            </div>
          </div>
          <div class="ks-card p-6 flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-muted uppercase">Deadline kết thúc</p>
              <h2 class="text-xl font-mono font-bold text-warning mt-3 truncate">{{ stats.next_deadline || 'Chưa có' }}</h2>
            </div>
          </div>
          <div class="ks-card p-6 flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-muted uppercase">Lịch bảo vệ</p>
              <h2 class="text-xl font-mono font-bold text-info mt-3 truncate">{{ stats.defense_schedule || 'Chưa có' }}</h2>
            </div>
          </div>
          <div class="ks-card p-6 flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-muted uppercase">Kết quả tổng kết</p>
              <h2 class="text-2xl font-display font-bold text-success mt-3 truncate">{{ stats.final_result || 'Chưa công bố' }}</h2>
            </div>
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
    this.stats = {};
    
    // Load Member A stats
    this.dashboardService.getMemberAStats().subscribe({
      next: (res) => {
        if (res.data) {
          this.stats = { ...this.stats, ...res.data };
        }
        
        // Then Load Member B stats
        this.dashboardService.getMemberBStats().subscribe({
          next: (resB) => {
            if (resB.data) {
              this.stats = { ...this.stats, ...resB.data };
            }
            this.isLoading = false;
          },
          error: (err) => {
            this.isLoading = false;
            this.errorMessage = 'Không thể tải toàn bộ thống kê lúc này.';
          }
        });

      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Không thể tải thống kê lúc này.';
      }
    });
  }
}
