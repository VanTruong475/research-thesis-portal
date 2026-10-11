import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';

export type ActionDialogVariant = 'primary' | 'danger' | 'warning';

@Component({
  selector: 'app-action-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div *ngIf="open" class="fixed inset-0 z-50 flex items-center justify-center bg-surface-deep/80 backdrop-blur-sm p-4">
      <div class="ks-card w-full max-w-lg p-6 relative">
        <h2 class="text-2xl font-display font-bold text-heading mb-3">{{ title }}</h2>
        <p class="text-body text-sm leading-6 mb-5 whitespace-pre-line">{{ message }}</p>

        <div *ngIf="textareaLabel" class="mb-5">
          <label class="ks-label">{{ textareaLabel }}</label>
          <textarea
            class="ks-input min-h-[110px]"
            [(ngModel)]="textareaValue"
            [placeholder]="textareaPlaceholder || ''"></textarea>
          <p *ngIf="validationMessage" class="text-danger text-sm mt-2">{{ validationMessage }}</p>
        </div>

        <div class="pt-5 border-t border-border-subtle flex justify-end gap-3">
          <button type="button" class="ks-button ks-button-secondary" (click)="onCancel()">
            {{ cancelLabel }}
          </button>
          <button type="button" class="ks-button" [ngClass]="confirmButtonClass" (click)="onConfirm()">
            {{ confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class ActionDialogComponent implements OnChanges {
  @Input() open = false;
  @Input() title = 'Xác nhận thao tác';
  @Input() message = '';
  @Input() confirmLabel = 'Xác nhận';
  @Input() cancelLabel = 'Hủy';
  @Input() variant: ActionDialogVariant = 'primary';
  @Input() textareaLabel = '';
  @Input() textareaPlaceholder = '';
  @Input() textareaRequired = false;

  @Output() confirmed = new EventEmitter<string>();
  @Output() cancelled = new EventEmitter<void>();

  textareaValue = '';
  validationMessage = '';

  ngOnChanges(changes: SimpleChanges) {
    if (changes['open']?.currentValue) {
      this.textareaValue = '';
      this.validationMessage = '';
    }
  }

  get confirmButtonClass(): string {
    if (this.variant === 'danger') return 'ks-button-secondary text-danger';
    if (this.variant === 'warning') return 'ks-button-secondary text-warning';
    return 'ks-button-primary';
  }

  onCancel() {
    this.cancelled.emit();
  }

  onConfirm() {
    const value = this.textareaValue.trim();
    if (this.textareaRequired && !value) {
      this.validationMessage = 'Vui lòng nhập nội dung bắt buộc.';
      return;
    }

    this.confirmed.emit(value);
  }
}
