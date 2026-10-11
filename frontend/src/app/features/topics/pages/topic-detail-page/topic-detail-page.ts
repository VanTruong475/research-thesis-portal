import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';
import { Topic, TopicStatus, TopicType } from '../../models/topic.model';
import { TopicService } from '../../services/topic.service';

@Component({
  selector: 'app-topic-detail-page',
  standalone: true,
  imports: [CommonModule, RouterModule, StatusBadge],
  template: `
    <div class="p-8 max-w-5xl mx-auto h-full">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
        <div>
          <h1 class="text-3xl font-display font-bold text-heading uppercase tracking-wider">
            Chi Tiết Đề Tài
          </h1>
          <p class="text-muted mt-2">Xem thông tin đầy đủ của đề tài</p>
        </div>

        <a [routerLink]="getBackLink()" class="ks-button ks-button-secondary">
          ← Quay lại
        </a>
      </div>

      <div *ngIf="errorMessage" class="mb-4 p-4 bg-danger/10 border border-danger/20 text-danger text-sm rounded-sm">
        {{ errorMessage }}
      </div>

      <div *ngIf="isLoading" class="ks-card p-8 text-center text-primary font-medium">
        Đang tải chi tiết đề tài...
      </div>

      <div *ngIf="!isLoading && topic" class="space-y-6">
        <div class="ks-card p-6">
          <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div>
              <div class="text-xs font-mono text-muted mb-2">{{ topic.code }}</div>
              <h2 class="text-2xl font-display font-bold text-primary">{{ topic.title }}</h2>
            </div>
            <app-status-badge [type]="getStatusBadgeType(topic.status)">
              {{ formatTopicStatus(topic.status) }}
            </app-status-badge>
          </div>

          <div class="flex flex-wrap gap-3 mb-6">
            <span class="inline-flex items-center rounded-sm border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              {{ formatTopicType(topic.topic_type) }}
            </span>
            <span class="inline-flex items-center rounded-sm border border-border-subtle bg-surface-deep px-3 py-1 text-xs font-medium text-body">
              {{ getCurrentStudents(topic) }} / {{ topic.max_students }} sinh viên
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div class="rounded-sm border border-border-subtle bg-surface-deep p-4">
              <div class="text-muted mb-1">Mã giảng viên đề xuất</div>
              <div class="font-medium text-body break-all">{{ topic.proposed_by_id }}</div>
            </div>
            <div class="rounded-sm border border-border-subtle bg-surface-deep p-4">
              <div class="text-muted mb-1">Mã người duyệt</div>
              <div class="font-medium text-body break-all">{{ topic.approved_by_id || 'Chưa duyệt' }}</div>
            </div>
            <div class="rounded-sm border border-border-subtle bg-surface-deep p-4">
              <div class="text-muted mb-1">Mã kỳ học</div>
              <div class="font-medium text-body break-all">{{ topic.academic_period_id }}</div>
            </div>
            <div class="rounded-sm border border-border-subtle bg-surface-deep p-4">
              <div class="text-muted mb-1">Ngày tạo</div>
              <div class="font-medium text-body">{{ topic.created_at | date:'dd/MM/yyyy HH:mm' }}</div>
            </div>
          </div>
        </div>

        <div class="ks-card p-6">
          <h3 class="text-xl font-display font-bold text-heading mb-4">Mô tả đề tài</h3>
          <p class="text-body text-sm leading-7 whitespace-pre-line">{{ topic.description }}</p>
        </div>

        <div class="ks-card p-6">
          <h3 class="text-xl font-display font-bold text-heading mb-4">Yêu cầu đầu vào</h3>
          <p class="text-body text-sm leading-7 whitespace-pre-line">{{ topic.requirements || 'Chưa cập nhật yêu cầu đầu vào.' }}</p>
        </div>

        <div *ngIf="topic.rejection_reason" class="ks-card p-6 border-danger/20">
          <h3 class="text-xl font-display font-bold text-danger mb-4">Lý do từ chối</h3>
          <p class="text-body text-sm leading-7 whitespace-pre-line">{{ topic.rejection_reason }}</p>
        </div>
      </div>
    </div>
  `
})
export class TopicDetailPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private topicService = inject(TopicService);

  topic: Topic | null = null;
  isLoading = false;
  errorMessage = '';

  ngOnInit() {
    const topicId = this.route.snapshot.paramMap.get('topicId');
    if (!topicId) {
      this.errorMessage = 'Không xác định được đề tài cần xem.';
      return;
    }

    this.loadTopic(topicId);
  }

  loadTopic(topicId: string) {
    this.isLoading = true;
    this.errorMessage = '';
    this.topicService.getTopic(topicId).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.topic = res.data;
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = this.getTopicErrorMessage(err, 'Không thể tải chi tiết đề tài.');
      }
    });
  }

  getBackLink(): string {
    const role = this.authService.currentUser()?.role;
    if (role === 'lecturer') return '/app/topics/my-topics';
    return '/app/topics';
  }

  formatTopicType(topicType: TopicType): string {
    const typeMap: Record<TopicType, string> = {
      graduation_thesis: 'Khóa luận tốt nghiệp',
      scientific_research: 'Nghiên cứu khoa học'
    };
    return typeMap[topicType] || topicType;
  }

  formatTopicStatus(status: TopicStatus): string {
    const statusMap: Record<TopicStatus, string> = {
      pending_approval: 'Chờ duyệt',
      approved: 'Đã duyệt',
      rejected: 'Từ chối',
      closed: 'Đã đóng',
      cancelled: 'Đã hủy',
      completed: 'Hoàn thành'
    };
    return statusMap[status] || status;
  }

  getStatusBadgeType(status: TopicStatus): 'success' | 'warning' | 'danger' | 'neutral' {
    if (status === 'approved') return 'success';
    if (status === 'pending_approval') return 'warning';
    if (status === 'rejected' || status === 'cancelled') return 'danger';
    return 'neutral';
  }

  getCurrentStudents(topic: Topic): number {
    return topic.current_students ?? topic.currentStudents ?? 0;
  }

  private getTopicErrorMessage(err: any, fallbackMessage: string): string {
    const code = err.error?.error?.code;
    if (err.status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
    if (err.status === 403 || code === 'PERMISSION_DENIED') return 'Bạn không có quyền xem đề tài này.';
    if (code === 'TOPIC_NOT_FOUND' || err.status === 404) return 'Không tìm thấy đề tài cần xem.';
    return err.error?.message || fallbackMessage;
  }
}
