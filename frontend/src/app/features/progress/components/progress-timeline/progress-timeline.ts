import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressLog, ProgressCommentRequest } from '../../models/progress.model';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';
import { AuthService } from '../../../../core/services/auth';

@Component({
  selector: 'app-progress-timeline',
  standalone: true,
  imports: [CommonModule, StatusBadge],
  template: `
    <div class="relative pl-6 border-l border-primary-deep space-y-10">
      <!-- Vòng lặp hiển thị từng báo cáo -->
      <div *ngFor="let log of logs" class="relative">
        
        <!-- Chấm tròn trên timeline -->
        <div class="absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full bg-surface border-2 border-primary z-10 shadow-[0_0_8px_rgba(212,175,55,0.4)]"></div>
        
        <!-- Nội dung chính của thẻ -->
        <div class="ks-card mb-4 relative overflow-hidden group">
          <!-- Hiệu ứng viền (Hover sheen) -->
          <div class="absolute inset-0 border border-transparent group-hover:border-primary-pale/20 pointer-events-none transition-colors rounded-sm"></div>

          <!-- Header thẻ (Thời gian, người nộp) -->
          <div class="flex items-center justify-between mb-3 pb-3 border-b border-border-subtle">
            <div>
              <span class="text-sm font-medium text-heading">{{ log.submitted_by }}</span>
              <span class="text-xs text-muted ml-2">{{ log.submitted_at | date:'medium' }}</span>
            </div>
            <app-status-badge [type]="log.lecturer_comment ? 'success' : 'warning'">
              {{ log.lecturer_comment ? 'Đã phản hồi' : 'Chờ phản hồi' }}
            </app-status-badge>
          </div>
          
          <!-- Nội dung sinh viên báo cáo -->
          <div class="text-body font-sans mb-4 whitespace-pre-wrap">
            {{ log.content }}
          </div>

          <!-- Khu vực Giảng viên Comment -->
          <div *ngIf="log.lecturer_comment" class="mt-4 p-4 bg-surface-deep rounded border-l-2 border-secondary">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-mono uppercase tracking-wider text-secondary">Nhận xét của Giảng viên</span>
              <span class="text-xs text-muted">{{ log.commented_at | date:'short' }}</span>
            </div>
            <p class="text-sm text-heading italic">{{ log.lecturer_comment }}</p>
          </div>

          <!-- Khung nhập Comment (Chỉ hiển thị cho Giảng viên & khi chưa có comment) -->
          <div *ngIf="!log.lecturer_comment && canComment" class="mt-4 pt-4 border-t border-border-subtle">
            <textarea 
              #commentInput
              class="ks-input mb-3 min-h-[80px]" 
              placeholder="Nhập nhận xét của bạn cho báo cáo này..."
            ></textarea>
            <div class="flex justify-end">
              <button 
                class="ks-button ks-button-secondary py-2" 
                (click)="onCommentSubmit(log.id, commentInput.value); commentInput.value=''"
              >
                Gửi nhận xét
              </button>
            </div>
          </div>

        </div>
      </div>

      <!-- Trạng thái trống -->
      <div *ngIf="logs.length === 0" class="ks-card text-center py-12">
        <p class="text-muted">Chưa có báo cáo tiến độ nào được ghi nhận.</p>
      </div>
    </div>
  `
})
export class ProgressTimelineComponent {
  @Input() logs: ProgressLog[] = [];
  @Output() commentSubmit = new EventEmitter<{logId: string, request: ProgressCommentRequest}>();

  authService = inject(AuthService);

  // Logic: Kiểm tra xem user hiện tại có phải giảng viên/admin không để cho phép comment
  get canComment(): boolean {
    const user = this.authService.currentUser();
    return !!user && (user.role === 'lecturer' || user.role === 'admin');
  }

  onCommentSubmit(logId: string, comment: string) {
    if (!comment.trim()) return;
    this.commentSubmit.emit({
      logId,
      request: { comment: comment.trim() }
    });
  }
}
