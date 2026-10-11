import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ReportResponse } from '../models/report.model';
import { ApiResponse } from '../../../core/models/api.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private http = inject(HttpClient);
  private readonly API_URL = environment.apiUrl;

  reports = signal<ReportResponse[]>([]);

  constructor() {}

  // Sinh viên upload file báo cáo theo đơn đăng ký (Sử dụng FormData để đính kèm file)
  uploadReport(registrationId: string, file: File, reportType: string): Observable<ApiResponse<ReportResponse>> {
    const formData = new FormData();
    formData.append('registration_id', registrationId);
    formData.append('file', file);
    formData.append('report_type', reportType);

    // Ghi chú: HttpClient sẽ tự động cấu hình Content-Type thành multipart/form-data khi gửi FormData
    return this.http.post<ApiResponse<ReportResponse>>(`${this.API_URL}/reports`, formData);
  }

  // Lấy lịch sử báo cáo của một đơn đăng ký
  getReportsByRegistration(registrationId: string): Observable<ApiResponse<ReportResponse[]>> {
    return this.http.get<ApiResponse<ReportResponse[]>>(`${this.API_URL}/registrations/${registrationId}/reports`).pipe(
      tap(res => {
        if (res.data) {
          this.reports.set(res.data);
        }
      })
    );
  }

  /**
   * Gọi API tải xuống file báo cáo từ Backend (kèm Token xác thực tự động từ AuthInterceptor).
   * Cần cấu hình responseType: 'blob' vì Backend trả về dữ liệu nhị phân (Binary Stream) thay vì JSON.
   */
  downloadReport(reportId: string): Observable<Blob> {
    return this.http.get(`${this.API_URL}/reports/${reportId}/download`, {
      responseType: 'blob'
    });
  }

  /**
   * Hàm tiện ích giúp kích hoạt trình duyệt tự động lưu file về máy tính người dùng:
   * 1. Tạo một URL ảo trỏ vào vùng nhớ Blob (URL.createObjectURL)
   * 2. Tạo một thẻ <a> tạm thời trong DOM
   * 3. Gán thuộc tính download và giả lập hành động click() để tải file
   * 4. Thu hồi bộ nhớ (revokeObjectURL) để giải phóng RAM của trình duyệt
   */
  triggerFileDownload(blob: Blob, fileName: string): void {
    const objectUrl = window.URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = objectUrl;
    downloadLink.download = fileName;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    window.URL.revokeObjectURL(objectUrl);
  }
}

