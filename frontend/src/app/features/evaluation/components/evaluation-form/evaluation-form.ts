import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScoreResponse, ScoreCreate } from '../../models/evaluation.model';

@Component({
  selector: 'app-evaluation-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="ks-card mt-4">
      <div class="border-b border-border-subtle pb-4 mb-4">
        <h3 class="text-xl font-display font-medium text-heading mb-1">
          Phiếu Chấm Điểm
        </h3>
        <p class="text-sm text-muted">
          Sinh viên: <span class="text-primary">{{ studentName }}</span>
        </p>
        <p class="text-xs text-muted mt-1">
          Đề tài: {{ topicTitle }}
        </p>
        <p class="text-xs text-muted mt-1" *ngIf="evaluation.evaluator_full_name">
          Người chấm: {{ evaluation.evaluator_full_name }}
        </p>
      </div>

      <div *ngIf="errorMessage" class="mb-4 rounded-sm border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
        {{ errorMessage }}
      </div>

      <div class="space-y-6">
        <!-- Tổng điểm (tự động tính) -->
        <div class="p-4 bg-surface-raised border border-border-subtle rounded-sm flex justify-between items-center">
          <span class="font-sans text-body">Điểm số (0.0 - 10.0):</span>
          <input
            type="number"
            class="ks-input w-24 text-right font-display text-xl font-bold text-primary"
            [(ngModel)]="evaluation.score"
            [disabled]="isLocked"
            min="0"
            max="10"
            step="0.1"
          />
        </div>

        <!-- Nhận xét chung -->
        <div class="flex flex-col gap-2">
          <label class="font-sans text-sm font-medium text-body">
            Nhận xét chung
          </label>
          <textarea
            class="ks-input h-32 resize-none"
            [(ngModel)]="evaluation.comments"
            [disabled]="isLocked"
            placeholder="Nhập nhận xét đánh giá..."
          ></textarea>
        </div>

        <div *ngIf="isLocked" class="text-sm text-muted italic">
          Phiếu điểm đã bị khóa sau khi kết quả cuối cùng được công bố.
        </div>

        <!-- Các nút hành động -->
        <div class="flex gap-4 justify-end pt-4 border-t border-border-subtle" *ngIf="!isLocked">
          <button class="ks-button outline text-body hover:text-primary" (click)="onSaveDraft()">
            Lưu nháp
          </button>
          <button class="ks-button bg-primary text-surface hover:bg-heading" (click)="onSubmit()">
            Chốt điểm & Nộp
          </button>
        </div>
      </div>
    </div>
  `
})
export class EvaluationFormComponent {
  @Input() evaluation!: ScoreResponse;
  @Output() save = new EventEmitter<ScoreCreate>();

  errorMessage = '';

  get isLocked(): boolean {
    return this.evaluation.status === 'locked' || !!this.evaluation.locked_at;
  }

  get studentName(): string {
    return this.evaluation.student_full_name || this.evaluation.studentName || 'Chưa cập nhật';
  }

  get topicTitle(): string {
    return this.evaluation.topic_title || this.evaluation.topicName || this.evaluation.registration_id;
  }

  private buildRequest(isSubmit: boolean): ScoreCreate {
    return {
      registration_id: this.evaluation.registration_id,
      council_id: this.evaluation.council_id,
      evaluation_type: this.evaluation.evaluation_type,
      score: this.evaluation.score,
      comments: this.evaluation.comments,
      is_submit: isSubmit
    };
  }

  private validateScore(): boolean {
    if (this.evaluation.score === null || this.evaluation.score === undefined || Number.isNaN(Number(this.evaluation.score))) {
      this.errorMessage = 'Vui lòng nhập điểm số.';
      return false;
    }

    if (Number(this.evaluation.score) < 0 || Number(this.evaluation.score) > 10) {
      this.errorMessage = 'Điểm số phải nằm trong khoảng 0.0 đến 10.0.';
      return false;
    }

    this.errorMessage = '';
    return true;
  }

  onSaveDraft() {
    if (!this.validateScore()) return;
    this.save.emit(this.buildRequest(false));
  }

  onSubmit() {
    if (!this.validateScore()) return;
    if (confirm('Bạn có chắc chắn muốn nộp bảng điểm này? Điểm vẫn có thể chỉnh sửa cho đến khi kết quả cuối cùng được công bố và khóa.')) {
      this.save.emit(this.buildRequest(true));
    }
  }
}
