import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CouncilCardComponent } from '../../components/council-card/council-card';
import { CouncilService } from '../../services/council';
import { AuthService } from '../../../../core/services/auth';

@Component({
  selector: 'app-council-list-page',
  standalone: true,
  imports: [CommonModule, CouncilCardComponent],
  template: `
    <div class="max-w-5xl mx-auto">
      <div class="mb-8 flex justify-between items-end">
        <div>
          <h1 class="text-3xl font-display font-bold text-champagne mb-2">Quản lý Hội đồng</h1>
          <p class="text-muted">Xem và quản lý lịch bảo vệ của các hội đồng đánh giá luận văn.</p>
        </div>
        
        <!-- Nút tạo hội đồng (chỉ Admin) -->
        <button *ngIf="isAdmin" class="ks-button ks-button-primary">
          <svg class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Tạo Hội đồng mới
        </button>
      </div>

      <!-- Vòng lặp hiển thị danh sách hội đồng -->
      <div class="space-y-8">
        <app-council-card 
          *ngFor="let council of councilService.councils()" 
          [council]="council">
        </app-council-card>
        
        <div *ngIf="councilService.councils().length === 0" class="text-center py-12 text-muted ks-card">
          Chưa có hội đồng nào được thành lập trong kỳ này.
        </div>
      </div>
    </div>
  `
})
export class CouncilListPageComponent implements OnInit {
  councilService = inject(CouncilService);
  authService = inject(AuthService);

  get isAdmin(): boolean {
    const user = this.authService.currentUser();
    return !!user && user.role === 'admin';
  }

  ngOnInit() {
    // Trong thực tế sẽ gọi API để fetch danh sách hội đồng
  }
}
