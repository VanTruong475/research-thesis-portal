import { Component, Output, EventEmitter, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CreateProgressLogRequest } from '../../models/progress.model';
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
          <div class="flex justify-between items-center mb-1">
            <label class="ks-label mb-0">Nội dung báo cáo *</label>
            <!-- Hiển thị số ký tự đã nhập (tối thiểu 5 ký tự theo quy định của hệ thống) -->
            <span class="text-xs font-mono" [class.text-danger]="content.trim().length > 0 && content.trim().length < 5" [class.text-muted]="content.trim().length === 0 || content.trim().length >= 5">
              {{ content.trim().length }}/5 ký tự tối thiểu
            </span>
          </div>
          
          <textarea 
            [(ngModel)]="content"
            class="ks-input min-h-[120px]" 
            placeholder="Mô tả chi tiết những công việc, kết quả nghiên cứu bạn đã hoàn thành trong tuần qua..."
          ></textarea>

          <!-- Báo lỗi nhắc nhở nếu chưa đủ 5 ký tự -->
          <p *ngIf="content.trim().length > 0 && content.trim().length < 5" class="text-xs text-danger mt-1">
            Nội dung báo cáo cần tối thiểu 5 ký tự.
          </p>
        </div>
        
        <div class="flex justify-end">
          <button 
            type="button"
            class="ks-button ks-button-primary disabled:opacity-50" 
            [disabled]="content.trim().length < 5 || !canSubmit || isSubmitting"
            (click)="onSubmit()"
          >
            {{ isSubmitting ? 'Đang gửi tiến độ...' : 'Nộp Tiến Độ' }}
          </button>
        </div>
      </div>

      <!-- Cảnh báo nếu không phải sinh viên -->
      <div *ngIf="!canSubmit" class="mt-4 p-3 bg-warning/10 border border-warning/20 text-warning text-sm rounded-sm">
        Chỉ sinh viên thực hiện đề tài mới có quyền nộp báo cáo tiến độ.
      </div>
    </div>
  `
})
export class ProgressFormComponent {
  // Sự kiện gửi dữ liệu báo cáo lên component cha
  @Output() submitProgress = new EventEmitter<Omit<CreateProgressLogRequest, 'registration_id'>>();
  
  // Trạng thái đang gửi (để vô hiệu hóa nút, tránh spam click)
  @Input() isSubmitting = false;

  content: string = '';
  authService = inject(AuthService);

  // Chỉ cho phép sinh viên nộp báo cáo
  get canSubmit(): boolean {
    const user = this.authService.currentUser();
    return !!user && user.role === 'student';
  }

  onSubmit() {
    // Kiểm tra tính hợp lệ trước khi emit
    if (this.content.trim().length < 5 || !this.canSubmit || this.isSubmitting) {
      return;
    }
    
    this.submitProgress.emit({
      content: this.content.trim()
    });
    
    this.content = ''; // Reset khung nhập sau khi gửi
  }
}

