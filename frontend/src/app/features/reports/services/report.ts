import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Report, ReportUploadRequest } from '../models/report.model';
import { ApiResponse } from '../../../core/models/api.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private http = inject(HttpClient);
  private readonly API_URL = environment.apiUrl;

  reports = signal<Report[]>([]);

  constructor() { }

  getReportsByTopic(topicId: string): Observable<ApiResponse<Report[]>> {
    return this.http.get<ApiResponse<Report[]>>(`${this.API_URL}/topics/${topicId}/reports`).pipe(
      tap(res => {
        if (res.data) {
          this.reports.set(res.data);
        }
      })
    );
  }

  uploadReport(req: ReportUploadRequest): Observable<ApiResponse<Report>> {
    const formData = new FormData();
    formData.append('topic_id', req.topic_id);
    formData.append('file', req.file);

    return this.http.post<ApiResponse<Report>>(`${this.API_URL}/reports`, formData).pipe(
      tap(res => {
        if (res.data) {
          this.reports.update(reps => [res.data, ...reps]);
        }
      })
    );
  }
}
