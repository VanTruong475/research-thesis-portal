import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../../components/sidebar/sidebar';
import { HeaderComponent } from '../../components/header/header';
import { LayoutService } from '../../services/layout.service';

@Component({
  selector: 'app-app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, HeaderComponent],
  template: `
    <div class="flex h-screen w-full bg-surface text-body overflow-hidden relative">
      <!-- Overlay trên mobile khi mở sidebar -->
      <div 
        *ngIf="layout.isSidebarOpen()" 
        (click)="layout.closeSidebar()"
        class="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm transition-opacity">
      </div>

      <!-- Sidebar bên trái -->
      <div [ngClass]="layout.isSidebarOpen() ? 'translate-x-0' : '-translate-x-full'"
           class="fixed inset-y-0 left-0 z-30 w-64 md:relative md:translate-x-0 transition-transform duration-300 ease-in-out">
        <app-sidebar></app-sidebar>
      </div>
      
      <!-- Cột chính bên phải -->
      <div class="flex-1 flex flex-col h-full overflow-hidden w-full">
        <!-- Header -->
        <app-header></app-header>
        
        <!-- Khu vực hiển thị tính năng -->
        <main class="flex-1 overflow-y-auto p-4 md:p-8">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `
})
export class AppLayoutComponent {
  layout = inject(LayoutService);
}
