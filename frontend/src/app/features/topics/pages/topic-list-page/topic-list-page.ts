import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { Registration, Topic, TopicStatus } from '../../models/topic.model';
import { TopicService } from '../../services/topic.service';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';
import { AuthService } from '../../../../core/services/auth';

type TopicFilterTab = 'pending_approval' | 'approved' | 'closed' | 'all';

@Component({
  selector: 'app-topic-list-page',
  standalone: true,
  imports: [CommonModule, StatusBadge],
  template: `
    <div class="p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div class="flex justify-between items-end mb-6">
        <div>
          <h1 class="text-3xl font-display font-bold text-heading uppercase tracking-wider">
            Danh Sách Đề Tài
          </h1>
          <p class="text-muted mt-2">{{ getTopicListSubtitle() }}</p>
        </div>
      </div>

      <div *ngIf="userRole === 'admin'" class="flex flex-wrap gap-2 mb-6">
        <button
          *ngFor="let tab of getTopicTabs()"
          type="button"
          class="px-4 py-2 rounded-sm border text-sm font-medium transition-colors"
          [ngClass]="selectedTopicTab === tab.key ? 'border-primary bg-primary/10 text-primary' : 'border-border-subtle text-muted hover:text-primary hover:border-primary/40'"
          (click)="selectTopicTab(tab.key)">
          {{ tab.label }}
          <span class="ml-2 text-xs opacity-70">{{ tab.count }}</span>
        </button>
      </div>

      <div *ngIf="isLoading" class="text-center py-12 text-primary">Đang tải dữ liệu...</div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6" *ngIf="!isLoading">
        <div *ngFor="let topic of getPaginatedTopics()" class="ks-card flex flex-col">
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
              <span class="font-medium text-body">{{ getCurrentStudents(topic) }} / {{ topic.max_students }}</span>
            </div>
          </div>

          <div *ngIf="userRole === 'student'" class="space-y-2">
            <div
              *ngIf="getEffectiveRegistrationForTopic(topic) as registration"
              class="rounded-sm border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-body">
              Bạn đã đăng ký đề tài này.
              <span class="font-medium text-primary">Trạng thái: {{ formatRegistrationStatus(registration.status) }}</span>
            </div>
            <div
              *ngIf="!getEffectiveRegistrationForTopic(topic) && hasEffectiveRegistrationInPeriod(topic)"
              class="rounded-sm border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-body">
              Bạn đã có đăng ký trong kỳ học này nên không thể đăng ký thêm đề tài khác.
            </div>
            <button
              [disabled]="isTopicRegistrationDisabled(topic)"
              (click)="registerTopic(topic.id)"
              class="ks-button ks-button-primary w-full disabled:opacity-50 disabled:cursor-not-allowed">
              {{ getStudentRegisterButtonLabel(topic) }}
            </button>
          </div>

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

        <div *ngIf="getFilteredTopics().length === 0" class="col-span-1 lg:col-span-2 text-center py-12 text-muted italic ks-card">
          {{ getEmptyTopicMessage() }}
        </div>
      </div>

      <div *ngIf="userRole === 'admin' && !isLoading && getTopicTotalPages() > 1" class="mt-6 flex items-center justify-center gap-3">
        <button
          type="button"
          class="ks-button ks-button-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          [disabled]="topicCurrentPage === 1"
          (click)="goToPreviousTopicPage()">
          ‹ Trước
        </button>
        <span class="text-sm text-muted">
          Trang {{ topicCurrentPage }} / {{ getTopicTotalPages() }} · Tổng {{ getFilteredTopics().length }} đề tài
        </span>
        <button
          type="button"
          class="ks-button ks-button-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          [disabled]="topicCurrentPage === getTopicTotalPages()"
          (click)="goToNextTopicPage()">
          Sau ›
        </button>
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
  selectedTopicTab: TopicFilterTab = 'pending_approval';
  topicCurrentPage = 1;
  readonly adminTopicPageSize = 4;

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
      forkJoin([
        this.topicService.fetchAvailableTopics(),
        this.topicService.fetchMyRegistrations()
      ]).subscribe({
        next: () => this.isLoading = false,
        error: () => this.isLoading = false
      });
    } else {
      this.topicService.fetchTopics(1, 100).subscribe({
        next: () => {
          this.isLoading = false;
          this.ensureValidTopicPage();
        },
        error: () => this.isLoading = false
      });
    }
  }

  getTopicListSubtitle(): string {
    if (this.userRole === 'admin') {
      return 'Xem, duyệt và quản lý các đề tài nghiên cứu trong hệ thống';
    }
    return 'Xem và đăng ký các đề tài nghiên cứu đang mở';
  }

  selectTopicTab(tab: TopicFilterTab) {
    this.selectedTopicTab = tab;
    this.topicCurrentPage = 1;
  }

  getTopicTabs(): Array<{ key: TopicFilterTab; label: string; count: number }> {
    const topics = this.topicService.topics();
    const labels: Record<TopicFilterTab, string> = {
      pending_approval: 'Chờ duyệt',
      approved: 'Đã duyệt',
      closed: 'Đã đóng',
      all: 'Tất cả'
    };

    return (['pending_approval', 'approved', 'closed', 'all'] as TopicFilterTab[]).map(key => ({
      key,
      label: labels[key],
      count: key === 'all' ? topics.length : topics.filter(topic => this.matchesTopicTab(topic, key)).length
    }));
  }

  getFilteredTopics(): Topic[] {
    const topics = this.topicService.topics();
    if (this.userRole !== 'admin' || this.selectedTopicTab === 'all') return topics;
    return topics.filter(topic => this.matchesTopicTab(topic, this.selectedTopicTab));
  }

  getPaginatedTopics(): Topic[] {
    const topics = this.getFilteredTopics();
    if (this.userRole !== 'admin') return topics;
    const startIndex = (this.topicCurrentPage - 1) * this.adminTopicPageSize;
    return topics.slice(startIndex, startIndex + this.adminTopicPageSize);
  }

  getTopicTotalPages(): number {
    return Math.max(1, Math.ceil(this.getFilteredTopics().length / this.adminTopicPageSize));
  }

  goToPreviousTopicPage() {
    if (this.topicCurrentPage <= 1) return;
    this.topicCurrentPage -= 1;
  }

  goToNextTopicPage() {
    if (this.topicCurrentPage >= this.getTopicTotalPages()) return;
    this.topicCurrentPage += 1;
  }

  ensureValidTopicPage() {
    if (this.topicCurrentPage > this.getTopicTotalPages()) {
      this.topicCurrentPage = this.getTopicTotalPages();
    }
  }

  getEmptyTopicMessage(): string {
    if (this.userRole === 'admin') {
      if (this.selectedTopicTab === 'pending_approval') return 'Không có đề tài nào đang chờ duyệt.';
      if (this.selectedTopicTab === 'approved') return 'Không có đề tài nào đã được duyệt.';
      if (this.selectedTopicTab === 'closed') return 'Không có đề tài nào đã đóng, từ chối hoặc hủy.';
      return 'Chưa có đề tài nào trong hệ thống.';
    }
    return 'Chưa có đề tài nào đang mở đăng ký. Vui lòng kiểm tra lại trong thời gian đăng ký.';
  }

  formatRegistrationStatus(status: Registration['status']): string {
    const statusMap: Record<Registration['status'], string> = {
      pending: 'Đang chờ duyệt',
      approved: 'Thành công',
      rejected: 'Bị từ chối',
      cancelled: 'Đã hủy',
      in_progress: 'Đang thực hiện',
      completed: 'Hoàn thành'
    };
    return statusMap[status] || status;
  }

  getEffectiveRegistrationForTopic(topic: Topic): Registration | undefined {
    return this.topicService.registrations().find(registration =>
      registration.topic_id === topic.id && this.isEffectiveRegistration(registration)
    );
  }

  hasEffectiveRegistrationInPeriod(topic: Topic): boolean {
    return this.topicService.registrations().some(registration =>
      registration.academic_period_id === topic.academic_period_id && this.isEffectiveRegistration(registration)
    );
  }

  isTopicRegistrationDisabled(topic: Topic): boolean {
    return topic.status !== 'approved'
      || this.getCurrentStudents(topic) >= topic.max_students
      || this.isRegistering
      || this.hasEffectiveRegistrationInPeriod(topic);
  }

  getStudentRegisterButtonLabel(topic: Topic): string {
    if (this.isRegistering) return 'Đang xử lý...';
    if (this.getEffectiveRegistrationForTopic(topic)) return 'Đã đăng ký đề tài này';
    if (this.hasEffectiveRegistrationInPeriod(topic)) return 'Đã có đăng ký trong kỳ này';
    if (topic.status !== 'approved') return 'Không thể đăng ký';
    if (this.getCurrentStudents(topic) >= topic.max_students) return 'Đề tài đã đủ số lượng';
    return 'Đăng ký đề tài này';
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

  getCurrentStudents(topic: Topic): number {
    return topic.current_students ?? topic.currentStudents ?? 0;
  }

  private isEffectiveRegistration(registration: Registration): boolean {
    return registration.status === 'pending' || registration.status === 'approved' || registration.status === 'in_progress';
  }

  private matchesTopicTab(topic: Topic, tab: TopicFilterTab): boolean {
    if (tab === 'pending_approval') return topic.status === 'pending_approval';
    if (tab === 'approved') return topic.status === 'approved';
    if (tab === 'closed') return topic.status === 'closed' || topic.status === 'rejected' || topic.status === 'cancelled' || topic.status === 'completed';
    return true;
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
