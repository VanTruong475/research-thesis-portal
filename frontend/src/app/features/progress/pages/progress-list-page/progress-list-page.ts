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

      <!-- Form nộp báo cáo (Hiển thị form nhưng component con sẽ tự check quyền student để disable) -->
      <app-progress-form 
        (submitProgress)="onProgressSubmit($event)">
      </app-progress-form>

      <!-- Danh sách dòng thời gian tiến độ -->
      <div class="mt-12">
        <h2 class="text-xl font-display font-medium text-heading mb-6">Lịch sử Báo cáo</h2>
        <app-progress-timeline 
          [logs]="progressService.progressLogs()"
          (commentSubmit)="onCommentSubmit($event.logId, $event.request)">
        </app-progress-timeline>
      </div>
    </div>
  `
})
export class ProgressListPageComponent implements OnInit {
  progressService = inject(ProgressService);

  ngOnInit() {
    // Thực tế sẽ lấy ID từ URL (vd: /progress/:id) rồi gọi service
    // Ở đây dùng mock data đã có sẵn trong service
    this.progressService.getLogsByRegistration('reg-1');
  }

  onProgressSubmit(req: ProgressSubmitRequest) {
    this.progressService.submitProgress(req);
  }

  onCommentSubmit(logId: string, req: ProgressCommentRequest) {
    this.progressService.commentOnProgress(logId, req);
  }
}
