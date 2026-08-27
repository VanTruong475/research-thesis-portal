import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TopicService } from '../../services/topic.service';
import { AuthService } from '../../../../core/services/auth';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';

@Component({
  selector: 'app-my-topics-page',
  standalone: true,
  imports: [CommonModule, StatusBadge],
  template: `
    <div class="p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div class="flex justify-between items-end mb-8">
        <div>
          <h1 class="text-3xl font-display font-bold text-heading uppercase tracking-wider">
            Đề Tài Của Tôi
          </h1>
          <p class="text-muted mt-2">Quản lý các đề tài do bạn hướng dẫn</p>
        </div>
        
        <button class="ks-button ks-button-primary">
          + Thêm Đề Tài Mới
        </button>
      </div>

      <div class="ks-card flex-1 overflow-hidden flex flex-col p-0 relative">
        <div *ngIf="isLoading" class="absolute inset-0 bg-surface-deep/50 backdrop-blur-sm z-20 flex items-center justify-center">
          <span class="text-primary font-medium">Đang tải dữ liệu...</span>
        </div>

        <div class="overflow-y-auto custom-scrollbar">
          <table class="w-full text-left border-collapse">
            <thead class="sticky top-0 bg-surface-deep z-10 shadow-sm">
              <tr>
                <th class="p-4 font-sans font-medium text-muted text-sm border-b border-border-subtle">Mã số</th>
                <th class="p-4 font-sans font-medium text-muted text-sm border-b border-border-subtle">Tên đề tài</th>
                <th class="p-4 font-sans font-medium text-muted text-sm border-b border-border-subtle">Sinh viên</th>
                <th class="p-4 font-sans font-medium text-muted text-sm border-b border-border-subtle">Trạng thái</th>
                <th class="p-4 font-sans font-medium text-muted text-sm border-b border-border-subtle text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border-subtle">
              <tr *ngFor="let topic of topicService.topics()" class="hover:bg-surface-raised transition-colors">
                <td class="p-4 font-mono text-sm">{{ topic.code }}</td>
                <td class="p-4 font-sans font-medium text-body max-w-md truncate">{{ topic.title }}</td>
                <td class="p-4 text-sm font-medium">
                  <span [class.text-danger]="(topic.currentStudents || 0) >= topic.max_students" class="text-primary">
                    {{ topic.currentStudents || 0 }} / {{ topic.max_students }}
                  </span>
                </td>
                <td class="p-4">
                  <app-status-badge [type]="topic.status === 'active' || topic.status === 'approved' ? 'success' : 'neutral'">
                    {{ topic.status === 'active' || topic.status === 'approved' ? 'Đang mở' : 'Đã đóng' }}
                  </app-status-badge>
                </td>
                <td class="p-4 text-right">
                  <button class="text-muted hover:text-primary transition-colors text-sm underline mr-3">Sửa</button>
                  <button class="text-muted hover:text-primary transition-colors text-sm underline">Xem DS</button>
                </td>
              </tr>
              
              <tr *ngIf="topicService.topics().length === 0 && !isLoading">
                <td colspan="5" class="p-8 text-center text-muted italic">
                  Bạn chưa đăng ký hướng dẫn đề tài nào.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class MyTopicsPageComponent implements OnInit {
  topicService = inject(TopicService);
  authService = inject(AuthService);
  
  isLoading = false;

  ngOnInit() {
    const user = this.authService.currentUser();
    if (user && user.role === 'lecturer') {
      this.isLoading = true;
      this.topicService.fetchMyTopics().subscribe({
        next: () => this.isLoading = false,
        error: () => this.isLoading = false
      });
    }
  }
}
