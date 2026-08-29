import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ProgressTimelineComponent } from '../../components/progress-timeline/progress-timeline';
import { ProgressService } from '../../services/progress.service';
import { AddTeacherCommentRequest } from '../../models/progress.model';

@Component({
  selector: 'app-supervised-progress-page',
  standalone: true,
  imports: [CommonModule, ProgressTimelineComponent],
  template: `
    <div class="max-w-6xl mx-auto p-8 h-full flex flex-col">
      <div class="mb-8">
        <h1 class="text-3xl font-display font-bold text-heading mb-2">Tiến Độ Hướng Dẫn</h1>
        <p class="text-muted">Theo dõi và nhận xét tiến độ của sinh viên do bạn hướng dẫn.</p>
      </div>

      <div class="flex flex-1 gap-8 overflow-hidden">
        <!-- Cột phải: Timeline tiến độ của nhóm đang chọn (Full width if no left col needed, or keep for later list integration) -->
        <div class="w-full flex flex-col ks-card overflow-hidden">
          <div class="p-4 border-b border-border-subtle bg-surface-deep flex justify-between items-center">
            <h2 class="font-bold text-heading">Lịch Sử Báo Cáo</h2>
          </div>
          
          <div class="flex-1 overflow-y-auto custom-scrollbar p-6">
            <div *ngIf="isLoading" class="text-primary py-4">Đang tải dữ liệu tiến độ...</div>

            <app-progress-timeline 
              *ngIf="!isLoading"
              [logs]="progressService.progressLogs()"
              (commentSubmit)="onCommentSubmit($event.logId, $event.request)">
            </app-progress-timeline>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SupervisedProgressPageComponent implements OnInit {
  progressService = inject(ProgressService);
  route = inject(ActivatedRoute);
  
  isLoading = false;
  registrationId: string | null = null;

  ngOnInit() {
    this.registrationId = this.route.snapshot.paramMap.get('registrationId');
    if (this.registrationId) {
      this.loadProgress();
    }
  }

  loadProgress() {
    if (!this.registrationId) return;
    this.isLoading = true;
    this.progressService.getLogsByRegistration(this.registrationId).subscribe({
      next: () => this.isLoading = false,
      error: () => this.isLoading = false
    });
  }

  onCommentSubmit(logId: string, req: AddTeacherCommentRequest) {
    this.progressService.addComment(logId, req).subscribe(() => this.loadProgress());
  }
}
