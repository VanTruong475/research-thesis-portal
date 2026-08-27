import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileUploaderComponent } from '../../components/file-uploader/file-uploader';
import { ReportHistoryComponent } from '../../components/report-history/report-history';
import { ReportService } from '../../services/report';

@Component({
  selector: 'app-report-page',
  standalone: true,
  imports: [CommonModule, FileUploaderComponent, ReportHistoryComponent],
  template: `
    <div class="max-w-4xl mx-auto">
      <div class="mb-8">
        <h1 class="text-3xl font-display font-bold text-heading mb-2">Báo cáo Tài liệu</h1>
        <p class="text-muted">Nộp và quản lý các phiên bản tài liệu báo cáo của đề tài (DOCX, PDF).</p>
      </div>

      <!-- File Uploader -->
      <app-file-uploader (fileUpload)="onFileUpload($event)"></app-file-uploader>

      <!-- Lịch sử báo cáo -->
      <div class="mt-8 relative">
        <div *ngIf="isLoading" class="text-primary py-4">Đang tải lịch sử báo cáo...</div>
        
        <app-report-history 
          *ngIf="!isLoading"
          [reports]="reportService.reports()">
        </app-report-history>
      </div>
    </div>
  `
})
export class ReportPageComponent implements OnInit {
  reportService = inject(ReportService);
  isLoading = false;

  // Giả lập một UUID đề tài hợp lệ để hiển thị UI
  // Trong thực tế, ID này sẽ được lấy từ Route Parameter (vd: /reports/:topicId)
  private readonly DUMMY_TOPIC_ID = '123e4567-e89b-12d3-a456-426614174000';

  ngOnInit() {
    this.isLoading = true;
    this.reportService.getReportsByTopic(this.DUMMY_TOPIC_ID).subscribe({
      next: () => this.isLoading = false,
      error: () => this.isLoading = false
    });
  }

  onFileUpload(file: File) {
    this.reportService.uploadReport({
      topic_id: this.DUMMY_TOPIC_ID,
      file: file
    }).subscribe();
  }
}
