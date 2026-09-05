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
        <p class="text-muted">Nộp và quản lý các phiên bản tài liệu báo cáo theo đơn đăng ký thực hiện đề tài.</p>
      </div>

      <div *ngIf="errorMessage" class="mb-4 p-3 bg-danger/10 border border-danger/20 text-danger text-sm rounded-sm">
        {{ errorMessage }}
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
  errorMessage = '';
  registrationId: string | null = null;

  // Getter kiểm tra xem người dùng có phải là sinh viên không
  get isStudent(): boolean {
    return this.authService.currentUser()?.role === 'student';
  }

  ngOnInit() {
    this.registrationId = this.route.snapshot.paramMap.get('registrationId');
    if (this.registrationId) {
      this.loadReports();
    } else {
      this.errorMessage = 'Không tìm thấy mã đăng ký để tải báo cáo.';
    }
  }

  loadReports() {
    if (!this.registrationId) return;
    this.isLoading = true;
    this.errorMessage = '';
    this.reportService.getReportsByRegistration(this.registrationId).subscribe({
      next: () => this.isLoading = false,
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = this.getErrorMessage(err, 'Không thể tải lịch sử báo cáo.');
      }
    });
  }

  onFileUpload(file: File) {
    if (!this.registrationId) return;
    this.errorMessage = '';
    this.reportService.uploadReport(this.registrationId, file).subscribe({
      next: () => this.loadReports(),
      error: (err) => {
        this.errorMessage = this.getErrorMessage(err, 'Không thể nộp báo cáo.');
      }
    });
  }

  private getErrorMessage(err: any, fallback: string): string {
    return err?.error?.message || err?.error?.error?.message || fallback;
  }
}
