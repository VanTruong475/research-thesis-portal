import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FileUploaderComponent } from '../../components/file-uploader/file-uploader';
import { ReportHistoryComponent } from '../../components/report-history/report-history';
import { ReportService } from '../../services/report.service';
import { AuthService } from '../../../../core/services/auth';

@Component({
  selector: 'app-report-page',
  standalone: true,
  imports: [CommonModule, FileUploaderComponent, ReportHistoryComponent],
  template: `
    <div class="max-w-4xl mx-auto p-8">
      <div class="mb-8">
        <h1 class="text-3xl font-display font-bold text-heading mb-2">Báo cáo Tài liệu</h1>
        <p class="text-muted">Nộp và quản lý các phiên bản tài liệu báo cáo của đề tài (DOCX, PDF).</p>
      </div>

      <!-- File Uploader (chỉ sinh viên mới được nộp báo cáo) -->
      <app-file-uploader *ngIf="isStudent" (fileUpload)="onFileUpload($event)"></app-file-uploader>

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
  authService = inject(AuthService); // Inject AuthService để lấy thông tin user
  route = inject(ActivatedRoute);
  isLoading = false;
  topicId: string | null = null;

  // Getter kiểm tra xem người dùng có phải là sinh viên không
  get isStudent(): boolean {
    return this.authService.currentUser()?.role === 'student';
  }

  ngOnInit() {
    this.topicId = this.route.snapshot.paramMap.get('topicId');
    if (this.topicId) {
      this.loadReports();
    }
  }

  loadReports() {
    if (!this.topicId) return;
    this.isLoading = true;
    this.reportService.getReportsByTopic(this.topicId).subscribe({
      next: () => this.isLoading = false,
      error: () => this.isLoading = false
    });
  }

  onFileUpload(file: File) {
    if (!this.topicId) return;
    this.reportService.uploadReport(this.topicId, file).subscribe(() => {
      this.loadReports(); // Tải lại lịch sử sau khi upload thành công
    });
  }
}
