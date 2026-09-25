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

        <!-- Dành cho Giảng viên -->
        <ng-container *ngIf="auth.currentUser()?.role === 'lecturer'">
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
        </ng-container>

        <!-- Dành cho Sinh viên -->
        <ng-container *ngIf="auth.currentUser()?.role === 'student'">
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
    this.dashboardService.getMemberAStats().subscribe({
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
