import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../../components/sidebar/sidebar';
import { HeaderComponent } from '../../components/header/header';

@Component({
  selector: 'app-app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, HeaderComponent],
  template: `
    <div class="flex h-screen w-full bg-lacquer text-body overflow-hidden">
      <!-- Sidebar bên trái -->
      <app-sidebar></app-sidebar>
      
      <!-- Cột chính bên phải -->
      <div class="flex-1 flex flex-col h-full overflow-hidden">
        <!-- Header -->
        <app-header></app-header>
        
        <!-- Khu vực hiển thị tính năng (Progress, Reports, v.v.) -->
        <main class="flex-1 overflow-y-auto p-8">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `
})
export class AppLayoutComponent {}
