import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ScoreCreate, ScoreUpdate, ScoreResponse, FinalResultCalculateRequest, FinalResultResponse } from '../models/evaluation.model';
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

  // Giảng viên nhập điểm
  submitScore(payload: ScoreCreate): Observable<ApiResponse<ScoreResponse>> {
    return this.http.post<ApiResponse<ScoreResponse>>(`${this.API_URL}/scores`, payload);
  }

  // Giảng viên cập nhật điểm theo API contract
  updateScore(scoreId: string, payload: ScoreUpdate): Observable<ApiResponse<ScoreResponse>> {
    return this.http.put<ApiResponse<ScoreResponse>>(`${this.API_URL}/scores/${scoreId}`, payload);
  }

  // Lấy danh sách phiếu điểm của một đồ án
  getScoresByRegistration(registrationId: string): Observable<ApiResponse<ScoreResponse[]>> {
    return this.http.get<ApiResponse<ScoreResponse[]>>(`${this.API_URL}/scores`, {
      params: { registration_id: registrationId }
    }).pipe(
      tap(res => {
        if (res.data) {
          this.evaluations.set(res.data);
        }
      })
    );
  }

  // Tính toán kết quả tổng kết (Admin)
  calculateFinalResult(registrationId: string, payload?: FinalResultCalculateRequest): Observable<ApiResponse<FinalResultResponse>> {
    return this.http.post<ApiResponse<FinalResultResponse>>(`${this.API_URL}/registrations/${registrationId}/final-result/calculate`, payload ?? {}).pipe(
      tap(res => {
        if (res.data) {
          this.finalResult.set(res.data);
        }
      })
    );
  }

  // Admin công bố điểm
  publishFinalResult(registrationId: string): Observable<ApiResponse<FinalResultResponse>> {
    return this.http.post<ApiResponse<FinalResultResponse>>(`${this.API_URL}/registrations/${registrationId}/final-result/publish`, {}).pipe(
      tap(res => {
        if (res.data) {
          this.finalResult.set(res.data);
        }
      })
    );
  }

  // Xem kết quả tổng kết (Sinh viên / Giảng viên)
  getFinalResult(registrationId: string): Observable<ApiResponse<FinalResultResponse>> {
    return this.http.get<ApiResponse<FinalResultResponse>>(`${this.API_URL}/registrations/${registrationId}/final-result`).pipe(
      tap(res => {
        if (res.data) {
          this.finalResult.set(res.data);
        } else {
          this.finalResult.set(null);
        }
      })
    );
  }
}
