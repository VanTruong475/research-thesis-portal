import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Evaluation } from '../../models/evaluation.model';

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
          Sinh viên: <span class="text-primary">{{ evaluation.studentName }}</span>
        </p>
      </div>

      <div class="space-y-6">
        <!-- Lặp qua các tiêu chí chấm điểm -->
        <div *ngFor="let criteria of evaluation.criterias" class="flex flex-col gap-2">
          <label class="font-sans text-sm font-medium text-body">
            {{ criteria.name }} (Tối đa: {{ criteria.maxScore }} điểm)
          </label>
          <input
            type="number"
            class="ks-input w-32"
            [(ngModel)]="criteria.score"
            [disabled]="evaluation.status === 'submitted'"
            min="0"
            [max]="criteria.maxScore"
            (change)="calculateTotal()"
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
            [disabled]="evaluation.status === 'submitted'"
            placeholder="Nhập nhận xét đánh giá..."
          ></textarea>
        </div>

        <!-- Tổng điểm (tự động tính) -->
        <div class="p-4 bg-surface-raised border border-border-subtle rounded-sm flex justify-between items-center">
          <span class="font-sans text-body">Tổng điểm:</span>
          <span class="font-display text-2xl font-bold"
                [ngClass]="totalScore >= 50 ? 'text-secondary' : 'text-danger'">
            {{ totalScore }} / 100
          </span>
        </div>

        <!-- Các nút hành động -->
        <div class="flex gap-4 justify-end pt-4 border-t border-border-subtle" *ngIf="evaluation.status === 'draft'">
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
  @Input() evaluation!: Evaluation;
  @Output() save = new EventEmitter<Evaluation>();

  get totalScore(): number {
    return this.evaluation.criterias.reduce((sum, c) => sum + (c.score || 0), 0);
  }

  // Cập nhật lại tổng điểm (gọi khi có sự thay đổi từ input)
  calculateTotal() {
    this.evaluation.totalScore = this.totalScore;
  }

  onSaveDraft() {
    this.calculateTotal();
    this.evaluation.status = 'draft';
    this.save.emit(this.evaluation);
  }

  onSubmit() {
    if (confirm('Bạn có chắc chắn muốn nộp bảng điểm này? Sau khi nộp sẽ không thể sửa lại.')) {
      this.calculateTotal();
      this.evaluation.status = 'submitted';
      this.save.emit(this.evaluation);
    }
  }
}
