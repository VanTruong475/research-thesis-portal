import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Topic, Registration, TopicListResponse, RegistrationListResponse } from '../models/topic.model';
import { ApiResponse } from '../../../core/models/api.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TopicService {
  private http = inject(HttpClient);
  private readonly API_URL = environment.apiUrl;

  topics = signal<Topic[]>([]);
  registrations = signal<Registration[]>([]);

  constructor() {}

  // Lấy tất cả topic
  fetchTopics(page: number = 1, pageSize: number = 50): Observable<ApiResponse<TopicListResponse>> {
    const params = new HttpParams().set('page', page.toString()).set('page_size', pageSize.toString());
    return this.http.get<ApiResponse<TopicListResponse>>(`${this.API_URL}/topics`, { params }).pipe(
      tap(res => {
        if (res.data) this.topics.set(res.data.items);
      })
    );
  }

  // Lấy danh sách topic dành cho sinh viên đăng ký (available topics)
  fetchAvailableTopics(page: number = 1, pageSize: number = 50): Observable<ApiResponse<TopicListResponse>> {
    const params = new HttpParams().set('page', page.toString()).set('page_size', pageSize.toString());
    return this.http.get<ApiResponse<TopicListResponse>>(`${this.API_URL}/topics/available`, { params }).pipe(
      tap(res => {
        if (res.data) this.topics.set(res.data.items);
      })
    );
  }

  // Giảng viên lấy danh sách đề tài của mình
  fetchMyTopics(page: number = 1, pageSize: number = 50): Observable<ApiResponse<TopicListResponse>> {
    const params = new HttpParams().set('page', page.toString()).set('page_size', pageSize.toString());
    return this.http.get<ApiResponse<TopicListResponse>>(`${this.API_URL}/topics/my`, { params }).pipe(
      tap(res => {
        if (res.data) this.topics.set(res.data.items);
      })
    );
  }

  // Lấy danh sách đăng ký của một giảng viên (để duyệt)
  fetchPendingRegistrations(): Observable<ApiResponse<RegistrationListResponse>> {
    return this.http.get<ApiResponse<RegistrationListResponse>>(`${this.API_URL}/registrations/my-approvals`).pipe(
      tap(res => {
        if (res.data) this.registrations.set(res.data.items);
      })
    );
  }

  // Sinh viên lấy danh sách đăng ký của mình
  fetchMyRegistrations(): Observable<ApiResponse<RegistrationListResponse>> {
    return this.http.get<ApiResponse<RegistrationListResponse>>(`${this.API_URL}/registrations`).pipe(
      tap(res => {
        if (res.data) this.registrations.set(res.data.items);
      })
    );
  }
}
