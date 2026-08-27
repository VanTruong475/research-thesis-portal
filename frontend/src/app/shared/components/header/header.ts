import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="h-16 flex items-center justify-between px-6 border-b border-border-subtle bg-surface">
      <div>
        <!-- Trống, có thể để Breadcrumb ở đây sau này -->
      </div>
      
      <!-- Thông tin user góc phải -->
      <div class="flex items-center space-x-4" *ngIf="auth.currentUser() as user">
        <div class="flex items-center gap-4">
          <!-- Toggle Theme Button -->
          <button 
            (click)="themeService.toggleTheme()"
            class="w-8 h-8 rounded-full border border-border-subtle flex items-center justify-center text-muted hover:text-primary hover:border-primary transition-colors bg-surface-raised"
            title="Đổi giao diện Sáng/Tối">
            {{ themeService.currentTheme() === 'dark' ? '☀️' : '🌙' }}
          </button>

          <div class="text-right">
            <div class="text-sm font-medium text-heading">{{ user.name }}</div>
            <div class="text-xs text-secondary uppercase tracking-wider">{{ user.role }}</div>
          </div>
          <div class="w-8 h-8 rounded-full bg-surface-raised border border-border-subtle flex items-center justify-center text-primary font-bold">
            {{ user.name.charAt(0) }}
          </div>
        </div>
      </div>
    </header>
  `
})
export class HeaderComponent {
  auth = inject(AuthService);
  themeService = inject(ThemeService);
}
