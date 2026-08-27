import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EvaluationService } from '../../services/evaluation.service';
import { AuthService } from '../../../../core/services/auth';
import { Evaluation } from '../../models/evaluation.model';
import { EvaluationFormComponent } from '../../components/evaluation-form/evaluation-form';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';

@Component({
  selector: 'app-evaluation-page',
  standalone: true,
  imports: [CommonModule, EvaluationFormComponent, StatusBadge],
  template: `
    <div class="p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div class="mb-8">
        <h1 class="text-3xl font-display font-bold text-kinpaku uppercase tracking-wider">
          Chấm Điểm Đề Tài
        </h1>
        <p class="text-muted mt-2">Danh sách sinh viên đang chờ đánh giá</p>
      </div>

      <div class="flex gap-8 flex-1 min-h-0">
        <!-- Danh sách sinh viên (Cột trái) -->
        <div class="w-1/3 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
          <div *ngFor="let ev of evaluations"
               (click)="selectEvaluation(ev)"
               class="ks-card cursor-pointer transition-colors"
               [ngClass]="selectedEval?.id === ev.id ? 'border-kinpaku bg-lacquer-raised' : 'hover:border-hairline hover:bg-lacquer-raised'">
            
            <div class="flex justify-between items-start mb-2">
              <h4 class="font-sans font-medium text-body">{{ ev.studentName }}</h4>
              <app-status-badge [type]="ev.status === 'submitted' ? 'success' : 'warning'">
                {{ ev.status === 'submitted' ? 'Đã nộp' : 'Chưa nộp' }}
              </app-status-badge>
            </div>
            <p class="text-xs text-muted truncate">{{ ev.topicName }}</p>
            <div class="mt-4 text-xs font-mono text-muted flex justify-between">
              <span>Mã SV: {{ ev.studentId }}</span>
              <span>Điểm: {{ ev.totalScore || 0 }}/100</span>
            </div>
          </div>
          
          <div *ngIf="evaluations.length === 0" class="text-muted text-sm italic">
            Không có sinh viên nào cần chấm điểm.
          </div>
        </div>

        <!-- Form chấm điểm (Cột phải) -->
        <div class="w-2/3 overflow-y-auto custom-scrollbar">
          <div *ngIf="selectedEval; else noSelection">
            <!-- Chuyền bản sao (copy) vào form để khi bấm "Lưu" mới update thật -->
            <app-evaluation-form 
              [evaluation]="selectedEvalCopy!"
              (save)="onSaveEvaluation($event)">
            </app-evaluation-form>
          </div>
          
          <ng-template #noSelection>
            <div class="h-full flex flex-col items-center justify-center text-muted border border-dashed border-hairline rounded-sm p-8">
              <span class="material-symbols-outlined text-4xl mb-4 opacity-50">edit_document</span>
              <p>Chọn một sinh viên từ danh sách để bắt đầu chấm điểm</p>
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

  evaluations: Evaluation[] = [];
  selectedEval: Evaluation | null = null;
  selectedEvalCopy: Evaluation | null = null;

  ngOnInit() {
    this.loadEvaluations();
  }

  loadEvaluations() {
    const user = this.authService.currentUser();
    // Giả sử GV-001 là ID mặc định của lecturer
    const lecturerId = user?.role === 'lecturer' ? 'GV-001' : ''; 
    this.evaluations = this.evaluationService.getEvaluationsByLecturer(lecturerId);
  }

  selectEvaluation(ev: Evaluation) {
    this.selectedEval = ev;
    // Tạo bản sao để tránh 2-way binding sửa trực tiếp data khi chưa bấm lưu
    this.selectedEvalCopy = JSON.parse(JSON.stringify(ev));
  }

  onSaveEvaluation(updatedEv: Evaluation) {
    this.evaluationService.updateEvaluation(updatedEv);
    this.loadEvaluations(); // Reload list
    
    // Cập nhật lại trạng thái selected
    const refreshed = this.evaluations.find(e => e.id === updatedEv.id);
    if (refreshed) {
      this.selectEvaluation(refreshed);
    }
  }
}
