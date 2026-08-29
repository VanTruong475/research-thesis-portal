import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ProgressLog, CreateProgressLogRequest, AddTeacherCommentRequest } from '../models/progress.model';
import { ApiResponse } from '../../../core/models/api.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProgressService {
  private http = inject(HttpClient);
  private readonly API_URL = environment.apiUrl;

  progressLogs = signal<ProgressLog[]>([]);

  constructor() {}

  // Lấy danh sách tiến độ của một đăng ký
  getLogsByRegistration(registrationId: string): Observable<ApiResponse<ProgressLog[]>> {
    return this.http.get<ApiResponse<ProgressLog[]>>(`${this.API_URL}/registrations/${registrationId}/progress`).pipe(
      tap(res => {
        if (res.data) {
          this.progressLogs.set(res.data);
        }
      })
    );
  }

  // Sinh viên nộp báo cáo tiến độ mới
  createLog(payload: CreateProgressLogRequest): Observable<ApiResponse<ProgressLog>> {
    return this.http.post<ApiResponse<ProgressLog>>(`${this.API_URL}/progress`, payload);
  }

  // Giảng viên gửi nhận xét
  addComment(logId: string, payload: AddTeacherCommentRequest): Observable<ApiResponse<ProgressLog>> {
    return this.http.post<ApiResponse<ProgressLog>>(`${this.API_URL}/progress/${logId}/comments`, payload);
  }
}
