import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ProgressLog, ProgressSubmitRequest, ProgressCommentRequest } from '../models/progress.model';
import { ApiResponse } from '../../../core/models/api.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProgressService {
  private http = inject(HttpClient);
  private readonly API_URL = environment.apiUrl;

  progressLogs = signal<ProgressLog[]>([]);

  constructor() { }

  // API: Lấy danh sách tiến độ theo đăng ký
  getLogsByRegistration(regId: string): Observable<ApiResponse<ProgressLog[]>> {
    return this.http.get<ApiResponse<ProgressLog[]>>(`${this.API_URL}/registrations/${regId}/progress`).pipe(
      tap(res => {
        if (res.data) {
          this.progressLogs.set(res.data);
        }
      })
    );
  }

  // API: Sinh viên nộp tiến độ
  submitProgress(req: ProgressSubmitRequest): Observable<ApiResponse<ProgressLog>> {
    return this.http.post<ApiResponse<ProgressLog>>(`${this.API_URL}/progress`, req).pipe(
      tap(res => {
        if (res.data) {
          // Thêm vào đầu danh sách signal hiện tại
          this.progressLogs.update(logs => [res.data, ...logs]);
        }
      })
    );
  }

  // API: Giảng viên comment
  commentOnProgress(logId: string, req: ProgressCommentRequest): Observable<ApiResponse<ProgressLog>> {
    return this.http.post<ApiResponse<ProgressLog>>(`${this.API_URL}/progress/${logId}/comments`, req).pipe(
      tap(res => {
        if (res.data) {
          // Cập nhật lại log vừa được comment trong signal
          this.progressLogs.update(logs => 
            logs.map(log => log.id === logId ? res.data : log)
          );
        }
      })
    );
  }
}
