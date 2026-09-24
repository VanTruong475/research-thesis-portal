import { Component, Output, EventEmitter, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth';

@Component({
  selector: 'app-file-uploader',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="ks-card mb-8">
      <div class="ks-card-header">
        <h3 class="ks-card-title">Tải lên Báo cáo Mới</h3>
      </div>

      <!-- Form chọn loại tài liệu -->
      <div class="mb-6">
        <label class="block text-sm font-medium text-body mb-2">Loại tài liệu</label>
        <select 
          [(ngModel)]="selectedReportType" 
          class="ks-input w-full"
        >
          <option *ngFor="let type of reportTypes" [value]="type.value">
            {{ type.label }}
          </option>
        </select>
      </div>
      
      <!-- Khung Kéo / Thả file -->
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
          Kéo thả file vào đây hoặc <label class="text-primary cursor-pointer hover:underline font-medium">
            chọn file từ máy tính
            <input 
              type="file" 
              class="hidden" 
              accept=".pdf,.doc,.docx,.zip"
              (change)="onFileSelected($event)">
          </label>
        </p>
        <!-- Hiển thị rõ định dạng và dung lượng tối đa cho phép -->
        <p class="text-xs text-muted">
          Định dạng hỗ trợ: <span class="font-medium text-heading">.pdf, .doc, .docx, .zip</span> (Dung lượng tối đa: <span class="font-medium text-heading">20MB</span>)
        </p>

        <!-- Thông báo lỗi kiểm tra phía Client (nếu có) -->
        <div *ngIf="validationError" class="mt-4 p-3 bg-danger/10 border border-danger/20 text-danger text-sm rounded-sm max-w-md mx-auto">
          {{ validationError }}
        </div>

        <!-- Khối hiển thị thông tin file đã chọn hợp lệ -->
        <div *ngIf="selectedFile" class="mt-6 inline-flex items-center gap-4 bg-surface px-4 py-3 border border-border-subtle rounded shadow-sm">
          <div class="text-left">
            <p class="text-sm font-medium text-heading truncate max-w-xs">{{ selectedFile.name }}</p>
            <p class="text-xs text-muted">{{ formatFileSize(selectedFile.size) }}</p>
          </div>
          
          <div class="flex items-center gap-2">
            <!-- Nút xác nhận nộp file -->
            <button 
              type="button" 
              (click)="upload()" 
              [disabled]="isUploading"
              class="ks-button ks-button-primary px-4 min-h-[36px] text-sm disabled:opacity-50">
              {{ isUploading ? 'Đang tải lên...' : 'Tải lên ngay' }}
            </button>
            
            <!-- Nút hủy chọn file -->
            <button 
              type="button" 
              (click)="cancelSelectedFile()" 
              [disabled]="isUploading"
              title="Bỏ chọn file này"
              class="text-muted hover:text-danger p-1 transition-colors">
              ✕
            </button>
          </div>
        </div>
      </div>

      <!-- Cảnh báo nếu không có quyền nộp file -->
      <div *ngIf="!canUpload" class="mt-4 p-3 bg-warning/10 border border-warning/20 text-warning text-sm rounded-sm">
        Chỉ sinh viên thực hiện đề tài mới có quyền tải lên báo cáo.
      </div>
    </div>
  `
})
export class FileUploaderComponent {
  // Output phát sự kiện khi người dùng bấm nút Tải lên
  @Output() fileUpload = new EventEmitter<{file: File, type: string}>();

  selectedReportType: string = 'progress_report';
  reportTypes = [
    { value: 'progress_report', label: 'Báo cáo tiến độ' },
    { value: 'final_report', label: 'Báo cáo cuối kỳ' },
    { value: 'product', label: 'Sản phẩm nghiên cứu' },
    { value: 'evidence', label: 'Minh chứng' }
  ];

  // Input nhận trạng thái đang tải lên từ component cha (để disable nút)
  @Input() isUploading = false;
  
  isDragging = false;
  selectedFile: File | null = null;
  validationError: string | null = null;
  authService = inject(AuthService);

  // Danh sách các định dạng mở rộng cho phép (chuẩn hóa chữ thường)
  readonly allowedExtensions = ['.pdf', '.doc', '.docx', '.zip'];
  // Dung lượng tối đa: 20MB
  readonly maxFileSizeBytes = 20 * 1024 * 1024;

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
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: any) {
    if (!this.canUpload) return;
    const files = event.target.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
    // Reset giá trị input để người dùng có thể chọn lại cùng 1 file nếu vừa hủy
    event.target.value = '';
  }

  /**
   * Hàm kiểm tra tính hợp lệ của file ngay tại Client:
   * 1. Dung lượng không vượt quá 20MB
   * 2. Dung lượng không được bằng 0 (file rỗng)
   * 3. Đuôi file phải thuộc danh sách: .pdf, .doc, .docx, .zip
   */
  private handleFile(file: File) {
    this.validationError = null;

    if (file.size === 0) {
      this.validationError = 'File được chọn không có nội dung (file rỗng). Vui lòng kiểm tra lại.';
      this.selectedFile = null;
      return;
    }

    if (file.size > this.maxFileSizeBytes) {
      this.validationError = `File vượt quá dung lượng cho phép (${this.formatFileSize(this.maxFileSizeBytes)}). Vui lòng nén hoặc giảm dung lượng.`;
      this.selectedFile = null;
      return;
    }

    // Lấy phần mở rộng của file (ví dụ: '.pdf')
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!this.allowedExtensions.includes(extension)) {
      this.validationError = `Định dạng file '${extension}' không hợp lệ. Chỉ chấp nhận các định dạng: ${this.allowedExtensions.join(', ')}.`;
      this.selectedFile = null;
      return;
    }

    // File thỏa mãn toàn bộ điều kiện -> Lưu lại để chuẩn bị nộp
    this.selectedFile = file;
  }

  // Hủy file đã chọn nếu sinh viên muốn chọn lại file khác
  cancelSelectedFile() {
    this.selectedFile = null;
    this.validationError = null;
  }

  upload() {
    if (this.selectedFile && this.canUpload) {
      this.fileUpload.emit({ file: this.selectedFile, type: this.selectedReportType });
      this.selectedFile = null;
      this.validationError = null;
    }
  }

  // Hàm định dạng dung lượng file hiển thị đẹp mắt (Bytes -> KB -> MB)
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

