import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressTimelineComponent } from '../../components/progress-timeline/progress-timeline';
import { ProgressFormComponent } from '../../components/progress-form/progress-form';
import { ProgressService } from '../../services/progress';
import { ProgressSubmitRequest, ProgressCommentRequest } from '../../models/progress.model';

@Component({
  selector: 'app-progress-list-page',
  standalone: true,
  imports: [CommonModule, ProgressTimelineComponent, ProgressFormComponent],
  template: `
    <div class="max-w-4xl mx-auto">
      <div class="mb-8">
        <h1 class="text-3xl font-display font-bold text-heading mb-2">Tiến độ Hướng dẫn</h1>
        <p class="text-muted">Theo dõi và báo cáo tiến độ thực hiện đề tài nghiên cứu.</p>
      </div>

      <!-- Form nộp báo cáo -->
      <app-progress-form 
        (submitProgress)="onProgressSubmit($event)">
      </app-progress-form>

      <!-- Danh sách dòng thời gian tiến độ -->
      <div class="mt-12 relative">
        <h2 class="text-xl font-display font-medium text-heading mb-6">Lịch sử Báo cáo</h2>
        
        <div *ngIf="isLoading" class="text-primary py-4">Đang tải dữ liệu tiến độ...</div>

        <app-progress-timeline 
          *ngIf="!isLoading"
          [logs]="progressService.progressLogs()"
          (commentSubmit)="onCommentSubmit($event.logId, $event.request)">
        </app-progress-timeline>
      </div>
    </div>
  `
})
export class ProgressListPageComponent implements OnInit {
  progressService = inject(ProgressService);
  isLoading = false;

  // Giả lập một UUID đăng ký hợp lệ để hiển thị UI
  // Trong thực tế, ID này sẽ được lấy từ Route Parameter (vd: /progress/:id)
  private readonly DUMMY_REG_ID = '123e4567-e89b-12d3-a456-426614174000';

  ngOnInit() {
    this.isLoading = true;
    this.progressService.getLogsByRegistration(this.DUMMY_REG_ID).subscribe({
      next: () => this.isLoading = false,
      error: () => this.isLoading = false
    });
  }

  onProgressSubmit(req: ProgressSubmitRequest) {
    // Override reg_id bằng dummy ID cho test
    const requestWithId = { ...req, registration_id: this.DUMMY_REG_ID };
    this.progressService.submitProgress(requestWithId).subscribe();
  }

  onCommentSubmit(logId: string, req: ProgressCommentRequest) {
    this.progressService.commentOnProgress(logId, req).subscribe();
  }
}
