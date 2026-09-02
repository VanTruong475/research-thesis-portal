import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TopicService } from '../../services/topic.service';
import { AuthService } from '../../../../core/services/auth';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';
import { Registration, RegistrationStatus } from '../../models/topic.model';

@Component({
  selector: 'app-my-registration-page',
  standalone: true,
  imports: [CommonModule, RouterModule, StatusBadge],
  template: `
    <div class="p-8 max-w-5xl mx-auto h-full flex flex-col">
      <div class="flex justify-between items-end mb-8">
        <div>
          <h1 class="text-3xl font-display font-bold text-heading uppercase tracking-wider">
            Kết Quả Đăng Ký
          </h1>
          <p class="text-muted mt-2">Theo dõi trạng thái các đề tài bạn đã xin hướng dẫn</p>
        </div>
      </div>

      <div class="ks-card flex-1 overflow-hidden flex flex-col p-0 relative">
        <div *ngIf="isLoading" class="absolute inset-0 bg-surface-deep/50 backdrop-blur-sm z-20 flex items-center justify-center">
          <span class="text-primary font-medium">Đang tải dữ liệu...</span>
        </div>

        <div class="overflow-y-auto custom-scrollbar">
          <table class="w-full text-left border-collapse">
            <thead class="sticky top-0 bg-surface-deep z-10 shadow-sm">
              <tr>
                <th class="p-4 font-sans font-medium text-muted text-sm border-b border-border-subtle">Ngày ĐK</th>
                <th class="p-4 font-sans font-medium text-muted text-sm border-b border-border-subtle">Đăng ký thực hiện</th>
                <th class="p-4 font-sans font-medium text-muted text-sm border-b border-border-subtle">GV hướng dẫn</th>
                <th class="p-4 font-sans font-medium text-muted text-sm border-b border-border-subtle">Trạng thái</th>
                <th class="p-4 font-sans font-medium text-muted text-sm border-b border-border-subtle text-right">Hành động</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border-subtle">
              <tr *ngFor="let reg of topicService.registrations()" class="hover:bg-surface-raised transition-colors align-top">
                <td class="p-4 text-sm font-mono text-muted">{{ (reg.registered_at || reg.created_at) | date:'dd/MM/yyyy' }}</td>
                <td class="p-4">
                  <div class="font-medium text-body">{{ getTopicLabel(reg) }}</div>
                  <div class="text-xs text-muted mt-1">Kỳ: {{ getAcademicPeriodLabel(reg) }}</div>
                  <div *ngIf="reg.status === 'approved'" class="text-xs text-success mt-2 font-medium">
                    {{ isExecuting(reg) ? 'Đang thực hiện' : 'Đã được chấp nhận thực hiện đề tài' }}
                  </div>
                  <div *ngIf="reg.status === 'rejected' && reg.review_reason" class="text-xs text-danger mt-2">
                    Lý do từ chối: {{ reg.review_reason }}
                  </div>
                  <div *ngIf="reg.status === 'cancelled'" class="text-xs text-muted mt-2">
                    Đã hủy<span *ngIf="reg.cancelled_at"> ngày {{ reg.cancelled_at | date:'dd/MM/yyyy' }}</span>
                  </div>
                </td>
                <td class="p-4 text-sm text-body">
                  <div>{{ getSupervisorLabel(reg) }}</div>
                  <div *ngIf="reg.supervisor_institutional_code" class="text-xs text-muted font-mono mt-1">
                    {{ reg.supervisor_institutional_code }}
                  </div>
                </td>
                <td class="p-4">
                  <app-status-badge [type]="getRegistrationStatusBadgeType(reg.status)">
                    {{ formatRegistrationStatus(reg.status) }}
                  </app-status-badge>
                </td>
                <td class="p-4 text-right">
                  <div class="flex items-center justify-end gap-3">
                    <ng-container *ngIf="reg.status === 'approved'">
                      <a [routerLink]="['/app/registrations', reg.id, 'progress']" class="text-sm font-medium text-primary hover:underline" title="Xem tiến độ">Tiến độ</a>
                      <a [routerLink]="['/app/topics', reg.topic_id, 'reports']" class="text-sm font-medium text-primary hover:underline" title="Nộp báo cáo">Báo cáo</a>
                      <a [routerLink]="['/app/registrations', reg.id, 'final-results']" class="text-sm font-medium text-primary hover:underline" title="Xem điểm">Điểm</a>
                    </ng-container>

                    <button
                      *ngIf="reg.status === 'pending'"
                      [disabled]="isCancelling === reg.id"
                      (click)="cancelRegistration(reg.id)"
                      class="text-sm font-medium text-danger hover:text-danger/80 transition-colors underline disabled:opacity-50 disabled:no-underline">
                      {{ isCancelling === reg.id ? 'Đang hủy...' : 'Hủy đăng ký' }}
                    </button>
                  </div>
                </td>
              </tr>
              
              <tr *ngIf="topicService.registrations().length === 0 && !isLoading">
                <td colspan="5" class="p-8 text-center text-muted italic">
                  Bạn chưa đăng ký đề tài nào. Hãy quay lại trang Danh sách Đề tài để đăng ký.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class MyRegistrationPageComponent implements OnInit {
  topicService = inject(TopicService);
  authService = inject(AuthService);
  
  isLoading = false;
  isCancelling: string | null = null;

  ngOnInit() {
    this.loadRegistrations();
  }

  loadRegistrations() {
    const user = this.authService.currentUser();
    if (user && user.role === 'student') {
      this.isLoading = true;
      this.topicService.fetchMyRegistrations().subscribe({
        next: () => this.isLoading = false,
        error: () => this.isLoading = false
      });
    }
  }

  formatRegistrationStatus(status: RegistrationStatus): string {
    const statusMap: Record<RegistrationStatus, string> = {
      pending: 'Đang chờ duyệt',
      approved: 'Thành công',
      rejected: 'Bị từ chối',
      cancelled: 'Đã hủy',
      in_progress: 'Đang thực hiện (cũ)',
      completed: 'Hoàn thành'
    };
    return statusMap[status] || status;
  }

  getRegistrationStatusBadgeType(status: RegistrationStatus): 'success' | 'warning' | 'danger' | 'neutral' {
    if (status === 'approved') return 'success';
    if (status === 'pending') return 'warning';
    if (status === 'rejected' || status === 'cancelled') return 'danger';
    return 'neutral';
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
    return registration.supervisor_full_name || 'Chưa phân công';
  }

  isExecuting(registration: Registration): boolean {
    return registration.status === 'approved' && registration.academic_period_status === 'in_progress';
  }

  cancelRegistration(registrationId: string) {
    if (confirm('Bạn có chắc chắn muốn hủy đăng ký đề tài này không? Hành động này không thể hoàn tác.')) {
      this.isCancelling = registrationId;
      this.topicService.cancelRegistration(registrationId).subscribe({
        next: () => {
          this.isCancelling = null;
          this.loadRegistrations();
        },
        error: (err) => {
          this.isCancelling = null;
          alert(err.error?.message || 'Có lỗi xảy ra khi hủy đăng ký.');
        }
      });
    }
  }
}
