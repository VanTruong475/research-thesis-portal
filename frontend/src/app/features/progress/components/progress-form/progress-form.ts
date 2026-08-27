import { Component, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProgressSubmitRequest } from '../../models/progress.model';
import { AuthService } from '../../../../core/services/auth';

@Component({
  selector: 'app-progress-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="ks-card mb-8">
      <div class="ks-card-header">
        <h3 class="ks-card-title">Nộp Báo Cáo Tiến Độ Mới</h3>
      </div>
      
      <div class="space-y-4">
        <div>
          <label class="ks-label">Nội dung báo cáo</label>
          <textarea 
            [(ngModel)]="content"
            class="ks-input min-h-[120px]" 
            placeholder="Mô tả chi tiết những việc bạn đã làm được trong tuần qua..."
          ></textarea>
        </div>
        
        <div class="flex justify-end">
          <button 
            class="ks-button ks-button-primary" 
            [disabled]="!content.trim() || !canSubmit"
            (click)="onSubmit()"
          >
            Nộp Tiến Độ
          </button>
        </div>
      </div>

      <!-- Cảnh báo nếu không phải sinh viên -->
      <div *ngIf="!canSubmit" class="mt-4 p-3 bg-warning/10 border border-warning/20 text-warning text-sm rounded-sm">
        Chỉ sinh viên mới có quyền nộp báo cáo tiến độ.
      </div>
    </div>
  `
})
export class ProgressFormComponent {
  @Output() submitProgress = new EventEmitter<ProgressSubmitRequest>();
  
  content: string = '';
  authService = inject(AuthService);

  get canSubmit(): boolean {
    const user = this.authService.currentUser();
    return !!user && user.role === 'student';
  }

  onSubmit() {
    if (!this.content.trim()) return;
    
    this.submitProgress.emit({
      registration_id: 'reg-1', // Tạm thời hardcode, thực tế sẽ lấy từ Router Params hoặc Input
      content: this.content.trim()
    });
    
    this.content = ''; // Reset form
  }
}
