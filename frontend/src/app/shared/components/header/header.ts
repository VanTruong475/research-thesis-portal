import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="h-16 flex items-center justify-between px-6 border-b border-hairline bg-lacquer">
      <div>
        <!-- Trống, có thể để Breadcrumb ở đây sau này -->
      </div>
      
      <!-- Thông tin user góc phải -->
      <div class="flex items-center space-x-4" *ngIf="auth.currentUser() as user">
        <div class="text-right">
          <div class="text-sm font-medium text-champagne">{{ user.name }}</div>
          <div class="text-xs text-patina uppercase tracking-wider">{{ user.role }}</div>
        </div>
        <div class="w-8 h-8 rounded-full bg-raised-lacquer border border-hairline flex items-center justify-center text-kinpaku font-bold">
          {{ user.name.charAt(0) }}
        </div>
      </div>
    </header>
  `
})
export class HeaderComponent {
  auth = inject(AuthService);
}
