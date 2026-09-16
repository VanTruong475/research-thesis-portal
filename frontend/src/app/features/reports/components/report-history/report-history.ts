import { Component, Input, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReportResponse } from '../../models/report.model';
import { ReportService } from '../../services/report.service';

@Component({
  selector: 'app-report-history',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="ks-card overflow-hidden">
      <div class="ks-card-header">
        <h3 class="ks-card-title">Lịch sử Phiên bản Báo cáo</h3>
      </div>
      
      <!-- Hiển thị lỗi nếu tải file thất bại -->
      <div *ngIf="downloadError" class="mx-6 mt-4 p-3 bg-danger/10 border border-danger/20 text-danger text-sm rounded-sm">
        {{ downloadError }}
      </div>

      <!-- Bảng hiển thị danh sách các phiên bản báo cáo -->
      <div class="overflow-x-auto">
        <table class="w-full text-left font-sans text-sm">
          <thead class="text-xs text-muted uppercase bg-surface-deep border-b border-border-subtle">
            <tr>
              <th scope="col" class="px-6 py-4 font-medium">Phiên bản</th>
              <th scope="col" class="px-6 py-4 font-medium">Tên file</th>
              <th scope="col" class="px-6 py-4 font-medium">Dung lượng</th>
              <th scope="col" class="px-6 py-4 font-medium">Thời gian nộp</th>
              <th scope="col" class="px-6 py-4 text-right font-medium">Hành động</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-subtle">
            <tr *ngFor="let report of reports; let first = first" class="hover:bg-raised-surface/50 transition-colors">
              <!-- Cột 1: Hiển thị version (ví dụ: v1.0, v2.0; phiên bản mới nhất có chấm xanh) -->
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2 py-1 rounded bg-surface-deep text-primary text-xs font-mono border border-primary/20">
                  v{{ report.version }}.0
                  <span *ngIf="first" title="Phiên bản mới nhất" class="ml-2 w-2 h-2 rounded-full bg-success"></span>
                </span>
              </td>

              <!-- Cột 2: Tên file gốc -->
              <td class="px-6 py-4 font-medium text-heading">
                {{ report.file_name }}
              </td>

              <!-- Cột 3: Dung lượng file đã format đẹp -->
              <td class="px-6 py-4 text-body">
                {{ formatBytes(report.file_size) }}
              </td>

              <!-- Cột 4: Ngày giờ nộp file -->
              <td class="px-6 py-4 text-muted">
                {{ report.submitted_at | date:'dd/MM/yyyy HH:mm' }}
              </td>

              <!-- Cột 5: Nút tải file gọi API có xác thực quyền -->
              <td class="px-6 py-4 text-right">
                <button 
                  type="button" 
                  (click)="download(report)" 
                  [disabled]="downloadingReportId === report.id"
                  class="text-primary hover:text-primary-pale hover:underline font-medium inline-flex items-center disabled:opacity-50">
                  <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  {{ downloadingReportId === report.id ? 'Đang tải...' : 'Tải xuống' }}
                </button>
              </td>
            </tr>
            
            <!-- Hiển thị khi chưa có báo cáo nào -->
            <tr *ngIf="reports.length === 0">
              <td colspan="5" class="px-6 py-12 text-center text-muted">
                Chưa có báo cáo nào được tải lên.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class ReportHistoryComponent {
  @Input() reports: ReportResponse[] = [];

  // Inject ReportService để gọi API download
  private reportService = inject(ReportService);

  // Biến lưu ID của file đang được tải (để hiển thị loading cho đúng dòng)
  downloadingReportId: string | null = null;
  downloadError: string | null = null;

  /**
   * Xử lý sự kiện khi người dùng bấm nút "Tải xuống":
   * 1. Gửi request download kèm token
   * 2. Nhận binary Blob từ server
   * 3. Kích hoạt trình duyệt lưu file với tên gốc
   */
  download(report: ReportResponse) {
    this.downloadingReportId = report.id;
    this.downloadError = null;

    this.reportService.downloadReport(report.id).subscribe({
      next: (blob: Blob) => {
        this.downloadingReportId = null;
        // Gọi hàm tiện ích để tải file về máy
        this.reportService.triggerFileDownload(blob, report.file_name);
      },
      error: (err) => {
        this.downloadingReportId = null;
        this.downloadError = err?.error?.message || 'Không thể tải file báo cáo. Bạn có thể không có quyền hoặc file không tồn tại.';
      }
    });
  }

  // Chuyển đổi bytes thành KB, MB dễ đọc
  formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }
}

