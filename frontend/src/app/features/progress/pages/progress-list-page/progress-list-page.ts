import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ProgressTimelineComponent } from '../../components/progress-timeline/progress-timeline';
import { ProgressFormComponent } from '../../components/progress-form/progress-form';
import { ProgressService } from '../../services/progress.service';
import { AuthService } from '../../../../core/services/auth';
import { CreateProgressLogRequest, AddTeacherCommentRequest } from '../../models/progress.model';

@Component({
  selector: 'app-progress-list-page',
  standalone: true,
  imports: [CommonModule, ProgressTimelineComponent, ProgressFormComponent],
  template: `
    <div class="max-w-4xl mx-auto p-8">
      <div class="mb-8">
        <h1 class="text-3xl font-display font-bold text-heading mb-2">Báo Cáo Tiến Độ</h1>
        <p class="text-muted">Ghi nhận và theo dõi tiến trình thực hiện đồ án của bạn.</p>
      </div>

      <div *ngIf="errorMessage" class="mb-6 p-4 bg-danger/10 border border-danger/20 text-danger text-sm rounded-sm">
        {{ errorMessage }}
      </div>

      <!-- Form nộp báo cáo (chỉ sinh viên thấy) -->
      <app-progress-form
        *ngIf="isStudent"
        (submitProgress)="onSubmitReport($event)">
      </app-progress-form>

      <!-- Dòng thời gian -->
      <div class="mt-8 relative">
        <div *ngIf="isLoading" class="text-primary py-4">Đang tải dữ liệu tiến độ...</div>

        <app-progress-timeline
          *ngIf="!isLoading"
          [logs]="progressService.progressLogs()"
          (commentSubmit)="onCommentSubmit($event.logId, $event.request)">
        </app-progress-timeline>
      </div>
    </div>
  `
})
export class ProgressListPageComponent implements OnInit {
  progressService = inject(ProgressService);
  authService = inject(AuthService);
  route = inject(ActivatedRoute);

  isLoading = false;
  errorMessage = '';
  registrationId: string | null = null;

  get isStudent(): boolean {
    return this.authService.currentUser()?.role === 'student';
  }

  ngOnInit() {
    this.registrationId = this.route.snapshot.paramMap.get('registrationId');
    if (this.registrationId) {
      this.loadProgress();
    } else {
      this.errorMessage = 'Không tìm thấy mã đăng ký để tải tiến độ.';
    }
  }

  loadProgress() {
    if (!this.registrationId) return;
    this.isLoading = true;
    this.errorMessage = '';
    this.progressService.getLogsByRegistration(this.registrationId).subscribe({
      next: () => this.isLoading = false,
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = this.getErrorMessage(err, 'Không thể tải dữ liệu tiến độ.');
      }
    });
  }

  onSubmitReport(req: Omit<CreateProgressLogRequest, 'registration_id'>) {
    if (!this.registrationId) return;
    // Gắn ID đăng ký vào payload trước khi gọi API
    const requestWithId = { ...req, registration_id: this.registrationId };
    this.errorMessage = '';

    this.progressService.createLog(requestWithId).subscribe({
      next: () => this.loadProgress(), // Reload sau khi tạo thành công
      error: (err) => {
        this.errorMessage = this.getErrorMessage(err, 'Không thể nộp báo cáo tiến độ.');
      }
    });
  }

  onCommentSubmit(logId: string, req: AddTeacherCommentRequest) {
    this.errorMessage = '';
    this.progressService.addComment(logId, req).subscribe({
      next: () => this.loadProgress(),
      error: (err) => {
        this.errorMessage = this.getErrorMessage(err, 'Không thể gửi nhận xét tiến độ.');
      }
    });
  }

  private getErrorMessage(err: any, fallback: string): string {
    return err?.error?.message || err?.error?.error?.message || fallback;
  }
}
