import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { EvaluationService } from '../../services/evaluation.service';
import { AuthService } from '../../../../core/services/auth';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';
import { FinalResultResponse, FinalResultStatus, ResultClassification } from '../../models/evaluation.model';

@Component({
  selector: 'app-final-results-page',
  standalone: true,
  imports: [CommonModule, StatusBadge],
  template: `
    <div class="p-8 max-w-4xl mx-auto h-full flex flex-col">
      <div class="mb-8 text-center flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-display font-bold text-primary uppercase tracking-wider text-left">
            Kết Quả Tổng Kết
          </h1>
          <p class="text-muted mt-2 text-left">Bảng điểm và đánh giá cuối cùng dành cho Đồ án</p>
        </div>

        <!-- Các nút chức năng dành cho Admin -->
        <div class="flex gap-4" *ngIf="isAdmin">
          <button class="ks-button ks-button-secondary" (click)="onCalculate()" [disabled]="isProcessing || !registrationId || result()?.status === 'published'">
            <span class="material-symbols-outlined text-sm mr-2">calculate</span>
            Tính Điểm
          </button>
          <button
            class="ks-button ks-button-primary"
            (click)="onPublish()"
            [disabled]="isProcessing || !registrationId || (result()?.status === 'published')">
            <span class="material-symbols-outlined text-sm mr-2">campaign</span>
            {{ result()?.status === 'published' ? 'Đã Công Bố' : 'Công Bố Kết Quả' }}
          </button>
        </div>
      </div>

      <div *ngIf="errorMessage" class="mb-4 rounded-sm border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
        {{ errorMessage }}
      </div>

      <div *ngIf="isLoading" class="text-center py-10">
        <span class="text-primary font-medium">Đang tải kết quả...</span>
      </div>

      <div *ngIf="result() as res; else noResult">
        <div class="ks-card mt-8">
          <div class="border-b border-border-subtle pb-6 mb-6">
            <h2 class="text-2xl font-display font-medium text-heading mb-2">
              Đề tài: {{ getTopicTitle(res) }}
            </h2>
            <p class="text-body font-sans">
              Sinh viên thực hiện: <span class="font-medium text-primary">{{ getStudentName(res) }}</span>
            </p>
            <p class="text-sm text-muted mt-2" *ngIf="res.supervisor_full_name">
              GVHD: {{ res.supervisor_full_name }}
            </p>
            <div class="mt-3">
              <app-status-badge [type]="getFinalResultStatusBadgeType(res.status)">
                {{ formatFinalResultStatus(res.status) }}
              </app-status-badge>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-6 mb-8 text-center">
            <div class="p-4 bg-surface-raised rounded-sm border border-border-subtle">
              <p class="text-xs text-muted mb-2 uppercase tracking-wide">Điểm GVHD ({{ res.supervisor_weight }}%)</p>
              <p class="font-display text-3xl font-bold text-body">{{ res.supervisor_score }}</p>
            </div>
            <div class="p-4 bg-surface-raised rounded-sm border border-border-subtle">
              <p class="text-xs text-muted mb-2 uppercase tracking-wide">Điểm Hội Đồng ({{ res.council_weight }}%)</p>
              <p class="font-display text-3xl font-bold text-body">{{ res.council_average_score }}</p>
            </div>
          </div>

          <div class="flex items-center justify-between p-6 bg-primary/5 border border-primary/20 rounded-sm mb-8">
            <div>
              <p class="text-sm text-heading mb-1 uppercase tracking-wider">Điểm Tổng Kết</p>
              <p class="font-display text-5xl font-bold text-primary">{{ res.final_score }} / 10</p>
            </div>

            <div class="text-right">
              <p class="text-sm text-heading mb-2 uppercase tracking-wider">Xếp Loại</p>
              <app-status-badge [type]="getClassificationBadgeType(res.classification)">
                {{ formatClassification(res.classification) }}
              </app-status-badge>
            </div>
          </div>

          <div class="text-xs text-muted space-y-1">
            <p>Thời điểm tính điểm: {{ res.calculated_at | date:'dd/MM/yyyy HH:mm' }}</p>
            <p *ngIf="res.published_at">Thời điểm công bố: {{ res.published_at | date:'dd/MM/yyyy HH:mm' }}</p>
            <p *ngIf="res.calculated_by_full_name">Người tính điểm: {{ res.calculated_by_full_name }}</p>
            <p *ngIf="res.published_by_full_name">Người công bố: {{ res.published_by_full_name }}</p>
          </div>
        </div>
      </div>

      <ng-template #noResult>
        <div *ngIf="!isLoading" class="mt-12 text-center text-muted p-12 border border-dashed border-border-subtle rounded-sm">
          <span class="material-symbols-outlined text-5xl mb-4 opacity-50">hourglass_empty</span>
          <p class="text-lg">Chưa có kết quả tổng kết cho đồ án này.</p>
          <p class="text-sm mt-2">Vui lòng chờ hoặc thực hiện tính điểm (dành cho Admin).</p>
        </div>
      </ng-template>
    </div>
  `
})
export class FinalResultsPageComponent implements OnInit {
  evaluationService = inject(EvaluationService);
  authService = inject(AuthService);
  route = inject(ActivatedRoute);

  isLoading = false;
  isProcessing = false;
  errorMessage = '';

  result = this.evaluationService.finalResult;
  registrationId: string | null = null;

  get isAdmin(): boolean {
    return this.authService.currentUser()?.role === 'admin';
  }

  ngOnInit() {
    this.registrationId = this.route.snapshot.paramMap.get('registrationId');
    this.evaluationService.finalResult.set(null);
    if (this.registrationId) {
      this.loadResult();
    }
  }

  loadResult() {
    if (!this.registrationId) return;
    this.isLoading = true;
    this.errorMessage = '';
    this.evaluationService.getFinalResult(this.registrationId).subscribe({
      next: () => this.isLoading = false,
      error: (err) => {
        this.isLoading = false;
        this.evaluationService.finalResult.set(null);
        const code = err.error?.error?.code;
        if (code !== 'FINAL_RESULT_NOT_FOUND') {
          this.errorMessage = err.error?.message || 'Không thể tải kết quả tổng kết.';
        }
      }
    });
  }

  onCalculate() {
    if (!this.registrationId) return;
    this.isProcessing = true;
    this.errorMessage = '';
    this.evaluationService.calculateFinalResult(this.registrationId).subscribe({
      next: () => this.isProcessing = false,
      error: (err) => {
        this.isProcessing = false;
        this.errorMessage = err.error?.message || 'Có lỗi xảy ra khi tính điểm.';
      }
    });
  }

  onPublish() {
    if (!this.registrationId) return;
    if (confirm('Bạn có chắc chắn muốn công bố điểm? Sau khi công bố, điểm số sẽ không thể thay đổi nữa.')) {
      this.isProcessing = true;
      this.errorMessage = '';
      this.evaluationService.publishFinalResult(this.registrationId).subscribe({
        next: () => this.isProcessing = false,
        error: (err) => {
          this.isProcessing = false;
          this.errorMessage = err.error?.message || 'Có lỗi xảy ra khi công bố điểm.';
        }
      });
    }
  }

  getTopicTitle(res: FinalResultResponse): string {
    return res.topic_title || res.topicName || res.registration_id;
  }

  getStudentName(res: FinalResultResponse): string {
    return res.student_full_name || res.studentName || 'Chưa cập nhật';
  }

  formatFinalResultStatus(status: FinalResultStatus): string {
    const statusMap: Record<FinalResultStatus, string> = {
      draft: 'Nháp',
      calculated: 'Đã tính, chưa công bố',
      published: 'Đã công bố',
      cancelled: 'Đã hủy'
    };
    return statusMap[status] || status;
  }

  getFinalResultStatusBadgeType(status: FinalResultStatus): 'success' | 'warning' | 'danger' | 'neutral' {
    if (status === 'published') return 'success';
    if (status === 'calculated' || status === 'draft') return 'warning';
    if (status === 'cancelled') return 'danger';
    return 'neutral';
  }

  formatClassification(classification?: ResultClassification | null): string {
    if (!classification) return 'Đang xử lý';
    const map: Record<ResultClassification, string> = {
      excellent: 'Xuất sắc',
      good: 'Giỏi',
      fair: 'Khá',
      average: 'Trung bình',
      failed: 'Không đạt'
    };
    return map[classification] || classification;
  }

  getClassificationBadgeType(classification?: ResultClassification | null): 'success' | 'warning' | 'danger' | 'neutral' {
    if (classification === 'excellent') return 'success';
    if (classification === 'good' || classification === 'fair' || classification === 'average') return 'warning';
    if (classification === 'failed') return 'danger';
    return 'neutral';
  }
}
