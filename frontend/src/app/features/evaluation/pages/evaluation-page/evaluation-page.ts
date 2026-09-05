import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { EvaluationService } from '../../services/evaluation.service';
import { AuthService } from '../../../../core/services/auth';
import { ScoreResponse, ScoreCreate, ScoreStatus, EvaluationType } from '../../models/evaluation.model';
import { EvaluationFormComponent } from '../../components/evaluation-form/evaluation-form';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';

@Component({
  selector: 'app-evaluation-page',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, EvaluationFormComponent, StatusBadge],
  template: `
    <div class="p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div class="mb-8">
        <a [routerLink]="getBackRoute()" class="inline-flex items-center text-sm text-muted hover:text-primary transition-colors mb-4">
          ← {{ getBackLabel() }}
        </a>
        <h1 class="text-3xl font-display font-bold text-primary uppercase tracking-wider">
          Chấm Điểm Đề Tài
        </h1>
        <p class="text-muted mt-2">Danh sách phiếu điểm liên quan đến đồ án này</p>
      </div>

      <div *ngIf="errorMessage" class="mb-4 rounded-sm border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
        {{ errorMessage }}
      </div>

      <div class="flex gap-8 flex-1 min-h-0 relative">
        <div *ngIf="isLoading" class="absolute inset-0 z-20 flex items-start justify-center pt-10 bg-surface/70">
          <span class="text-primary font-medium">Đang tải dữ liệu...</span>
        </div>

        <!-- Danh sách phiếu điểm (Cột trái) -->
        <div class="w-1/3 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
          <button
            *ngIf="isLecturer"
            class="ks-button bg-primary text-surface hover:bg-heading w-full justify-center"
            (click)="startNewEvaluation()"
            [disabled]="isLoading || isSubmitting">
            <span class="material-symbols-outlined text-sm mr-2">add</span>
            Tạo phiếu điểm
          </button>

          <div *ngFor="let ev of evaluationService.evaluations()"
               (click)="selectEvaluation(ev)"
               class="ks-card cursor-pointer transition-colors"
               [ngClass]="selectedEval?.id === ev.id ? 'border-primary bg-surface-raised' : 'hover:border-border-subtle hover:bg-surface-raised'">

            <div class="flex justify-between items-start mb-2">
              <h4 class="font-sans font-medium text-body">{{ getStudentName(ev) }}</h4>
              <app-status-badge [type]="getScoreStatusBadgeType(ev.status)">
                {{ formatScoreStatus(ev.status) }}
              </app-status-badge>
            </div>
            <p class="text-xs text-muted truncate">{{ getTopicTitle(ev) }}</p>
            <p class="text-xs text-muted truncate mt-1" *ngIf="ev.evaluator_full_name">
              Người chấm: {{ ev.evaluator_full_name }}
            </p>
            <div class="mt-4 text-xs font-mono text-muted flex justify-between">
              <span>Vai trò: {{ ev.evaluation_type === 'supervisor' ? 'GVHD' : 'Hội đồng' }}</span>
              <span>Điểm: {{ ev.score || 0 }}/10.0</span>
            </div>
          </div>

          <div *ngIf="evaluationService.evaluations().length === 0 && !isLoading" class="ks-card text-muted text-sm">
            <p class="italic">Chưa có thông tin phiếu điểm.</p>
            <p *ngIf="isLecturer" class="mt-2">Bấm “Tạo phiếu điểm” để nhập điểm cho đăng ký này.</p>
          </div>
        </div>

        <!-- Form chấm điểm (Cột phải) -->
        <div class="w-2/3 overflow-y-auto custom-scrollbar">
          <div *ngIf="showCreateOptions" class="ks-card mt-4 mb-4">
            <h3 class="text-lg font-display font-medium text-heading mb-4">Thông tin phiếu điểm mới</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label class="flex flex-col gap-2 text-sm text-body">
                Loại chấm điểm
                <select class="ks-input" [(ngModel)]="newEvaluationType" (ngModelChange)="syncCreateEvaluation()">
                  <option value="supervisor">Điểm GVHD</option>
                  <option value="council">Điểm Hội đồng</option>
                </select>
              </label>
              <label class="flex flex-col gap-2 text-sm text-body" *ngIf="newEvaluationType === 'council'">
                Council ID
                <input
                  class="ks-input"
                  [(ngModel)]="newCouncilId"
                  (ngModelChange)="syncCreateEvaluation()"
                  placeholder="Nhập ID hội đồng được phân công"
                />
              </label>
            </div>
            <p class="text-xs text-muted mt-3">
              GVHD không cần Council ID. Thành viên hội đồng cần nhập đúng Council ID của lịch bảo vệ.
            </p>
          </div>

          <div *ngIf="selectedEvalCopy; else noSelection">
            <app-evaluation-form
              [evaluation]="selectedEvalCopy"
              (save)="onSaveEvaluation($event)">
            </app-evaluation-form>
          </div>

          <ng-template #noSelection>
            <div class="h-full flex flex-col items-center justify-center text-muted border border-dashed border-border-subtle rounded-sm p-8">
              <span class="material-symbols-outlined text-4xl mb-4 opacity-50">edit_document</span>
              <p>Chọn một phiếu điểm từ danh sách hoặc tạo phiếu điểm mới để bắt đầu chấm</p>
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
  isSubmitting = false;
  registrationId: string | null = null;
  errorMessage = '';
  showCreateOptions = false;
  newEvaluationType: EvaluationType = 'supervisor';
  newCouncilId = '';

  get isLecturer(): boolean {
    return this.authService.currentUser()?.role === 'lecturer';
  }

  get isStudent(): boolean {
    return this.authService.currentUser()?.role === 'student';
  }

  getBackRoute(): string {
    return this.isStudent ? '/app/registrations/my' : '/app/registrations/review';
  }

  getBackLabel(): string {
    return this.isStudent ? 'Quay lại đăng ký của tôi' : 'Quay lại danh sách đăng ký';
  }

  ngOnInit() {
    this.registrationId = this.route.snapshot.paramMap.get('registrationId');
    if (this.registrationId) {
      this.loadEvaluations();
    }
  }

  loadEvaluations() {
    if (!this.registrationId) return;
    this.isLoading = true;
    this.errorMessage = '';
    this.evaluationService.getScoresByRegistration(this.registrationId).subscribe({
      next: () => this.isLoading = false,
      error: (err) => {
        this.isLoading = false;
        this.evaluationService.evaluations.set([]);
        this.errorMessage = err.error?.message || 'Không thể tải danh sách phiếu điểm.';
      }
    });
  }

  formatScoreStatus(status: ScoreStatus): string {
    const statusMap: Record<ScoreStatus, string> = {
      draft: 'Nháp',
      submitted: 'Đã nộp',
      locked: 'Đã khóa'
    };
    return statusMap[status] || status;
  }

  getScoreStatusBadgeType(status: ScoreStatus): 'success' | 'warning' | 'danger' | 'neutral' {
    if (status === 'submitted') return 'success';
    if (status === 'draft') return 'warning';
    return 'neutral';
  }

  getStudentName(ev: ScoreResponse): string {
    return ev.student_full_name || ev.studentName || 'Chưa cập nhật';
  }

  getTopicTitle(ev: ScoreResponse): string {
    return ev.topic_title || ev.topicName || ev.registration_id;
  }

  selectEvaluation(ev: ScoreResponse) {
    this.showCreateOptions = false;
    this.selectedEval = ev;
    this.selectedEvalCopy = JSON.parse(JSON.stringify(ev));
  }

  startNewEvaluation() {
    if (!this.registrationId) return;
    this.showCreateOptions = true;
    this.selectedEval = null;
    this.selectedEvalCopy = this.buildNewEvaluation();
  }

  syncCreateEvaluation() {
    if (this.showCreateOptions && this.selectedEvalCopy) {
      this.selectedEvalCopy.evaluation_type = this.newEvaluationType;
      this.selectedEvalCopy.council_id = this.newEvaluationType === 'council' ? (this.newCouncilId || null) : null;
    }
  }

  onSaveEvaluation(req: ScoreCreate) {
    this.errorMessage = '';
    if (req.evaluation_type === 'council' && !req.council_id) {
      this.errorMessage = 'Vui lòng nhập Council ID khi chấm điểm hội đồng.';
      return;
    }

    this.isSubmitting = true;
    this.evaluationService.submitScore(req).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.selectedEval = null;
        this.selectedEvalCopy = null;
        this.showCreateOptions = false;
        this.loadEvaluations();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err.error?.message || 'Không thể lưu phiếu điểm.';
      }
    });
  }

  private buildNewEvaluation(): ScoreResponse {
    return {
      id: 'new-score',
      registration_id: this.registrationId || '',
      evaluator_id: this.authService.currentUser()?.id || '',
      council_id: this.newEvaluationType === 'council' ? (this.newCouncilId || null) : null,
      evaluation_type: this.newEvaluationType,
      score: 0,
      comments: null,
      status: 'draft',
      submitted_at: null,
      locked_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      evaluator_full_name: this.authService.currentUser()?.name || null
    };
  }
}
