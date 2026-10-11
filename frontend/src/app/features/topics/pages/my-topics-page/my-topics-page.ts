import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TopicService } from '../../services/topic.service';
import { AuthService } from '../../../../core/services/auth';
import { PeriodService } from '../../../academic-periods/services/period.service';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';
import { Topic, TopicCreateRequest, TopicStatus, TopicType } from '../../models/topic.model';

type MyTopicFilterTab = 'all' | 'pending_approval' | 'approved' | 'closed';

@Component({
  selector: 'app-my-topics-page',
  standalone: true,
  imports: [CommonModule, RouterModule, StatusBadge, FormsModule, ReactiveFormsModule],
  template: `
    <div class="p-8 max-w-7xl mx-auto h-full flex flex-col relative">
      <div class="flex justify-between items-end mb-8">
        <div>
          <h1 class="text-3xl font-display font-bold text-heading uppercase tracking-wider">
            Đề Tài Của Tôi
          </h1>
          <p class="text-muted mt-2">Quản lý các đề tài do bạn hướng dẫn</p>
        </div>

        <div class="flex flex-wrap justify-end gap-3">
          <button class="ks-button ks-button-secondary" (click)="exportTopicsToCsv()">
            <span class="material-symbols-outlined text-sm mr-2">download</span> Xuất CSV
          </button>
          <button class="ks-button ks-button-primary" (click)="openDialog()" [disabled]="!activePeriodId" [title]="proposalPeriodMessage">
            + Thêm Đề Tài Mới
          </button>
        </div>
      </div>

      <div *ngIf="successMessage" class="mb-4 p-4 bg-success/10 border border-success/20 text-success text-sm rounded-sm">
        {{ successMessage }}
      </div>
      <div *ngIf="errorMessage" class="mb-4 p-4 bg-danger/10 border border-danger/20 text-danger text-sm rounded-sm">
        {{ errorMessage }}
      </div>
      <div class="mb-4 p-3 bg-surface-raised border border-border-subtle text-muted text-sm rounded-sm">
        {{ proposalPeriodMessage }}
      </div>

      <div class="mb-4 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3">
        <input
          type="text"
          class="ks-input"
          placeholder="Tìm theo mã, tên, mô tả hoặc yêu cầu đề tài..."
          [(ngModel)]="topicKeyword">
        <div class="flex flex-wrap gap-2">
          <button
            *ngFor="let tab of getTopicFilterTabs()"
            type="button"
            class="px-4 py-2 rounded-sm border text-sm font-medium transition-colors"
            [ngClass]="selectedTopicFilter === tab.key ? 'border-primary bg-primary/10 text-primary' : 'border-border-subtle text-muted hover:text-primary hover:border-primary/40'"
            (click)="selectTopicFilter(tab.key)">
            {{ tab.label }}
            <span class="ml-2 text-xs opacity-70">{{ tab.count }}</span>
          </button>
        </div>
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
                <th class="p-4 font-sans font-medium text-muted text-sm border-b border-border-subtle">Loại đề tài</th>
                <th class="p-4 font-sans font-medium text-muted text-sm border-b border-border-subtle">Sinh viên</th>
                <th class="p-4 font-sans font-medium text-muted text-sm border-b border-border-subtle">Trạng thái</th>
                <th class="p-4 font-sans font-medium text-muted text-sm border-b border-border-subtle text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border-subtle">
              <tr *ngFor="let topic of getFilteredTopics()" class="hover:bg-surface-raised transition-colors">
                <td class="p-4 font-mono text-sm">{{ topic.code }}</td>
                <td class="p-4 font-sans font-medium text-body max-w-md truncate">{{ topic.title }}</td>
                <td class="p-4 text-sm text-body">{{ formatTopicType(topic.topic_type) }}</td>
                <td class="p-4 text-sm font-medium">
                  <span [class.text-danger]="getCurrentStudents(topic) >= topic.max_students" class="text-primary">
                    {{ getCurrentStudents(topic) }} / {{ topic.max_students }} sinh viên
                  </span>
                  <div class="text-xs text-muted mt-1">Đã duyệt / tối đa</div>
                </td>
                <td class="p-4">
                  <app-status-badge [type]="getStatusBadgeType(topic.status)">
                    {{ formatTopicStatus(topic.status) }}
                  </app-status-badge>
                </td>
                <td class="p-4 text-right">
                  <a [routerLink]="['/app/topics', topic.id]" class="text-muted hover:text-primary transition-colors text-sm underline mr-3">Chi tiết</a>
                  <button class="text-muted hover:text-primary transition-colors text-sm underline mr-3" (click)="openDialog(topic)">Sửa</button>
                  <a routerLink="/app/registrations/review" class="text-muted hover:text-primary transition-colors text-sm underline" title="Xem đăng ký của sinh viên">Xem đăng ký</a>
                </td>
              </tr>
              
              <tr *ngIf="getFilteredTopics().length === 0 && !isLoading">
                <td colspan="6" class="p-8 text-center text-muted italic">
                  {{ getEmptyTopicMessage() }}
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
          <div *ngIf="dialogErrorMessage" class="mb-4 p-3 bg-danger/10 border border-danger/20 text-danger text-sm rounded-sm">
            {{ dialogErrorMessage }}
          </div>
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
              <label class="ks-label">Loại Đề Tài *</label>
              <select formControlName="topic_type" class="ks-input">
                <option value="graduation_thesis">Khóa luận tốt nghiệp</option>
                <option value="scientific_research">Nghiên cứu khoa học</option>
              </select>
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
  successMessage = '';
  errorMessage = '';
  dialogErrorMessage = '';
  editingTopicId: string | null = null;
  editingTopicPeriodId: string | null = null;
  topicKeyword = '';
  selectedTopicFilter: MyTopicFilterTab = 'all';
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
        this.proposalPeriodMessage = 'Không thể kiểm tra đợt mở đề xuất đề tài.';
        this.errorMessage = this.getTopicErrorMessage(err, 'Không thể tải danh sách đợt đề xuất đề tài.');
      }
    });
  }

  loadTopics() {
    const user = this.authService.currentUser();
    if (user && user.role === 'lecturer') {
      this.isLoading = true;
      this.topicService.fetchMyTopics().subscribe({
        next: () => this.isLoading = false,
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = this.getTopicErrorMessage(err, 'Không thể tải danh sách đề tài của bạn.');
        }
      });
    }
  }

  initForm() {
    this.topicForm = this.fb.group({
      code: ['', Validators.required],
      title: ['', Validators.required],
      description: ['', Validators.required],
      requirements: [''],
      topic_type: ['graduation_thesis', Validators.required],
      max_students: [1, [Validators.required, Validators.min(1)]]
    });
  }

  openDialog(topic?: Topic) {
    this.successMessage = '';
    this.errorMessage = '';
    this.dialogErrorMessage = '';

    if (!topic && !this.activePeriodId) {
      this.errorMessage = this.proposalPeriodMessage || 'Hiện chưa có đợt mở đề xuất đề tài.';
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
        topic_type: topic.topic_type,
        max_students: topic.max_students
      });
    } else {
      this.editingTopicId = null;
      this.editingTopicPeriodId = null;
      this.topicForm.reset({ topic_type: 'graduation_thesis', max_students: 1 });
    }
  }

  closeDialog() {
    this.isDialogOpen = false;
    this.editingTopicId = null;
    this.editingTopicPeriodId = null;
    this.dialogErrorMessage = '';
    this.topicForm.reset();
  }

  onSubmit() {
    // Không cho phép lưu nếu form không hợp lệ hoặc chưa xác định được kỳ học
    if (this.topicForm.invalid) return;

    const periodId = this.editingTopicPeriodId || this.activePeriodId;
    if (!periodId) {
      this.dialogErrorMessage = this.proposalPeriodMessage || 'Hiện chưa có đợt mở đề xuất đề tài.';
      return;
    }

    this.isSubmitting = true;
    this.successMessage = '';
    this.errorMessage = '';
    this.dialogErrorMessage = '';
    const formValue = this.topicForm.value;
    const payload: TopicCreateRequest = {
      academic_period_id: periodId,
      code: formValue.code,
      title: formValue.title,
      description: formValue.description,
      requirements: formValue.requirements || undefined,
      topic_type: formValue.topic_type,
      max_students: formValue.max_students
    };

    if (this.editingTopicId) {
      this.topicService.updateTopic(this.editingTopicId, payload).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.closeDialog();
          this.successMessage = 'Cập nhật đề tài thành công.';
          this.loadTopics();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.dialogErrorMessage = this.getTopicErrorMessage(err, 'Có lỗi xảy ra khi cập nhật đề tài.');
        }
      });
    } else {
      this.topicService.createTopic(payload).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.closeDialog();
          this.successMessage = 'Tạo đề tài thành công. Đề tài đang chờ Admin duyệt.';
          this.loadTopics();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.dialogErrorMessage = this.getTopicErrorMessage(err, 'Có lỗi xảy ra khi tạo đề tài.');
        }
      });
    }
  }

  selectTopicFilter(filter: MyTopicFilterTab) {
    this.selectedTopicFilter = filter;
  }

  getTopicFilterTabs(): Array<{ key: MyTopicFilterTab; label: string; count: number }> {
    const topics = this.topicService.topics();
    const labels: Record<MyTopicFilterTab, string> = {
      all: 'Tất cả',
      pending_approval: 'Chờ duyệt',
      approved: 'Đã duyệt',
      closed: 'Đã đóng / khác'
    };

    return (['all', 'pending_approval', 'approved', 'closed'] as MyTopicFilterTab[]).map(key => ({
      key,
      label: labels[key],
      count: key === 'all' ? topics.length : topics.filter(topic => this.matchesTopicFilter(topic, key)).length
    }));
  }

  getFilteredTopics(): Topic[] {
    const keyword = this.normalizeSearchText(this.topicKeyword);
    return this.topicService.topics().filter(topic => {
      const matchesFilter = this.selectedTopicFilter === 'all' || this.matchesTopicFilter(topic, this.selectedTopicFilter);
      const searchableText = this.normalizeSearchText([
        topic.code,
        topic.title,
        topic.description,
        topic.requirements,
        this.formatTopicType(topic.topic_type),
        this.formatTopicStatus(topic.status)
      ].join(' '));
      return matchesFilter && (!keyword || searchableText.includes(keyword));
    });
  }

  getEmptyTopicMessage(): string {
    if (this.topicService.topics().length === 0) return 'Bạn chưa đăng ký hướng dẫn đề tài nào.';
    return 'Không tìm thấy đề tài phù hợp với bộ lọc hiện tại.';
  }

  formatTopicType(topicType: TopicType): string {
    const typeMap: Record<TopicType, string> = {
      graduation_thesis: 'Khóa luận tốt nghiệp',
      scientific_research: 'Nghiên cứu khoa học'
    };
    return typeMap[topicType] || topicType;
  }

  formatTopicStatus(status: TopicStatus): string {
    const statusMap: Record<TopicStatus, string> = {
      pending_approval: 'Chờ duyệt',
      approved: 'Đã duyệt',
      rejected: 'Từ chối',
      closed: 'Đã đóng',
      cancelled: 'Đã hủy',
      completed: 'Hoàn thành'
    };
    return statusMap[status] || status;
  }

  getStatusBadgeType(status: TopicStatus): 'success' | 'warning' | 'danger' | 'neutral' {
    if (status === 'approved') return 'success';
    if (status === 'pending_approval') return 'warning';
    if (status === 'rejected' || status === 'cancelled') return 'danger';
    return 'neutral';
  }

  getCurrentStudents(topic: Topic): number {
    return topic.current_students ?? topic.currentStudents ?? 0;
  }

  exportTopicsToCsv() {
    const topics = this.getFilteredTopics();
    if (topics.length === 0) {
      this.errorMessage = 'Không có dữ liệu đề tài để xuất.';
      return;
    }

    let csvContent = 'Mã Đề Tài,Tên Đề Tài,Loại Đề Tài,Sinh Viên,Trạng Thái,Mô Tả,Yêu Cầu\n';
    topics.forEach(topic => {
      const studentCount = `${this.getCurrentStudents(topic)} / ${topic.max_students}`;
      const row = [
        topic.code,
        topic.title,
        this.formatTopicType(topic.topic_type),
        studentCount,
        this.formatTopicStatus(topic.status),
        topic.description,
        topic.requirements || ''
      ];
      csvContent += row.map(value => this.escapeCsvValue(value)).join(',') + '\n';
    });

    this.downloadCsv(csvContent, 'DanhSachDeTaiCuaToi.csv');
  }

  private escapeCsvValue(value: string | number): string {
    return `"${String(value ?? '').replace(/"/g, '""')}"`;
  }

  private downloadCsv(csvContent: string, fileName: string) {
    const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  private matchesTopicFilter(topic: Topic, filter: MyTopicFilterTab): boolean {
    if (filter === 'pending_approval') return topic.status === 'pending_approval';
    if (filter === 'approved') return topic.status === 'approved';
    if (filter === 'closed') return topic.status === 'closed' || topic.status === 'rejected' || topic.status === 'cancelled' || topic.status === 'completed';
    return true;
  }

  private normalizeSearchText(value: string | null | undefined): string {
    return (value || '').toLowerCase().trim();
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
