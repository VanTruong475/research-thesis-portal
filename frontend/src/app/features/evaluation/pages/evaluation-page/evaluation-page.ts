import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { EvaluationService } from '../../services/evaluation.service';
import { AuthService } from '../../../../core/services/auth';
import { ScoreResponse, ScoreCreate } from '../../models/evaluation.model';
import { EvaluationFormComponent } from '../../components/evaluation-form/evaluation-form';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';

@Component({
  selector: 'app-evaluation-page',
  standalone: true,
  imports: [CommonModule, EvaluationFormComponent, StatusBadge],
  template: `
    <div class="p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div class="mb-8">
        <h1 class="text-3xl font-display font-bold text-primary uppercase tracking-wider">
          Chấm Điểm Đề Tài
        </h1>
        <p class="text-muted mt-2">Danh sách phiếu điểm liên quan đến đồ án này</p>
      </div>

      <div class="flex gap-8 flex-1 min-h-0 relative">
        <div *ngIf="isLoading" class="absolute inset-0 z-20 flex items-start justify-center pt-10">
          <span class="text-primary font-medium">Đang tải dữ liệu...</span>
        </div>

        <!-- Danh sách phiếu điểm (Cột trái) -->
        <div class="w-1/3 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
          <div *ngFor="let ev of evaluationService.evaluations()"
               (click)="selectEvaluation(ev)"
               class="ks-card cursor-pointer transition-colors"
               [ngClass]="selectedEval?.id === ev.id ? 'border-primary bg-surface-raised' : 'hover:border-border-subtle hover:bg-surface-raised'">
            
            <div class="flex justify-between items-start mb-2">
              <h4 class="font-sans font-medium text-body">{{ ev.studentName || 'Chưa cập nhật' }}</h4>
              <app-status-badge [type]="ev.status === 'submitted' ? 'success' : 'warning'">
                {{ ev.status === 'submitted' ? 'Đã nộp' : 'Chưa nộp' }}
              </app-status-badge>
            </div>
            <p class="text-xs text-muted truncate">{{ ev.topicName || ev.registration_id }}</p>
            <div class="mt-4 text-xs font-mono text-muted flex justify-between">
              <span>Vai trò: {{ ev.evaluation_type === 'supervisor' ? 'GVHD' : 'Hội đồng' }}</span>
              <span>Điểm: {{ ev.score || 0 }}/10.0</span>
            </div>
          </div>
          
          <div *ngIf="evaluationService.evaluations().length === 0 && !isLoading" class="text-muted text-sm italic">
            Chưa có thông tin phiếu điểm.
          </div>
        </div>

        <!-- Form chấm điểm (Cột phải) -->
        <div class="w-2/3 overflow-y-auto custom-scrollbar">
          <div *ngIf="selectedEval; else noSelection">
            <app-evaluation-form 
              [evaluation]="selectedEvalCopy!"
              (save)="onSaveEvaluation($event)">
            </app-evaluation-form>
          </div>
          
          <ng-template #noSelection>
            <div class="h-full flex flex-col items-center justify-center text-muted border border-dashed border-border-subtle rounded-sm p-8">
              <span class="material-symbols-outlined text-4xl mb-4 opacity-50">edit_document</span>
              <p>Chọn một phiếu điểm từ danh sách để bắt đầu chấm</p>
            </div>
          </ng-template>
        </div>
      </div>
    </div>
  `
})
export class EvaluationPageComponent implements OnInit {
  evaluationService = inject(EvaluationService);
  authService = inject(AuthService);
  route = inject(ActivatedRoute);

  selectedEval: ScoreResponse | null = null;
  selectedEvalCopy: ScoreResponse | null = null;
  isLoading = false;
  registrationId: string | null = null;

  ngOnInit() {
    this.registrationId = this.route.snapshot.paramMap.get('registrationId');
    if (this.registrationId) {
      this.loadEvaluations();
    }
  }

  loadEvaluations() {
    if (!this.registrationId) return;
    this.isLoading = true;
    this.evaluationService.getScoresByRegistration(this.registrationId).subscribe({
      next: () => this.isLoading = false,
      error: () => this.isLoading = false
    });
  }

  selectEvaluation(ev: ScoreResponse) {
    this.selectedEval = ev;
    this.selectedEvalCopy = JSON.parse(JSON.stringify(ev));
  }

  onSaveEvaluation(req: ScoreCreate) {
    this.evaluationService.submitScore(req).subscribe({
      next: () => {
        // Sau khi lưu xong, bỏ chọn để force click lại lấy data mới nhất nếu cần
        this.selectedEval = null;
        this.selectedEvalCopy = null;
        this.loadEvaluations(); // Reload sau khi nộp
      }
    });
  }
}
