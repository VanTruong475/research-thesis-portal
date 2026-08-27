import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TopicService } from '../../services/topic.service';
import { Topic } from '../../models/topic.model';
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

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div *ngFor="let topic of topics" class="ks-card flex flex-col">
          <div class="flex justify-between items-start mb-4">
            <div>
              <span class="text-xs font-mono text-muted mb-1 block">{{ topic.code }}</span>
              <h2 class="text-xl font-display font-bold text-primary">{{ topic.name }}</h2>
            </div>
            <app-status-badge [type]="topic.status === 'open' ? 'success' : 'neutral'">
              {{ topic.status === 'open' ? 'Đang mở' : 'Đã đóng' }}
            </app-status-badge>
          </div>
          
          <p class="text-body text-sm mb-6 flex-1">{{ topic.description }}</p>
          
          <div class="space-y-3 bg-surface-deep p-4 rounded-sm border border-border-subtle mb-6">
            <div class="flex justify-between text-sm">
              <span class="text-muted">Giảng viên hướng dẫn:</span>
              <span class="font-medium text-heading">{{ topic.lecturerName }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-muted">Số lượng sinh viên:</span>
              <span class="font-medium text-body">{{ topic.currentStudents }} / {{ topic.maxStudents }}</span>
            </div>
          </div>
          
          <button 
            *ngIf="userRole === 'student'"
            [disabled]="topic.status !== 'open' || topic.currentStudents >= topic.maxStudents"
            class="ks-button ks-button-primary w-full">
            {{ topic.status !== 'open' ? 'Không thể đăng ký' : 'Đăng ký đề tài này' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class TopicListPageComponent implements OnInit {
  topicService = inject(TopicService);
  authService = inject(AuthService);
  
  topics: Topic[] = [];
  userRole: string = 'student';

  ngOnInit() {
    this.topics = this.topicService.getAllTopics();
    const user = this.authService.currentUser();
    if (user) {
      this.userRole = user.role;
    }
  }
}
