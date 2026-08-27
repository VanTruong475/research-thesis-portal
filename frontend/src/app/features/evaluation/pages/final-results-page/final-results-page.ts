import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EvaluationService } from '../../services/evaluation.service';
import { AuthService } from '../../../../core/services/auth';
import { FinalResultResponse } from '../../models/evaluation.model';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';

@Component({
  selector: 'app-final-results-page',
  standalone: true,
  imports: [CommonModule, StatusBadge],
  template: `
    <div class="p-8 max-w-4xl mx-auto h-full flex flex-col">
      <div class="mb-8 text-center">
        <h1 class="text-3xl font-display font-bold text-primary uppercase tracking-wider">
          Kết Quả Tổng Kết
        </h1>
        <p class="text-muted mt-2">Bảng điểm và đánh giá cuối cùng dành cho Sinh viên</p>
      </div>

      <div *ngIf="isLoading" class="text-center py-10">
        <span class="text-primary font-medium">Đang tải kết quả...</span>
      </div>

      <div *ngIf="result() as res; else noResult">
        <div class="ks-card mt-8">
          <div class="border-b border-border-subtle pb-6 mb-6">
            <h2 class="text-2xl font-display font-medium text-heading mb-2">
              Đề tài: {{ res.topicName || res.registration_id }}
            </h2>
            <p class="text-body font-sans">
              Sinh viên thực hiện: <span class="font-medium text-primary">{{ res.studentName || 'Chưa cập nhật' }}</span>
            </p>
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
              <app-status-badge [type]="res.classification === 'excellent' ? 'success' : (res.classification === 'pass' || res.classification === 'good' || res.classification === 'fair' ? 'warning' : 'danger')">
                {{ formatClassification(res.classification) }}
              </app-status-badge>
            </div>
          </div>
        </div>
      </div>

      <ng-template #noResult>
        <div *ngIf="!isLoading" class="mt-12 text-center text-muted p-12 border border-dashed border-border-subtle rounded-sm">
          <span class="material-symbols-outlined text-5xl mb-4 opacity-50">hourglass_empty</span>
          <p class="text-lg">Chưa có kết quả tổng kết cho bạn.</p>
          <p class="text-sm mt-2">Vui lòng quay lại sau khi Hội đồng hoàn tất việc chấm điểm.</p>
        </div>
      </ng-template>
    </div>
  `
})
export class FinalResultsPageComponent implements OnInit {
  evaluationService = inject(EvaluationService);
  authService = inject(AuthService);

  isLoading = false;
  // Dùng Signal trực tiếp từ Service để render
  result = this.evaluationService.finalResult;

  // Mock ID của registration
  private readonly DUMMY_REG_ID = '123e4567-e89b-12d3-a456-426614174000';

  ngOnInit() {
    this.isLoading = true;
    this.evaluationService.getFinalResult(this.DUMMY_REG_ID).subscribe({
      next: () => this.isLoading = false,
      error: () => this.isLoading = false
    });
  }

  formatClassification(classification?: string): string {
    if (!classification) return 'Đang xử lý';
    const map: Record<string, string> = {
      'excellent': 'Xuất sắc',
      'good': 'Giỏi',
      'fair': 'Khá',
      'pass': 'Trung bình (Đạt)',
      'fail': 'Không Đạt'
    };
    return map[classification] || classification;
  }
}
