import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TopicStatus } from '../../models/topic.model';
import { TopicService } from '../../services/topic.service';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';
import { AuthService } from '../../../../core/services/auth';

@Component({
  selector: 'app-topic-list-page',
  standalone: true,
  imports: [CommonModule, StatusBadge],
  template: `
    <div class="p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div class="flex justify-between items-end mb-8">
        <div>
          <h1 class="text-3xl font-display font-bold text-heading uppercase tracking-wider">
            Danh Sách Đề Tài
          </h1>
          <p class="text-muted mt-2">Xem và đăng ký các đề tài nghiên cứu đang mở</p>
        </div>
      </div>

      <div *ngIf="isLoading" class="text-center py-12 text-primary">Đang tải dữ liệu...</div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6" *ngIf="!isLoading">
        <div *ngFor="let topic of topicService.topics()" class="ks-card flex flex-col">
          <div class="flex justify-between items-start mb-4">
            <div>
              <span class="text-xs font-mono text-muted mb-1 block">{{ topic.code }}</span>
              <h2 class="text-xl font-display font-bold text-primary">{{ topic.title }}</h2>
            </div>
            <app-status-badge [type]="getStatusBadgeType(topic.status)">
              {{ formatTopicStatus(topic.status) }}
            </app-status-badge>
          </div>
          
          <p class="text-body text-sm mb-6 flex-1 line-clamp-3">{{ topic.description }}</p>
          
          <div class="space-y-3 bg-surface-deep p-4 rounded-sm border border-border-subtle mb-6">
            <div class="flex justify-between text-sm">
              <span class="text-muted">Giảng viên hướng dẫn:</span>
              <span class="font-medium text-heading">{{ topic.lecturerName || 'Đang cập nhật' }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-muted">Số lượng sinh viên:</span>
              <span class="font-medium text-body">{{ topic.currentStudents || 0 }} / {{ topic.max_students }}</span>
            </div>
          </div>
          
          <button 
            *ngIf="userRole === 'student'"
            [disabled]="topic.status !== 'approved' || (topic.currentStudents || 0) >= topic.max_students || isRegistering"
            (click)="registerTopic(topic.id)"
            class="ks-button ks-button-primary w-full disabled:opacity-50 disabled:cursor-not-allowed">
            {{ topic.status !== 'approved' ? 'Không thể đăng ký' : (isRegistering ? 'Đang xử lý...' : 'Đăng ký đề tài này') }}
          </button>

          <div *ngIf="userRole === 'admin' && topic.status === 'pending_approval'" class="flex gap-3 mt-3">
            <button
              [disabled]="isProcessingTopic === topic.id"
              (click)="approveTopic(topic.id)"
              class="ks-button ks-button-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed">
              {{ isProcessingTopic === topic.id ? 'Đang duyệt...' : 'Duyệt' }}
            </button>
            <button
              [disabled]="isProcessingTopic === topic.id"
              (click)="rejectTopic(topic.id)"
              class="ks-button ks-button-secondary flex-1 disabled:opacity-50 disabled:cursor-not-allowed">
              Từ chối
            </button>
          </div>
        </div>
        
        <div *ngIf="topicService.topics().length === 0" class="col-span-1 lg:col-span-2 text-center py-12 text-muted italic ks-card">
          Chưa có đề tài nào được mở đăng ký.
        </div>
      </div>
    </div>
  `
})
export class TopicListPageComponent implements OnInit {
  topicService = inject(TopicService);
  authService = inject(AuthService);
  
  userRole: string = 'student';
  isLoading = false;
  isRegistering = false;
  isProcessingTopic: string | null = null;

  ngOnInit() {
    const user = this.authService.currentUser();
    if (user) {
      this.userRole = user.role;
    }
    
    this.loadTopics();
  }

  loadTopics() {
    this.isLoading = true;
    if (this.userRole === 'student') {
      this.topicService.fetchAvailableTopics().subscribe({
        next: () => this.isLoading = false,
        error: () => this.isLoading = false
      });
    } else {
      this.topicService.fetchTopics().subscribe({
        next: () => this.isLoading = false,
        error: () => this.isLoading = false
      });
    }
  }

  registerTopic(topicId: string) {
    if (confirm('Bạn có chắc chắn muốn đăng ký đề tài này?')) {
      this.isRegistering = true;
      this.topicService.createRegistration({ topic_id: topicId }).subscribe({
        next: () => {
          this.isRegistering = false;
          alert('Đăng ký đề tài thành công! Vui lòng chờ Giảng viên duyệt.');
          this.loadTopics();
        },
        error: (err) => {
          this.isRegistering = false;
          alert(err.error?.message || 'Có lỗi xảy ra khi đăng ký đề tài.');
        }
      });
    }
  }

  approveTopic(topicId: string) {
    if (!confirm('Bạn có chắc chắn muốn duyệt đề tài này?')) return;

    this.isProcessingTopic = topicId;
    this.topicService.approveTopic(topicId).subscribe({
      next: () => {
        this.isProcessingTopic = null;
        alert('Duyệt đề tài thành công.');
        this.loadTopics();
      },
      error: (err) => {
        this.isProcessingTopic = null;
        alert(this.getTopicActionErrorMessage(err));
      }
    });
  }

  rejectTopic(topicId: string) {
    const reason = prompt('Vui lòng nhập lý do từ chối đề tài:');
    if (reason === null) return;
    if (!reason.trim()) {
      alert('Lý do từ chối không được để trống.');
      return;
    }

    this.isProcessingTopic = topicId;
    this.topicService.rejectTopic(topicId, { rejection_reason: reason.trim() }).subscribe({
      next: () => {
        this.isProcessingTopic = null;
        alert('Từ chối đề tài thành công.');
        this.loadTopics();
      },
      error: (err) => {
        this.isProcessingTopic = null;
        alert(this.getTopicActionErrorMessage(err));
      }
    });
  }

  formatTopicStatus(status: TopicStatus): string {
    const statusMap: Record<TopicStatus, string> = {
      pending_approval: 'Chờ duyệt',
      approved: 'Đã duyệt',
      rejected: 'Từ chối',
      closed: 'Đã đóng',
      cancelled: 'Đã hủy',
      completed: 'Không dùng (cũ)'
    };
    return statusMap[status] || status;
  }

  getStatusBadgeType(status: TopicStatus): 'success' | 'warning' | 'danger' | 'neutral' {
    if (status === 'approved') return 'success';
    if (status === 'pending_approval') return 'warning';
    if (status === 'rejected' || status === 'cancelled') return 'danger';
    return 'neutral';
  }

  private getTopicActionErrorMessage(err: any): string {
    const code = err.error?.error?.code;
    if (err.status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
    if (err.status === 403 || code === 'PERMISSION_DENIED') return 'Bạn không có quyền thực hiện thao tác này.';
    if (code === 'TOPIC_INVALID_STATUS_TRANSITION') return 'Trạng thái đề tài hiện tại không cho phép thao tác này.';
    if (code === 'TOPIC_REJECTION_REASON_REQUIRED') return 'Vui lòng nhập lý do từ chối đề tài.';
    if (err.status === 422 || code === 'VALIDATION_ERROR') return 'Dữ liệu gửi lên không hợp lệ. Vui lòng kiểm tra lại.';
    return err.error?.message || 'Có lỗi xảy ra khi xử lý đề tài.';
  }
}
