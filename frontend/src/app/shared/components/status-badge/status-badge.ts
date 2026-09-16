import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeType = 'success' | 'warning' | 'danger' | 'secondary' | 'neutral';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-sans border"
      [ngClass]="badgeClasses"
    >
      <span *ngIf="showDot" class="w-1.5 h-1.5 rounded-full mr-1.5" [ngClass]="dotClasses"></span>
      <ng-content></ng-content>
    </span>
  `,
})
export class StatusBadge {
  @Input() type: BadgeType = 'neutral';
  @Input() showDot: boolean = true;

  get badgeClasses(): string {
    switch (this.type) {
      case 'success':
        return 'bg-success/10 text-success border-success/20';
      case 'warning':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'danger':
        return 'bg-danger/10 text-danger border-danger/20';
      case 'secondary':
        return 'bg-secondary/10 text-secondary border-secondary/20';
      case 'neutral':
      default:
        return 'bg-graphite text-muted border-border-subtle';
    }
  }

  get dotClasses(): string {
    switch (this.type) {
      case 'success':
        return 'bg-success';
      case 'warning':
        return 'bg-warning';
      case 'danger':
        return 'bg-danger';
      case 'secondary':
        return 'bg-secondary';
      case 'neutral':
      default:
        return 'bg-muted';
    }
  }
}
