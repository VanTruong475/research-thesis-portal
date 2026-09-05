import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TopicService } from '../../services/topic.service';
import { AuthService } from '../../../../core/services/auth';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';
import { Registration, RegistrationStatus } from '../../models/topic.model';

@Component({
  selector: 'app-review-registration-page',
  standalone: true,
  imports: [CommonModule, RouterModule, StatusBadge],
  template: `
    <div class="p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div class="flex justify-between items-end mb-8">
        <div>
          <h1 class="text-3xl font-display font-bold text-heading uppercase tracking-wider">
            Duyệt Đăng Ký Đề Tài
          </h1>
          <p class="text-muted mt-2">Xem xét và phản hồi yêu cầu đăng ký của sinh viên</p>
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
                <th class="p-4 font-sans font-medium text-muted text-sm border-b border-border-subtle">Sinh viên</th>
                <th class="p-4 font-sans font-medium text-muted text-sm border-b border-border-subtle">Đề tài</th>
                <th class="p-4 font-sans font-medium text-muted text-sm border-b border-border-subtle">Trạng thái</th>
                <th class="p-4 font-sans font-medium text-muted text-sm border-b border-border-subtle text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border-subtle">
              <tr *ngFor="let reg of topicService.registrations()" class="hover:bg-surface-raised transition-colors align-top">
                <td class="p-4 text-sm font-mono text-muted">{{ (reg.registered_at || reg.created_at) | date:'dd/MM/yyyy' }}</td>
                <td class="p-4">
                  <div class="font-medium text-body">{{ getStudentLabel(reg) }}</div>
                  <div class="text-xs text-muted font-mono mt-1">{{ reg.student_institutional_code || reg.student_id }}</div>
                </td>
                <td class="p-4 text-sm text-body max-w-sm">
                  <div class="font-medium truncate">{{ getTopicLabel(reg) }}</div>
                  <div class="text-xs text-muted mt-1">Kỳ: {{ getAcademicPeriodLabel(reg) }}</div>
                  <div *ngIf="reg.supervisor_full_name" class="text-xs text-muted mt-1">GVHD: {{ getSupervisorLabel(reg) }}</div>
                  <div *ngIf="reg.review_reason && (reg.status === 'rejected' || reg.status === 'cancelled')" class="text-xs text-danger mt-2">
                    Lý do: {{ reg.review_reason }}
                  </div>
                </td>
                <td class="p-4">
                  <app-status-badge [type]="getRegistrationStatusBadgeType(reg.status)">
                    {{ formatRegistrationStatus(reg.status) }}
                  </app-status-badge>
                </td>
                <td class="p-4 text-right">
                  <div *ngIf="reg.status === 'pending'" class="flex justify-end gap-3">
                    <button
                      [disabled]="isProcessing === reg.id"
                      (click)="approveRegistration(reg.id)"
                      class="px-4 py-1.5 bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-dark-ink transition-colors rounded-sm text-sm font-medium disabled:opacity-50">
                      Duyệt
                    </button>
                    <button
                      [disabled]="isProcessing === reg.id"
                      (click)="rejectRegistration(reg.id)"
                      class="px-4 py-1.5 bg-transparent text-danger border border-border-subtle hover:border-danger transition-colors rounded-sm text-sm font-medium disabled:opacity-50">
                      Từ chối
                    </button>
                  </div>

                  <div *ngIf="reg.status === 'approved'" class="flex justify-end gap-3">
                    <a [routerLink]="['/app/registrations', reg.id, 'progress']" class="text-sm font-medium text-primary hover:underline" title="Theo dõi tiến độ">Tiến độ</a>
                    <a [routerLink]="['/app/registrations', reg.id, 'evaluation']" class="text-sm font-medium text-primary hover:underline" title="Chấm điểm">Chấm điểm</a>
                  </div>

                  <div *ngIf="reg.status !== 'pending' && reg.status !== 'approved'" class="text-muted text-sm italic">
                    Không có thao tác
                  </div>
                </td>
              </tr>
              
              <tr *ngIf="topicService.registrations().length === 0 && !isLoading">
                <td colspan="5" class="p-8 text-center text-muted italic">
                  Không có yêu cầu đăng ký nào cần duyệt.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class ReviewRegistrationPageComponent implements OnInit {
  topicService = inject(TopicService);
  authService = inject(AuthService);
  
  isLoading = false;
  isProcessing: string | null = null;

  ngOnInit() {
    this.loadRegistrations();
  }

  loadRegistrations() {
    const user = this.authService.currentUser();
    if (user && user.role === 'lecturer') {
      this.isLoading = true;
      this.topicService.fetchLecturerRegistrations().subscribe({
        next: () => this.isLoading = false,
        error: () => this.isLoading = false
      });
    }
  }

  formatRegistrationStatus(status: RegistrationStatus): string {
    const statusMap: Record<RegistrationStatus, string> = {
      pending: 'Đang chờ',
      approved: 'Đã duyệt',
      rejected: 'Từ chối',
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

  getStudentLabel(registration: Registration): string {
    return registration.student_full_name || registration.studentName || 'Chưa cập nhật';
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
    const name = registration.supervisor_full_name || 'Chưa phân công';
    return registration.supervisor_institutional_code ? `${registration.supervisor_institutional_code} - ${name}` : name;
  }

  approveRegistration(registrationId: string) {
    if (confirm('Bạn có chắc chắn muốn duyệt cho sinh viên này thực hiện đề tài?')) {
      this.isProcessing = registrationId;
      this.topicService.approveRegistration(registrationId).subscribe({
        next: () => {
          this.isProcessing = null;
          this.loadRegistrations();
        },
        error: (err) => {
          this.isProcessing = null;
          alert(err.error?.message || 'Có lỗi xảy ra khi duyệt.');
        }
      });
    }
  }

  rejectRegistration(registrationId: string) {
    const reason = prompt('Vui lòng nhập lý do từ chối (bắt buộc):');
    if (reason !== null) {
      if (!reason.trim()) {
        alert('Lý do từ chối không được để trống.');
        return;
      }
      this.isProcessing = registrationId;
      this.topicService.rejectRegistration(registrationId, { review_reason: reason }).subscribe({
        next: () => {
          this.isProcessing = null;
          this.loadRegistrations();
        },
        error: (err) => {
          this.isProcessing = null;
          alert(err.error?.message || 'Có lỗi xảy ra khi từ chối.');
        }
      });
    }
  }
}
