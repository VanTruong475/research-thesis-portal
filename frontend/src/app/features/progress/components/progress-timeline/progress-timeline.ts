import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProgressLog, AddTeacherCommentRequest } from '../../models/progress.model';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';
import { AuthService } from '../../../../core/services/auth';

@Component({
  selector: 'app-progress-timeline',
  standalone: true,
  imports: [CommonModule, StatusBadge, DatePipe, FormsModule],
  template: `
    <div class="relative pl-6 border-l border-primary-deep space-y-10">
      <!-- Vòng lặp hiển thị từng báo cáo tiến độ -->
      <div *ngFor="let log of logs; let idx = index" class="relative">
        
        <!-- Chấm tròn trên timeline biểu diễn mốc thời gian -->
        <div class="absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full bg-surface border-2 border-primary z-10 shadow-[0_0_8px_rgba(212,175,55,0.4)]"></div>
        
        <!-- Nội dung thẻ báo cáo tiến độ -->
        <div class="ks-card mb-4 relative overflow-hidden group">
          <!-- Hiệu ứng viền phát sáng nhẹ khi hover -->
          <div class="absolute inset-0 border border-transparent group-hover:border-primary-pale/20 pointer-events-none transition-colors rounded-sm"></div>

          <!-- Header thẻ (Thời gian nộp & Trạng thái nhận xét) -->
          <div class="flex items-center justify-between mb-3 pb-3 border-b border-border-subtle">
            <div>
              <span class="text-sm font-semibold text-heading">Báo cáo tuần #{{ logs.length - idx }}</span>
              <span class="text-xs text-muted ml-3">Nộp lúc: {{ log.submitted_at | date:'dd/MM/yyyy HH:mm' }}</span>
            </div>
            
            <!-- Badge trạng thái: Đã có nhận xét / Đang chờ GVHD -->
            <app-status-badge [type]="log.teacher_comment ? 'success' : 'warning'">
              {{ log.teacher_comment ? 'Đã nhận xét' : 'Chờ GVHD nhận xét' }}
            </app-status-badge>
          </div>
          
          <!-- Nội dung chi tiết do Sinh viên nộp -->
          <div class="text-body font-sans mb-4 whitespace-pre-wrap leading-relaxed text-sm bg-surface-deep/40 p-3 rounded-sm border border-border-subtle/50">
            {{ log.content }}
          </div>

          <!-- Khu vực hiển thị Nhận xét của Giảng viên (nếu đã có) -->
          <div *ngIf="log.teacher_comment && editingLogId !== log.id" class="mt-4 p-4 bg-surface-deep rounded border-l-2 border-secondary">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-mono uppercase tracking-wider text-secondary font-bold">Ý kiến phản hồi từ GVHD</span>
              <div class="flex items-center gap-3">
                <span class="text-xs text-muted">{{ log.commented_at | date:'dd/MM/yyyy HH:mm' }}</span>
                <!-- Nút cho phép giảng viên chỉnh sửa lại nhận xét của mình -->
                <button 
                  *ngIf="canComment" 
                  type="button" 
                  (click)="startEditingComment(log)"
                  class="text-xs text-primary hover:underline font-medium">
                  Sửa nhận xét
                </button>
              </div>
            </div>
            <p class="text-sm text-heading italic">{{ log.teacher_comment }}</p>
          </div>

          <!-- Khung nhập / sửa nhận xét dành riêng cho Giảng viên -->
          <div *ngIf="canComment && (!log.teacher_comment || editingLogId === log.id)" class="mt-4 pt-4 border-t border-border-subtle">
            <label class="ks-label text-xs">
              {{ editingLogId === log.id ? 'Chỉnh sửa nhận xét góp ý:' : 'Nhận xét và hướng dẫn cho sinh viên:' }}
            </label>
            
            <textarea 
              [(ngModel)]="commentDrafts[log.id]"
              class="ks-input mb-2 min-h-[80px] text-sm" 
              placeholder="Nhập góp ý, đánh giá công việc hoặc yêu cầu chỉnh sửa..."
            ></textarea>

            <!-- Báo lỗi nếu gõ dưới 2 ký tự -->
            <p *ngIf="commentDrafts[log.id] && commentDrafts[log.id].trim().length < 2" class="text-xs text-danger mb-2">
              Nhận xét cần tối thiểu 2 ký tự.
            </p>

            <div class="flex justify-end gap-2">
              <!-- Nút hủy nếu đang ở chế độ sửa -->
              <button 
                *ngIf="editingLogId === log.id" 
                type="button" 
                class="ks-button ks-button-secondary py-1.5 px-3 text-xs"
                (click)="cancelEditing()">
                Hủy
              </button>

              <!-- Nút gửi nhận xét -->
              <button 
                type="button"
                class="ks-button ks-button-primary py-1.5 px-4 text-xs disabled:opacity-50" 
                [disabled]="!commentDrafts[log.id] || commentDrafts[log.id].trim().length < 2 || submittingLogId === log.id"
                (click)="submitComment(log.id)"
              >
                {{ submittingLogId === log.id ? 'Đang gửi...' : (editingLogId === log.id ? 'Cập nhật nhận xét' : 'Gửi nhận xét') }}
              </button>
            </div>
          </div>

        </div>
      </div>

      <!-- Trạng thái khi chưa có báo cáo tiến độ nào -->
      <div *ngIf="logs.length === 0" class="ks-card text-center py-12">
        <p class="text-muted">Chưa có bản ghi tiến độ nào được nộp cho đề tài này.</p>
      </div>
    </div>
  `
})
export class ProgressTimelineComponent {
  @Input() logs: ProgressLog[] = [];
  @Output() commentSubmit = new EventEmitter<{logId: string, request: AddTeacherCommentRequest}>();

  authService = inject(AuthService);

  // Lưu trữ nội dung nháp của từng log (key là logId)
  commentDrafts: { [logId: string]: string } = {};

  // Lưu ID của log đang được chỉnh sửa nhận xét
  editingLogId: string | null = null;

  // Lưu ID của log đang được gửi request lên server (để hiển thị loading)
  submittingLogId: string | null = null;

  // Kiểm tra người dùng hiện tại có phải là giảng viên không
  get canComment(): boolean {
    const user = this.authService.currentUser();
    return !!user && user.role === 'lecturer';
  }

  // Bắt đầu chỉnh sửa nhận xét đã có
  startEditingComment(log: ProgressLog) {
    this.editingLogId = log.id;
    this.commentDrafts[log.id] = log.teacher_comment || '';
  }

  // Hủy chỉnh sửa
  cancelEditing() {
    this.editingLogId = null;
  }

  // Gửi nhận xét lên component cha
  submitComment(logId: string) {
    const text = this.commentDrafts[logId]?.trim();
    if (!text || text.length < 2) return;

    this.submittingLogId = logId;
    this.commentSubmit.emit({
      logId,
      request: { teacher_comment: text }
    });

    // Reset trạng thái chỉnh sửa sau khi phát sự kiện
    this.editingLogId = null;
    this.submittingLogId = null;
  }
}

