import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AcademicPeriod, AcademicPeriodListResponse } from '../models/period.model';
import { ApiResponse } from '../../../core/models/api.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PeriodService {
  private http = inject(HttpClient);
  private readonly API_URL = environment.apiUrl;

  periods = signal<AcademicPeriod[]>([]);
  totalItems = signal<number>(0);

  constructor() {}

  fetchPeriods(page: number = 1, pageSize: number = 50): Observable<ApiResponse<AcademicPeriodListResponse>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('page_size', pageSize.toString());

    return this.http.get<ApiResponse<AcademicPeriodListResponse>>(`${this.API_URL}/academic-periods`, { params }).pipe(
      tap(res => {
        if (res.data) {
          this.periods.set(res.data.items);
          this.totalItems.set(res.data.pagination.total_items);
        }
      })
    );
  }
}
