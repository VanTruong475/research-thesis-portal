import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Council } from '../../models/council.model';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';

@Component({
  selector: 'app-council-card',
  standalone: true,
  imports: [CommonModule, StatusBadge],
  template: `
    <div class="ks-card mb-6">
      <!-- Header Hội đồng -->
      <div class="flex items-center justify-between mb-4 pb-4 border-b border-hairline">
        <div>
          <h3 class="text-xl font-display font-medium text-champagne">{{ council.name }}</h3>
          <p class="text-xs text-muted font-mono mt-1">ID: {{ council.id }}</p>
        </div>
        <app-status-badge [type]="council.status === 'Published' ? 'success' : (council.status === 'Completed' ? 'neutral' : 'warning')">
          {{ council.status === 'Published' ? 'Đã công bố' : (council.status === 'Completed' ? 'Đã hoàn tất' : 'Bản nháp') }}
        </app-status-badge>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Cột trái: Thành viên Hội đồng -->
        <div>
          <h4 class="text-sm font-bold uppercase tracking-wider text-patina mb-4 flex items-center">
            <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Thành viên Hội đồng
          </h4>
          
          <ul class="space-y-3">
            <li *ngFor="let member of council.members" class="flex justify-between items-center p-2 rounded hover:bg-lacquer-deep transition-colors">
              <span class="text-body font-medium">{{ member.name }}</span>
              <span class="text-xs px-2 py-1 bg-raised-lacquer border border-hairline rounded text-muted">
                {{ member.role_in_council }}
              </span>
            </li>
            <li *ngIf="council.members.length === 0" class="text-sm text-muted italic p-2">
              Chưa phân công thành viên.
            </li>
          </ul>
        </div>

        <!-- Cột phải: Lịch bảo vệ -->
        <div>
          <h4 class="text-sm font-bold uppercase tracking-wider text-kinpaku mb-4 flex items-center">
            <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Lịch Bảo vệ
          </h4>
          
          <div class="space-y-4">
            <div *ngFor="let schedule of council.schedules" class="bg-lacquer-deep p-3 rounded-sm border-l-2 border-kinpaku">
              <div class="font-medium text-champagne text-sm mb-1 line-clamp-1" [title]="schedule.topic_name">
                {{ schedule.topic_name }}
              </div>
              <div class="text-body text-sm mb-2 flex items-center">
                <svg class="w-3.5 h-3.5 mr-1 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {{ schedule.student_name }}
              </div>
              <div class="flex items-center justify-between text-xs text-muted">
                <span class="flex items-center">
                  <svg class="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {{ schedule.defense_date | date:'dd/MM/yyyy HH:mm' }}
                </span>
                <span class="flex items-center">
                  <svg class="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {{ schedule.location }}
                </span>
              </div>
            </div>
            
            <div *ngIf="council.schedules.length === 0" class="text-sm text-muted italic p-2 bg-lacquer-deep rounded-sm text-center">
              Chưa có sinh viên nào được xếp lịch.
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CouncilCardComponent {
  @Input() council!: Council;
}
