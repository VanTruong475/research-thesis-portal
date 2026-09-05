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
  uploadReport(registrationId: string, file: File): Observable<ApiResponse<ReportResponse>> {
    const formData = new FormData();
    formData.append('registration_id', registrationId);
    formData.append('file', file);

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
}
