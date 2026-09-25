import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../core/models/api.model';
import { environment } from '../../../../environments/environment';

export interface DashboardStats {
  users_count?: number;
  students_count?: number;
  lecturers_count?: number;
  active_periods_count?: number;
  pending_topics_count?: number;
  approved_topics_count?: number;
  pending_registrations_count?: number;
  approved_registrations_count?: number;

  my_topics_count?: number;
  my_pending_topics_count?: number;
  my_approved_topics_count?: number;
  supervising_registrations_count?: number;

  my_registrations_count?: number;
  active_registrations_count?: number;
  available_topics_count?: number;

  councils_count?: number;
  schedules_count?: number;
  calculated_results?: number;
  published_results?: number;

  pending_progress?: number;
  new_reports?: number;
  assigned_councils?: number;
  upcoming_schedules?: number;

  submitted_reports?: number;
  next_deadline?: string;
  defense_schedule?: string;
  final_result?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private readonly API_URL = environment.apiUrl;

  getMemberAStats(): Observable<ApiResponse<DashboardStats>> {
    return this.http.get<ApiResponse<DashboardStats>>(`${this.API_URL}/dashboard/stats/member-a`);
  }

  getMemberBStats(): Observable<ApiResponse<DashboardStats>> {
    return this.http.get<ApiResponse<DashboardStats>>(`${this.API_URL}/dashboard/stats/member-b`);
  }
}
