import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TopicService } from '../../services/topic.service';
import { Registration } from '../../models/topic.model';
import { AuthService } from '../../../../core/services/auth';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';

@Component({
  selector: 'app-my-registration-page',
  standalone: true,
  imports: [CommonModule, StatusBadge],
  template: `
    <div class="p-8 max-w-5xl mx-auto h-full flex flex-col">
      <div class="flex justify-between items-end mb-8">
        <div>
          <h1 class="text-3xl font-display font-bold text-heading uppercase tracking-wider">
            Kết Quả Đăng Ký
          </h1>
          <p class="text-muted mt-2">Theo dõi trạng thái các đề tài bạn đã xin hướng dẫn</p>
        </div>
      </div>

      <div class="ks-card flex-1 overflow-hidden flex flex-col p-0">
        <div class="overflow-y-auto custom-scrollbar">
          <table class="w-full text-left border-collapse">
            <thead class="sticky top-0 bg-surface-deep z-10 shadow-sm">
              <tr>
                <th class="p-4 font-sans font-medium text-muted text-sm border-b border-border-subtle">Ngày ĐK</th>
                <th class="p-4 font-sans font-medium text-muted text-sm border-b border-border-subtle">Đề tài</th>
                <th class="p-4 font-sans font-medium text-muted text-sm border-b border-border-subtle">Trạng thái</th>
                <th class="p-4 font-sans font-medium text-muted text-sm border-b border-border-subtle text-right">Hành động</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border-subtle">
              <tr *ngFor="let reg of myRegistrations" class="hover:bg-surface-raised transition-colors">
                <td class="p-4 text-sm font-mono text-muted">{{ reg.appliedAt | date:'dd/MM/yyyy' }}</td>
                <td class="p-4 font-medium text-body">{{ reg.topicName }}</td>
                <td class="p-4">
                  <app-status-badge [type]="reg.status === 'pending' ? 'warning' : (reg.status === 'approved' ? 'success' : 'danger')">
                    {{ reg.status === 'pending' ? 'Đang chờ duyệt' : (reg.status === 'approved' ? 'Thành công' : 'Bị từ chối') }}
                  </app-status-badge>
                </td>
                <td class="p-4 text-right">
                  <button *ngIf="reg.status === 'pending'" class="text-sm font-medium text-danger hover:text-danger/80 transition-colors underline">
                    Hủy đăng ký
                  </button>
                  <span *ngIf="reg.status !== 'pending'" class="text-muted text-sm italic">
                    Không thể hủy
                  </span>
                </td>
              </tr>
              
              <tr *ngIf="myRegistrations.length === 0">
                <td colspan="4" class="p-8 text-center text-muted italic">
                  Bạn chưa đăng ký đề tài nào. Hãy quay lại trang Danh sách Đề tài để đăng ký.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class MyRegistrationPageComponent implements OnInit {
  topicService = inject(TopicService);
  authService = inject(AuthService);
  
  myRegistrations: Registration[] = [];

  ngOnInit() {
    const user = this.authService.currentUser();
    if (user && user.role === 'student') {
      // Trong thực tế sẽ gọi API theo ID sinh viên
      // Hiện tại lấy toàn bộ đăng ký trong mock giả lập
      this.myRegistrations = this.topicService.registrations().filter(r => r.studentId === user.id);
    }
  }
}
