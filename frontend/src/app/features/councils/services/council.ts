import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Council } from '../models/council.model';
import { ApiResponse } from '../../../core/models/api.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CouncilService {
  private http = inject(HttpClient);
  private readonly API_URL = environment.apiUrl;

  councils = signal<Council[]>([]);

  constructor() { }

  getCouncilsByPeriod(periodId: string): Observable<ApiResponse<Council[]>> {
    return this.http.get<ApiResponse<Council[]>>(`${this.API_URL}/councils/period/${periodId}`).pipe(
      tap(res => {
        if (res.data) {
          this.councils.set(res.data);
        }
      })
    );
  }
}
