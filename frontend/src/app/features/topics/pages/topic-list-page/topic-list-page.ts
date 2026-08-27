import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TopicService } from '../../services/topic.service';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';
import { AuthService } from '../../../../core/services/auth';

@Component({
  selector: 'app-topic-list-page',
  standalone: true,
  imports: [CommonModule, StatusBadge],
  template: `
    <div class="p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div class="flex justify-between items-end mb-8">
        <div>
          <h1 class="text-3xl font-display font-bold text-heading uppercase tracking-wider">
            Danh Sách Đề Tài
          </h1>
          <p class="text-muted mt-2">Xem và đăng ký các đề tài nghiên cứu đang mở</p>
        </div>
      </div>

      <div *ngIf="isLoading" class="text-center py-12 text-primary">Đang tải dữ liệu...</div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6" *ngIf="!isLoading">
        <div *ngFor="let topic of topicService.topics()" class="ks-card flex flex-col">
          <div class="flex justify-between items-start mb-4">
            <div>
              <span class="text-xs font-mono text-muted mb-1 block">{{ topic.code }}</span>
              <h2 class="text-xl font-display font-bold text-primary">{{ topic.title }}</h2>
            </div>
            <app-status-badge [type]="topic.status === 'active' || topic.status === 'approved' ? 'success' : 'neutral'">
              {{ (topic.status === 'active' || topic.status === 'approved') ? 'Đang mở' : 'Đã đóng' }}
            </app-status-badge>
          </div>
          
          <p class="text-body text-sm mb-6 flex-1 line-clamp-3">{{ topic.description }}</p>
          
          <div class="space-y-3 bg-surface-deep p-4 rounded-sm border border-border-subtle mb-6">
            <div class="flex justify-between text-sm">
              <span class="text-muted">Giảng viên hướng dẫn:</span>
              <span class="font-medium text-heading">{{ topic.lecturerName || 'Đang cập nhật' }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-muted">Số lượng sinh viên:</span>
              <span class="font-medium text-body">{{ topic.currentStudents || 0 }} / {{ topic.max_students }}</span>
            </div>
          </div>
          
          <button 
            *ngIf="userRole === 'student'"
            [disabled]="(topic.status !== 'active' && topic.status !== 'approved') || (topic.currentStudents || 0) >= topic.max_students"
            class="ks-button ks-button-primary w-full disabled:opacity-50 disabled:cursor-not-allowed">
            {{ (topic.status !== 'active' && topic.status !== 'approved') ? 'Không thể đăng ký' : 'Đăng ký đề tài này' }}
          </button>
        </div>
        
        <div *ngIf="topicService.topics().length === 0" class="col-span-1 lg:col-span-2 text-center py-12 text-muted italic ks-card">
          Chưa có đề tài nào được mở đăng ký.
        </div>
      </div>
    </div>
  `
})
export class TopicListPageComponent implements OnInit {
  topicService = inject(TopicService);
  authService = inject(AuthService);
  
  userRole: string = 'student';
  isLoading = false;

  ngOnInit() {
    const user = this.authService.currentUser();
    if (user) {
      this.userRole = user.role;
    }
    
    this.isLoading = true;
    if (this.userRole === 'student') {
      this.topicService.fetchAvailableTopics().subscribe({
        next: () => this.isLoading = false,
        error: () => this.isLoading = false
      });
    } else {
      this.topicService.fetchTopics().subscribe({
        next: () => this.isLoading = false,
        error: () => this.isLoading = false
      });
    }
  }
}
