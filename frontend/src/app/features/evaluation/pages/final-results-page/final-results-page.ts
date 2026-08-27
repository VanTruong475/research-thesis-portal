import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EvaluationService } from '../../services/evaluation.service';
import { AuthService } from '../../../../core/services/auth';
import { FinalResult } from '../../models/evaluation.model';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';

@Component({
  selector: 'app-final-results-page',
  standalone: true,
  imports: [CommonModule, StatusBadge],
  template: `
    <div class="p-8 max-w-4xl mx-auto h-full flex flex-col">
      <div class="mb-8 text-center">
        <h1 class="text-3xl font-display font-bold text-kinpaku uppercase tracking-wider">
          Kết Quả Tổng Kết
        </h1>
        <p class="text-muted mt-2">Bảng điểm và đánh giá cuối cùng dành cho Sinh viên</p>
      </div>

      <div *ngIf="result; else noResult" class="ks-card mt-8">
        <div class="border-b border-hairline pb-6 mb-6">
          <h2 class="text-2xl font-display font-medium text-champagne mb-2">
            Đề tài: {{ result.topicName }}
          </h2>
          <p class="text-body font-sans">
            Sinh viên thực hiện: <span class="font-medium text-kinpaku">{{ result.studentName }}</span> ({{ result.studentId }})
          </p>
        </div>

        <div class="grid grid-cols-3 gap-6 mb-8 text-center">
          <div class="p-4 bg-lacquer-raised rounded-sm border border-hairline">
            <p class="text-xs text-muted mb-2 uppercase tracking-wide">Điểm Hướng Dẫn</p>
            <p class="font-display text-3xl font-bold text-body">{{ result.supervisorScore }}</p>
          </div>
          <div class="p-4 bg-lacquer-raised rounded-sm border border-hairline">
            <p class="text-xs text-muted mb-2 uppercase tracking-wide">Điểm Phản Biện</p>
            <p class="font-display text-3xl font-bold text-body">{{ result.reviewerScore }}</p>
          </div>
          <div class="p-4 bg-lacquer-raised rounded-sm border border-hairline">
            <p class="text-xs text-muted mb-2 uppercase tracking-wide">Điểm Hội Đồng</p>
            <p class="font-display text-3xl font-bold text-body">{{ result.councilScore }}</p>
          </div>
        </div>

        <div class="flex items-center justify-between p-6 bg-kinpaku/5 border border-kinpaku/20 rounded-sm mb-8">
          <div>
            <p class="text-sm text-champagne mb-1 uppercase tracking-wider">Điểm Tổng Kết</p>
            <p class="font-display text-5xl font-bold text-kinpaku">{{ result.finalScore }} / 10</p>
          </div>
          
          <div class="text-right">
            <p class="text-sm text-champagne mb-2 uppercase tracking-wider">Xếp Loại</p>
            <app-status-badge [type]="result.conclusion === 'excellent' ? 'success' : (result.conclusion === 'passed' ? 'warning' : 'danger')">
              {{ result.conclusion === 'excellent' ? 'Xuất Sắc' : (result.conclusion === 'passed' ? 'Đạt' : 'Không Đạt') }}
            </app-status-badge>
          </div>
        </div>

        <div>
          <h3 class="font-sans text-lg font-medium text-champagne mb-2">Nhận xét chung:</h3>
          <p class="text-body bg-lacquer-raised p-4 rounded-sm border border-hairline italic">
            "{{ result.comments }}"
          </p>
        </div>
      </div>

      <ng-template #noResult>
        <div class="mt-12 text-center text-muted p-12 border border-dashed border-hairline rounded-sm">
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

  result: FinalResult | undefined;

  ngOnInit() {
    this.loadResult();
  }

  loadResult() {
    const user = this.authService.currentUser();
    // Giả sử ST-2021001 là ID mặc định của student
    const studentId = user?.role === 'student' ? 'ST-2021001' : '';
    this.result = this.evaluationService.getFinalResultByStudent(studentId);
  }
}
