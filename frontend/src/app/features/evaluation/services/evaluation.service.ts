import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ScoreCreate, ScoreResponse, FinalResultResponse } from '../models/evaluation.model';
import { ApiResponse } from '../../../core/models/api.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EvaluationService {
  private http = inject(HttpClient);
  private readonly API_URL = environment.apiUrl;

  evaluations = signal<ScoreResponse[]>([]);
  finalResult = signal<FinalResultResponse | null>(null);

  constructor() {}

  // GV nộp hoặc lưu nháp điểm
  submitScore(data: ScoreCreate): Observable<ApiResponse<ScoreResponse>> {
    return this.http.post<ApiResponse<ScoreResponse>>(`${this.API_URL}/scores`, data).pipe(
      tap(res => {
        if (res.data) {
          // Thêm hoặc cập nhật trong danh sách
          this.evaluations.update(evals => {
            const index = evals.findIndex(e => e.id === res.data!.id);
            if (index >= 0) {
              const newEvals = [...evals];
              newEvals[index] = res.data!;
              return newEvals;
            }
            return [res.data!, ...evals];
          });
        }
      })
    );
  }

  // Lấy các phiếu điểm của một đăng ký
  getScoresByRegistration(regId: string): Observable<ApiResponse<ScoreResponse[]>> {
    return this.http.get<ApiResponse<ScoreResponse[]>>(`${this.API_URL}/scores/registration/${regId}`).pipe(
      tap(res => {
        if (res.data) this.evaluations.set(res.data);
      })
    );
  }

  // Lấy kết quả cuối cùng
  getFinalResult(regId: string): Observable<ApiResponse<FinalResultResponse>> {
    return this.http.get<ApiResponse<FinalResultResponse>>(`${this.API_URL}/registrations/${regId}/final-result`).pipe(
      tap(res => {
        if (res.data) this.finalResult.set(res.data);
      })
    );
  }

  // Admin tính điểm tổng kết
  calculateFinalResult(regId: string): Observable<ApiResponse<FinalResultResponse>> {
    return this.http.post<ApiResponse<FinalResultResponse>>(`${this.API_URL}/registrations/${regId}/final-result/calculate`, {}).pipe(
      tap(res => {
        if (res.data) this.finalResult.set(res.data);
      })
    );
  }

  // Admin công bố điểm
  publishFinalResult(regId: string): Observable<ApiResponse<FinalResultResponse>> {
    return this.http.post<ApiResponse<FinalResultResponse>>(`${this.API_URL}/registrations/${regId}/final-result/publish`, {}).pipe(
      tap(res => {
        if (res.data) this.finalResult.set(res.data);
      })
    );
  }
}
