import { Component, Input } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReportResponse } from '../../models/report.model';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-report-history',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="ks-card overflow-hidden">
      <div class="ks-card-header">
        <h3 class="ks-card-title">Lịch sử Phiên bản Báo cáo</h3>
      </div>
      
      <!-- Bảng hiển thị (Table) -->
      <div class="overflow-x-auto">
        <table class="w-full text-left font-sans text-sm">
          <thead class="text-xs text-muted uppercase bg-surface-deep border-b border-border-subtle">
            <tr>
              <th scope="col" class="px-6 py-4 font-medium">Phiên bản</th>
              <th scope="col" class="px-6 py-4 font-medium">Tên file</th>
              <th scope="col" class="px-6 py-4 font-medium">Dung lượng</th>
              <th scope="col" class="px-6 py-4 font-medium">Thời gian</th>
              <th scope="col" class="px-6 py-4 text-right font-medium">Hành động</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-subtle">
            <tr *ngFor="let report of reports; let first = first" class="hover:bg-raised-surface/50 transition-colors">
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2 py-1 rounded bg-surface-deep text-primary text-xs font-mono border border-primary/20">
                  v{{ report.version }}.0
                  <span *ngIf="first" class="ml-2 w-2 h-2 rounded-full bg-success"></span>
                </span>
              </td>
              <td class="px-6 py-4 font-medium text-heading">
                {{ report.file_name }}
              </td>
              <td class="px-6 py-4 text-body">
                {{ formatBytes(report.file_size) }}
              </td>
              <td class="px-6 py-4 text-muted">
                {{ report.submitted_at | date:'dd/MM/yyyy HH:mm' }}
              </td>
              <td class="px-6 py-4 text-right">
                <a [href]="getFileUrl(report.file_path)" target="_blank" class="text-primary hover:text-primary-pale hover:underline font-medium inline-flex items-center">
                  <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Tải xuống
                </a>
              </td>
            </tr>
            
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

  getFileUrl(path: string): string {
    return `${environment.apiUrl}/${path}`;
  }

  formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }
}
