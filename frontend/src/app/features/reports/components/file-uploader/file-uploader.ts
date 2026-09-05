import { Component, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/services/auth';

@Component({
  selector: 'app-file-uploader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ks-card mb-8">
      <div class="ks-card-header">
        <h3 class="ks-card-title">Tải lên Báo cáo Mới</h3>
      </div>
      
      <div 
        class="border-2 border-dashed border-border-subtle rounded-sm p-8 text-center bg-surface-deep hover:border-primary-pale/50 transition-colors"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)"
        [class.border-primary]="isDragging"
      >
        <svg class="mx-auto h-12 w-12 text-muted mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        
        <p class="text-sm text-heading mb-2">
          Kéo thả file vào đây hoặc <label class="text-primary cursor-pointer hover:underline">
            chọn file
            <input type="file" class="hidden" (change)="onFileSelected($event)">
          </label>
        </p>
        <p class="text-xs text-muted">Hỗ trợ định dạng tài liệu báo cáo theo quy định (Tối đa 20MB)</p>

        <!-- Hiển thị file đã chọn -->
        <div *ngIf="selectedFile" class="mt-6 inline-flex items-center space-x-4 bg-surface px-4 py-2 border border-border-subtle rounded">
          <span class="text-sm font-medium text-body">{{ selectedFile.name }}</span>
          <button (click)="upload()" class="ks-button ks-button-primary px-4 min-h-[36px] text-sm">
            Tải lên
          </button>
        </div>
      </div>

      <div *ngIf="!canUpload" class="mt-4 p-3 bg-warning/10 border border-warning/20 text-warning text-sm rounded-sm">
        Chỉ sinh viên thực hiện đề tài mới có quyền tải lên báo cáo.
      </div>
    </div>
  `
})
export class FileUploaderComponent {
  @Output() fileUpload = new EventEmitter<File>();
  
  isDragging = false;
  selectedFile: File | null = null;
  authService = inject(AuthService);

  get canUpload(): boolean {
    const user = this.authService.currentUser();
    return !!user && user.role === 'student';
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    if (!this.canUpload) return;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.selectedFile = files[0];
    }
  }

  onFileSelected(event: any) {
    if (!this.canUpload) return;
    const files = event.target.files;
    if (files && files.length > 0) {
      this.selectedFile = files[0];
    }
  }

  upload() {
    if (this.selectedFile && this.canUpload) {
      this.fileUpload.emit(this.selectedFile);
      this.selectedFile = null; // Reset form
    }
  }
}
