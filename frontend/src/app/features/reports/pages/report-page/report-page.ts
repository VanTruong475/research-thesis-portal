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
        <h1 class="text-3xl font-display font-bold text-champagne mb-2">Báo cáo Tài liệu</h1>
        <p class="text-muted">Nộp và quản lý các phiên bản tài liệu báo cáo của đề tài (DOCX, PDF).</p>
      </div>

      <!-- File Uploader -->
      <app-file-uploader (fileUpload)="onFileUpload($event)"></app-file-uploader>

      <!-- Lịch sử báo cáo -->
      <div class="mt-8">
        <app-report-history [reports]="reportService.reports()"></app-report-history>
      </div>
    </div>
  `
})
export class ReportPageComponent implements OnInit {
  reportService = inject(ReportService);

  ngOnInit() {
    // Lấy ID đăng ký từ URL (ví dụ: /reports/:id). Ở đây dùng mock reg-1.
    this.reportService.getReportsByRegistration('reg-1');
  }

  onFileUpload(file: File) {
    // Gọi service để upload
    this.reportService.uploadReport({
      registration_id: 'reg-1',
      file: file
    });
  }
}
