import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService, UserRole } from '../../../core/services/auth';

interface MenuItem {
  label: string;
  route: string;
  icon?: string;
  roles: UserRole[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="w-64 h-full border-r border-border-subtle bg-surface flex flex-col">
      <!-- Logo/Brand Area -->
      <div class="h-16 flex items-center px-6 border-b border-border-subtle">
        <span class="text-primary font-display font-medium text-xl uppercase tracking-widest">Thesis Portal</span>
      </div>

      <!-- Navigation Links -->
      <nav class="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
        <ng-container *ngFor="let item of visibleMenuItems()">
          <a
            [routerLink]="item.route"
            routerLinkActive="bg-primary/10 text-primary border-primary"
            class="flex items-center px-4 py-2.5 rounded-sm font-sans text-sm text-body hover:text-primary hover:bg-raised-surface transition-colors border border-transparent"
          >
            {{ item.label }}
          </a>
        </ng-container>
      </nav>

      <!-- Logout (Bottom) -->
      <div class="p-4 border-t border-border-subtle">
        <button
          (click)="auth.logout()"
          class="w-full flex items-center px-4 py-2 rounded-sm font-sans text-sm text-muted hover:text-danger hover:bg-danger/10 transition-colors"
        >
          Đăng xuất
        </button>
      </div>
    </aside>
  `
})
export class SidebarComponent {
  auth = inject(AuthService);

  private readonly allMenus: MenuItem[] = [
    // Admin
    { label: 'Quản lý Người dùng', route: '/app/users', roles: ['admin'] },
    { label: 'Kỳ học', route: '/app/academic-periods', roles: ['admin'] },
    { label: 'Quản lý Hội đồng', route: '/app/councils', roles: ['admin'] },
    
    // Lecturer
    { label: 'Đề tài của tôi', route: '/app/topics/my-topics', roles: ['lecturer'] },
    { label: 'Duyệt đăng ký', route: '/app/registrations/review', roles: ['lecturer'] },
    { label: 'Tiến độ hướng dẫn', route: '/app/progress/supervised', roles: ['lecturer'] },
    { label: 'Chấm điểm', route: '/app/evaluation', roles: ['lecturer', 'admin'] },

    // Student
    { label: 'Danh sách Đề tài', route: '/app/topics', roles: ['student', 'admin'] },
    { label: 'Đăng ký của tôi', route: '/app/registrations/my', roles: ['student'] },
    { label: 'Tiến độ', route: '/app/progress', roles: ['student'] },
    
    // Shared
    { label: 'Báo cáo', route: '/app/reports', roles: ['student', 'lecturer'] },
    { label: 'Kết quả cuối cùng', route: '/app/final-results', roles: ['student', 'admin'] },
    { label: 'Hồ sơ cá nhân', route: '/app/profile', roles: ['student', 'lecturer', 'admin'] },
  ];

  // Computed signal để lọc menu theo role hiện tại
  visibleMenuItems = computed(() => {
    const user = this.auth.currentUser();
    if (!user) return [];
    return this.allMenus.filter(item => item.roles.includes(user.role));
  });
}
