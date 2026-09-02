import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TopicService } from '../../services/topic.service';
import { AuthService } from '../../../../core/services/auth';
import { PeriodService } from '../../../academic-periods/services/period.service';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';
import { Topic, TopicCreateRequest, TopicStatus } from '../../models/topic.model';

@Component({
  selector: 'app-my-topics-page',
  standalone: true,
  imports: [CommonModule, RouterModule, StatusBadge, ReactiveFormsModule],
  template: `
    <div class="p-8 max-w-7xl mx-auto h-full flex flex-col relative">
      <div class="flex justify-between items-end mb-8">
        <div>
          <h1 class="text-3xl font-display font-bold text-heading uppercase tracking-wider">
            Đề Tài Của Tôi
          </h1>
          <p class="text-muted mt-2">Quản lý các đề tài do bạn hướng dẫn</p>
        </div>
        
        <button class="ks-button ks-button-primary" (click)="openDialog()" [disabled]="!activePeriodId" [title]="proposalPeriodMessage">
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
                  <app-status-badge [type]="getStatusBadgeType(topic.status)">
                    {{ formatTopicStatus(topic.status) }}
                  </app-status-badge>
                </td>
                <td class="p-4 text-right">
                  <button class="text-muted hover:text-primary transition-colors text-sm underline mr-3" (click)="openDialog(topic)">Sửa</button>
                  <a [routerLink]="['/app/topics', topic.id, 'reports']" class="text-muted hover:text-primary transition-colors text-sm underline mr-3" title="Xem Báo cáo">Báo cáo</a>
                  <a routerLink="/app/registrations/review" class="text-muted hover:text-primary transition-colors text-sm underline" title="Danh sách Sinh viên">DS Sinh viên</a>
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

      <!-- Modal Thêm/Sửa Đề Tài -->
      <div *ngIf="isDialogOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-surface-deep/80 backdrop-blur-sm">
        <div class="ks-card w-full max-w-2xl p-6 relative">
          <h2 class="text-2xl font-display font-bold text-heading mb-6">
            {{ editingTopicId ? 'Chỉnh Sửa Đề Tài' : 'Đề Xuất Đề Tài Mới' }}
          </h2>
          <form [formGroup]="topicForm" (ngSubmit)="onSubmit()" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="ks-label">Mã Đề Tài *</label>
                <input type="text" formControlName="code" class="ks-input" placeholder="VD: DT-001">
              </div>
              <div>
                <label class="ks-label">Số Sinh Viên Tối Đa *</label>
                <input type="number" formControlName="max_students" class="ks-input" placeholder="VD: 3">
              </div>
            </div>
            
            <div>
              <label class="ks-label">Tên Đề Tài *</label>
              <input type="text" formControlName="title" class="ks-input" placeholder="Nhập tên đề tài nghiên cứu">
            </div>

            <div>
              <label class="ks-label">Mô tả (Mục tiêu, nội dung) *</label>
              <textarea formControlName="description" class="ks-input h-24" placeholder="Mô tả chi tiết về đề tài"></textarea>
            </div>

            <div>
              <label class="ks-label">Yêu cầu đầu vào đối với sinh viên</label>
              <textarea formControlName="requirements" class="ks-input h-16" placeholder="Các kỹ năng, kiến thức cần có"></textarea>
            </div>

            <div class="pt-6 mt-6 border-t border-border-subtle flex justify-end gap-3">
              <button type="button" class="ks-button ks-button-secondary" (click)="closeDialog()">Hủy</button>
              <button type="submit" class="ks-button ks-button-primary" [disabled]="topicForm.invalid || isSubmitting">
                {{ isSubmitting ? 'Đang lưu...' : 'Lưu Lại' }}
              </button>
            </div>
          </form>
        </div>
      </div>

    </div>
  `
})
export class MyTopicsPageComponent implements OnInit {
  topicService = inject(TopicService);
  authService = inject(AuthService);
  periodService = inject(PeriodService); // Thêm PeriodService để giao tiếp API
  private fb = inject(FormBuilder);
  
  isLoading = false;
  isSubmitting = false;
  isDialogOpen = false;
  editingTopicId: string | null = null;
  editingTopicPeriodId: string | null = null;
  topicForm!: FormGroup;

  // Biến lưu ID thật của học kỳ đang mở đề xuất đề tài thay vì dùng DUMMY
  activePeriodId: string | null = null;
  proposalPeriodMessage = 'Đang kiểm tra đợt mở đề xuất đề tài...';

  ngOnInit() {
    this.initForm();
    this.loadTopics();
    this.loadActivePeriod(); // Gọi hàm lấy học kỳ khi khởi tạo trang
  }

  loadActivePeriod() {
    // Lấy danh sách học kỳ và tìm học kỳ đang mở đề xuất đề tài trong đúng khung thời gian
    this.periodService.fetchPeriods(1, 50).subscribe({
      next: (res) => {
        const now = new Date().getTime();
        const validPeriod = res.data?.items.find(period => {
          if (period.status !== 'proposal_open') return false;

          const startAt = new Date(period.proposal_start_at).getTime();
          const endAt = new Date(period.proposal_end_at).getTime();
          return startAt <= now && now <= endAt;
        });

        this.activePeriodId = validPeriod?.id || null;
        this.proposalPeriodMessage = this.activePeriodId
          ? `Đang sử dụng đợt đề xuất: ${validPeriod?.name}`
          : 'Hiện chưa có đợt mở đề xuất đề tài.';
      },
      error: (err) => {
        this.activePeriodId = null;
        this.proposalPeriodMessage = this.getTopicErrorMessage(err, 'Không thể tải danh sách đợt đề xuất đề tài.');
      }
    });
  }

  loadTopics() {
    const user = this.authService.currentUser();
    if (user && user.role === 'lecturer') {
      this.isLoading = true;
      this.topicService.fetchMyTopics().subscribe({
        next: () => this.isLoading = false,
        error: () => this.isLoading = false
      });
    }
  }

  initForm() {
    this.topicForm = this.fb.group({
      code: ['', Validators.required],
      title: ['', Validators.required],
      description: ['', Validators.required],
      requirements: [''],
      max_students: [1, [Validators.required, Validators.min(1)]]
    });
  }

  openDialog(topic?: Topic) {
    if (!topic && !this.activePeriodId) {
      alert(this.proposalPeriodMessage || 'Hiện chưa có đợt mở đề xuất đề tài.');
      return;
    }

    this.isDialogOpen = true;
    if (topic) {
      this.editingTopicId = topic.id;
      this.editingTopicPeriodId = topic.academic_period_id;
      this.topicForm.patchValue({
        code: topic.code,
        title: topic.title,
        description: topic.description,
        requirements: topic.requirements,
        max_students: topic.max_students
      });
    } else {
      this.editingTopicId = null;
      this.editingTopicPeriodId = null;
      this.topicForm.reset({ max_students: 1 });
    }
  }

  closeDialog() {
    this.isDialogOpen = false;
    this.editingTopicId = null;
    this.editingTopicPeriodId = null;
    this.topicForm.reset();
  }

  onSubmit() {
    // Không cho phép lưu nếu form không hợp lệ hoặc chưa có học kỳ
    if (this.topicForm.invalid) return;
    if (!this.activePeriodId) {
      alert(this.proposalPeriodMessage || 'Hiện chưa có đợt mở đề xuất đề tài.');
      return;
    }

    this.isSubmitting = true;
    const formValue = this.topicForm.value;
    const payload: TopicCreateRequest = {
      academic_period_id: this.editingTopicPeriodId || this.activePeriodId,
      code: formValue.code,
      title: formValue.title,
      description: formValue.description,
      requirements: formValue.requirements || undefined,
      max_students: formValue.max_students
    };

    if (this.editingTopicId) {
      this.topicService.updateTopic(this.editingTopicId, payload).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.closeDialog();
          alert('Cập nhật đề tài thành công.');
          this.loadTopics();
        },
        error: (err) => {
          this.isSubmitting = false;
          alert(this.getTopicErrorMessage(err, 'Có lỗi xảy ra khi cập nhật đề tài.'));
        }
      });
    } else {
      this.topicService.createTopic(payload).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.closeDialog();
          alert('Tạo đề tài thành công. Đề tài đang chờ Admin duyệt.');
          this.loadTopics();
        },
        error: (err) => {
          this.isSubmitting = false;
          alert(this.getTopicErrorMessage(err, 'Có lỗi xảy ra khi tạo đề tài.'));
        }
      });
    }
  }

  formatTopicStatus(status: TopicStatus): string {
    const statusMap: Record<TopicStatus, string> = {
      pending_approval: 'Chờ duyệt',
      approved: 'Đã duyệt',
      rejected: 'Từ chối',
      closed: 'Đã đóng',
      cancelled: 'Đã hủy',
      completed: 'Không dùng (cũ)'
    };
    return statusMap[status] || status;
  }

  getStatusBadgeType(status: TopicStatus): 'success' | 'warning' | 'danger' | 'neutral' {
    if (status === 'approved') return 'success';
    if (status === 'pending_approval') return 'warning';
    if (status === 'rejected' || status === 'cancelled') return 'danger';
    return 'neutral';
  }

  private getTopicErrorMessage(err: any, fallbackMessage: string): string {
    const code = err.error?.error?.code;
    if (err.status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
    if (err.status === 403 || code === 'PERMISSION_DENIED') return 'Bạn không có quyền thực hiện thao tác này.';
    if (code === 'TOPIC_PROPOSAL_PERIOD_CLOSED') return 'Hiện chưa đến thời gian hoặc đã quá hạn đề xuất đề tài.';
    if (code === 'TOPIC_CODE_EXISTS') return 'Mã đề tài đã tồn tại trong đợt này. Vui lòng chọn mã khác.';
    if (err.status === 422 || code === 'VALIDATION_ERROR') return 'Dữ liệu đề tài không hợp lệ. Vui lòng kiểm tra lại các trường bắt buộc.';
    return err.error?.message || fallbackMessage;
  }
}
