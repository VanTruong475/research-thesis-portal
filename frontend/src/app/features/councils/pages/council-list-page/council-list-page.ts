import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CouncilService } from '../../services/council';
import { PeriodService } from '../../../academic-periods/services/period.service';
import { UserService } from '../../../users/services/user.service';
import { UserProfile } from '../../../users/models/user.model';
import { TopicService } from '../../../topics/services/topic.service';
import { Registration } from '../../../topics/models/topic.model';
import { Council, CouncilMember, CouncilMemberRole, CouncilStatus, CreateCouncilRequest, CouncilMemberAssignRequest, DefenseSchedule, DefenseScheduleCreateRequest } from '../../models/council.model';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';

@Component({
  selector: 'app-council-list-page',
  standalone: true,
  imports: [CommonModule, StatusBadge, DatePipe, FormsModule, ReactiveFormsModule],
  template: `
    <div class="p-8 max-w-7xl mx-auto h-full flex flex-col relative">
      <!-- Header -->
      <div class="flex justify-between items-end mb-8">
        <div>
          <h1 class="text-3xl font-display font-bold text-heading uppercase tracking-wider">
            Quản Lý Hội Đồng Bảo Vệ
          </h1>
          <p class="text-muted mt-2">Thành lập hội đồng, phân công giảng viên và xếp lịch bảo vệ</p>
        </div>
        
        <button class="ks-button ks-button-primary" (click)="openCreateCouncilDialog()">
          + Thành lập Hội đồng
        </button>
      </div>

      <div *ngIf="errorMessage" class="mb-6 p-4 bg-danger/10 border border-danger/20 text-danger text-sm rounded-sm">
        {{ errorMessage }}
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-2 gap-8 relative">
        <div *ngIf="isLoading" class="absolute inset-0 z-10 flex items-start justify-center pt-10">
          <span class="text-primary font-medium">Đang tải dữ liệu hội đồng...</span>
        </div>

        <div *ngFor="let council of getPaginatedCouncils()" class="ks-card p-0 overflow-hidden flex flex-col">
          <!-- Card Header -->
          <div class="p-6 border-b border-border-subtle bg-surface-deep flex justify-between items-start">
            <div>
              <div class="text-sm font-mono text-muted mb-1">{{ council.code }}</div>
              <h2 class="text-xl font-display font-bold text-primary">{{ council.name }}</h2>
            </div>
            <app-status-badge [type]="getCouncilStatusBadgeType(council.status)">
              {{ formatCouncilStatus(council.status) }}
            </app-status-badge>
          </div>

          <div class="p-6 flex-1 flex flex-col gap-6">
            <!-- Thành viên hội đồng -->
            <div>
              <h3 class="text-sm font-bold text-heading uppercase tracking-wider mb-3">Thành viên Hội đồng</h3>
              <ul class="space-y-2">
                <li *ngFor="let member of council.members" class="flex justify-between text-sm">
                  <span class="text-body font-medium">{{ formatMemberName(member) }}</span>
                  <span class="text-muted">{{ formatRole(member.member_role) }}</span>
                </li>
                <li *ngIf="council.members.length === 0" class="text-sm text-muted italic">Chưa phân công thành viên</li>
              </ul>
              <button class="mt-3 text-sm text-primary hover:underline font-medium" (click)="openAddMemberDialog(council.id)">+ Thêm thành viên</button>
            </div>

            <!-- Lịch bảo vệ -->
            <div class="flex-1">
              <h3 class="text-sm font-bold text-heading uppercase tracking-wider mb-3">Lịch bảo vệ ({{ council.schedules.length }})</h3>
              <div class="space-y-3">
                <div *ngFor="let schedule of council.schedules" class="p-3 border border-border-subtle rounded-sm bg-surface-deep">
                  <div class="font-medium text-body text-sm mb-1 truncate">{{ formatTopicTitle(schedule) }}</div>
                  <div class="text-xs text-muted mb-1">SV: <span class="font-medium">{{ formatStudentName(schedule) }}</span></div>
                  <div class="text-xs text-muted mb-2">GVHD: <span class="font-medium">{{ schedule.supervisor_full_name || 'Chưa rõ' }}</span></div>
                  <div class="flex justify-between items-center text-xs font-mono">
                    <span class="text-primary">{{ schedule.scheduled_at | date:'dd/MM/yyyy HH:mm' }} ({{ schedule.duration_minutes }}p)</span>
                    <span class="text-muted">Phòng: {{ schedule.room }}</span>
                  </div>
                </div>
                <div *ngIf="council.schedules.length === 0" class="text-sm text-muted italic p-3 border border-dashed border-border-subtle text-center">
                  Chưa xếp lịch bảo vệ
                </div>
              </div>
            </div>
          </div>

          <!-- Card Footer -->
          <div class="p-4 border-t border-border-subtle bg-surface-deep flex justify-end gap-3">
            <button class="text-sm font-medium text-muted hover:text-primary transition-colors underline">Chỉnh sửa</button>
            <button class="text-sm font-medium text-primary hover:text-primary/80 transition-colors underline" (click)="openAddScheduleDialog(council.id)">Xếp lịch</button>
          </div>
        </div>
      </div>

      <div *ngIf="!isLoading && getCouncilTotalPages() > 1" class="mt-6 flex items-center justify-center gap-3">
        <button
          type="button"
          class="ks-button ks-button-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          [disabled]="councilCurrentPage === 1"
          (click)="goToPreviousCouncilPage()">
          ‹ Trước
        </button>
        <span class="text-sm text-muted">
          Trang {{ councilCurrentPage }} / {{ getCouncilTotalPages() }} · Tổng {{ councilService.councils().length }} hội đồng
        </span>
        <button
          type="button"
          class="ks-button ks-button-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          [disabled]="councilCurrentPage === getCouncilTotalPages()"
          (click)="goToNextCouncilPage()">
          Sau ›
        </button>
      </div>

      <!-- Modal Thêm Hội Đồng -->
      <div *ngIf="activeDialog === 'council'" class="fixed inset-0 z-50 flex items-center justify-center bg-surface-deep/80 backdrop-blur-sm">
        <div class="ks-card w-full max-w-lg p-6 relative">
          <h2 class="text-2xl font-display font-bold text-heading mb-4">Thành Lập Hội Đồng</h2>
          <div *ngIf="dialogErrorMessage" class="mb-4 p-3 bg-danger/10 border border-danger/20 text-danger text-sm rounded-sm">
            {{ dialogErrorMessage }}
          </div>
          <form [formGroup]="councilForm" (ngSubmit)="onSubmitCouncil()" class="space-y-4">
            <div>
              <label class="ks-label">Mã Hội đồng *</label>
              <input type="text" formControlName="code" class="ks-input" placeholder="VD: HD-01">
            </div>
            <div>
              <label class="ks-label">Tên Hội đồng *</label>
              <input type="text" formControlName="name" class="ks-input" placeholder="VD: Hội đồng CNTT 1">
            </div>
            <div>
              <label class="ks-label">Phòng bảo vệ mặc định</label>
              <input type="text" formControlName="default_room" class="ks-input" placeholder="VD: Phòng A101">
            </div>
            <div>
              <label class="ks-label">Mô tả thêm</label>
              <textarea formControlName="description" class="ks-input h-20"></textarea>
            </div>
            <div class="pt-4 flex justify-end gap-3">
              <button type="button" class="ks-button ks-button-secondary" (click)="closeDialog()">Hủy</button>
              <button type="submit" class="ks-button ks-button-primary" [disabled]="councilForm.invalid || isSubmitting">Lưu</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal Thêm Thành Viên -->
      <div *ngIf="activeDialog === 'member'" class="fixed inset-0 z-50 flex items-center justify-center bg-surface-deep/80 backdrop-blur-sm">
        <div class="ks-card w-full max-w-md p-6 relative">
          <h2 class="text-2xl font-display font-bold text-heading mb-4">Thêm Thành Viên</h2>
          <div *ngIf="dialogErrorMessage" class="mb-4 p-3 bg-danger/10 border border-danger/20 text-danger text-sm rounded-sm">
            {{ dialogErrorMessage }}
          </div>
          <form [formGroup]="memberForm" (ngSubmit)="onSubmitMember()" class="space-y-4">
            <div>
              <label class="ks-label">Chọn giảng viên *</label>
              <input
                type="text"
                class="ks-input mb-3"
                placeholder="Tìm theo tên, mã giảng viên hoặc email"
                [(ngModel)]="lecturerSearchTerm"
                [ngModelOptions]="{ standalone: true }">

              <div *ngIf="isLoadingLecturers" class="text-sm text-primary py-3">
                Đang tải danh sách giảng viên...
              </div>

              <div *ngIf="!isLoadingLecturers" class="max-h-64 overflow-y-auto custom-scrollbar border border-border-subtle rounded-sm divide-y divide-border-subtle">
                <button
                  *ngFor="let lecturer of getFilteredLecturers()"
                  type="button"
                  class="w-full text-left p-3 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                  [ngClass]="getLecturerOptionClass(lecturer)"
                  [disabled]="isLecturerAlreadyInSelectedCouncil(lecturer.id)"
                  (click)="selectLecturer(lecturer)">
                  <div class="flex justify-between gap-3">
                    <div>
                      <div class="font-medium text-body">{{ formatLecturerOption(lecturer) }}</div>
                      <div class="text-xs text-muted mt-1">{{ lecturer.email }}</div>
                      <div *ngIf="lecturer.department" class="text-xs text-muted mt-1">{{ lecturer.department }}</div>
                    </div>
                    <span *ngIf="isLecturerAlreadyInSelectedCouncil(lecturer.id)" class="text-xs text-muted whitespace-nowrap">
                      Đã có trong hội đồng
                    </span>
                  </div>
                </button>

                <div *ngIf="getFilteredLecturers().length === 0" class="p-4 text-sm text-muted italic text-center">
                  Không tìm thấy giảng viên phù hợp.
                </div>
              </div>

              <div *ngIf="getSelectedLecturer() as selectedLecturer" class="mt-3 rounded-sm border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-body">
                Đã chọn: <span class="font-medium text-primary">{{ formatLecturerOption(selectedLecturer) }}</span>
              </div>
            </div>
            <div>
              <label class="ks-label">Vai trò trong Hội đồng *</label>
              <select formControlName="member_role" class="ks-input">
                <option value="chairperson">Chủ tịch</option>
                <option value="secretary">Thư ký</option>
                <option value="reviewer">Phản biện</option>
                <option value="member">Ủy viên</option>
              </select>
            </div>
            <div class="pt-4 flex justify-end gap-3">
              <button type="button" class="ks-button ks-button-secondary" (click)="closeDialog()">Hủy</button>
              <button type="submit" class="ks-button ks-button-primary" [disabled]="memberForm.invalid || isSubmitting">Lưu</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal Xếp Lịch -->
      <div *ngIf="activeDialog === 'schedule'" class="fixed inset-0 z-50 flex items-center justify-center bg-surface-deep/80 backdrop-blur-sm">
        <div class="ks-card w-full max-w-2xl p-6 relative">
          <h2 class="text-2xl font-display font-bold text-heading mb-4">Xếp Lịch Bảo Vệ</h2>
          <div *ngIf="dialogErrorMessage" class="mb-4 p-3 bg-danger/10 border border-danger/20 text-danger text-sm rounded-sm">
            {{ dialogErrorMessage }}
          </div>
          <form [formGroup]="scheduleForm" (ngSubmit)="onSubmitSchedule()" class="space-y-4">
            <div>
              <label class="ks-label">Chọn đăng ký đề tài *</label>
              <input
                type="text"
                class="ks-input mb-3"
                placeholder="Tìm theo sinh viên, mã đề tài, tên đề tài hoặc giảng viên hướng dẫn"
                [(ngModel)]="registrationSearchTerm"
                [ngModelOptions]="{ standalone: true }">

              <div *ngIf="isLoadingRegistrations" class="text-sm text-primary py-3">
                Đang tải danh sách đăng ký...
              </div>

              <div *ngIf="!isLoadingRegistrations" class="max-h-72 overflow-y-auto custom-scrollbar border border-border-subtle rounded-sm divide-y divide-border-subtle">
                <button
                  *ngFor="let registration of getFilteredScheduleRegistrations()"
                  type="button"
                  class="w-full text-left p-3 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                  [ngClass]="getScheduleRegistrationOptionClass(registration)"
                  [disabled]="isRegistrationAlreadyScheduled(registration.id)"
                  (click)="selectScheduleRegistration(registration)">
                  <div class="flex justify-between gap-3">
                    <div class="min-w-0">
                      <div class="font-medium text-body truncate">{{ formatScheduleRegistrationPrimary(registration) }}</div>
                      <div class="text-xs text-muted mt-1 truncate">Đề tài: {{ formatScheduleRegistrationTopic(registration) }}</div>
                      <div class="text-xs text-muted mt-1 truncate">GVHD: {{ formatScheduleRegistrationSupervisor(registration) }}</div>
                      <div class="text-xs text-muted mt-1">Kỳ: {{ formatScheduleRegistrationPeriod(registration) }}</div>
                    </div>
                    <span *ngIf="isRegistrationAlreadyScheduled(registration.id)" class="text-xs text-muted whitespace-nowrap">
                      Đã xếp lịch
                    </span>
                  </div>
                </button>

                <div *ngIf="getFilteredScheduleRegistrations().length === 0" class="p-4 text-sm text-muted italic text-center">
                  Không tìm thấy đăng ký đã duyệt phù hợp để xếp lịch.
                </div>
              </div>

              <div *ngIf="getSelectedScheduleRegistration() as selectedRegistration" class="mt-3 rounded-sm border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-body">
                Đã chọn: <span class="font-medium text-primary">{{ formatScheduleRegistrationPrimary(selectedRegistration) }}</span>
                <div class="text-xs text-muted mt-1">{{ formatScheduleRegistrationTopic(selectedRegistration) }}</div>
              </div>
            </div>
            <div>
              <label class="ks-label">Ngày giờ bảo vệ *</label>
              <input type="datetime-local" formControlName="scheduled_at" class="ks-input">
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="ks-label">Thời lượng (phút) *</label>
                <input type="number" formControlName="duration_minutes" class="ks-input">
              </div>
              <div>
                <label class="ks-label">Phòng bảo vệ *</label>
                <input type="text" formControlName="room" class="ks-input">
              </div>
            </div>
            <div>
              <label class="ks-label">Thứ tự trình bày</label>
              <input type="number" formControlName="presentation_order" class="ks-input" min="1">
            </div>
            <div>
              <label class="ks-label">Ghi chú</label>
              <textarea formControlName="note" class="ks-input h-20"></textarea>
            </div>
            <div class="pt-4 flex justify-end gap-3">
              <button type="button" class="ks-button ks-button-secondary" (click)="closeDialog()">Hủy</button>
              <button type="submit" class="ks-button ks-button-primary" [disabled]="scheduleForm.invalid || isSubmitting">Lưu</button>
            </div>
          </form>
        </div>
      </div>

    </div>
  `
})
export class CouncilListPageComponent implements OnInit {
  councilService = inject(CouncilService);
  periodService = inject(PeriodService);
  userService = inject(UserService);
  topicService = inject(TopicService);
  private fb = inject(FormBuilder);

  isLoading = false;
  isSubmitting = false;
  isLoadingLecturers = false;
  isLoadingRegistrations = false;
  errorMessage = '';
  dialogErrorMessage = '';
  lecturerSearchTerm = '';
  registrationSearchTerm = '';

  activeDialog: 'none' | 'council' | 'member' | 'schedule' = 'none';
  selectedCouncilId: string | null = null;

  councilForm!: FormGroup;
  memberForm!: FormGroup;
  scheduleForm!: FormGroup;

  activePeriodId: string | null = null;
  councilCurrentPage = 1;
  readonly councilPageSize = 4;

  ngOnInit() {
    this.initForms();
    this.loadActivePeriod();
  }

  loadActivePeriod() {
    this.isLoading = true;
    this.errorMessage = '';
    this.periodService.fetchPeriods(1, 1).subscribe({
      next: (res) => {
        if (res.data && res.data.items.length > 0) {
          this.activePeriodId = res.data.items[0].id;
          this.loadCouncils();
        } else {
          this.isLoading = false;
          this.errorMessage = 'Chưa có học kỳ/đợt bảo vệ để tải hội đồng.';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = this.getErrorMessage(err, 'Không thể tải đợt bảo vệ.');
      }
    });
  }

  loadCouncils() {
    if (!this.activePeriodId) return;
    this.isLoading = true;
    this.councilService.getCouncilsByPeriod(this.activePeriodId).subscribe({
      next: () => {
        this.isLoading = false;
        this.ensureValidCouncilPage();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = this.getErrorMessage(err, 'Không thể tải dữ liệu hội đồng.');
      }
    });
  }

  getPaginatedCouncils(): Council[] {
    const startIndex = (this.councilCurrentPage - 1) * this.councilPageSize;
    return this.councilService.councils().slice(startIndex, startIndex + this.councilPageSize);
  }

  getCouncilTotalPages(): number {
    return Math.max(1, Math.ceil(this.councilService.councils().length / this.councilPageSize));
  }

  goToPreviousCouncilPage() {
    if (this.councilCurrentPage <= 1) return;
    this.councilCurrentPage -= 1;
  }

  goToNextCouncilPage() {
    if (this.councilCurrentPage >= this.getCouncilTotalPages()) return;
    this.councilCurrentPage += 1;
  }

  ensureValidCouncilPage() {
    if (this.councilCurrentPage > this.getCouncilTotalPages()) {
      this.councilCurrentPage = this.getCouncilTotalPages();
    }
  }

  loadLecturers() {
    this.isLoadingLecturers = true;
    this.userService.fetchUsers(1, 100).subscribe({
      next: () => this.isLoadingLecturers = false,
      error: (err) => {
        this.isLoadingLecturers = false;
        this.dialogErrorMessage = this.getErrorMessage(err, 'Không thể tải danh sách giảng viên.');
      }
    });
  }

  getFilteredLecturers(): UserProfile[] {
    const keyword = this.lecturerSearchTerm.trim().toLowerCase();
    return this.userService.users()
      .filter(user => user.role === 'lecturer' && user.status === 'active')
      .filter(user => {
        if (!keyword) return true;
        return user.full_name.toLowerCase().includes(keyword)
          || user.institutional_code.toLowerCase().includes(keyword)
          || user.email.toLowerCase().includes(keyword)
          || (user.department || '').toLowerCase().includes(keyword);
      });
  }

  getSelectedCouncil() {
    if (!this.selectedCouncilId) return null;
    return this.councilService.councils().find(council => council.id === this.selectedCouncilId) || null;
  }

  getSelectedLecturer(): UserProfile | undefined {
    const lecturerId = this.memberForm.get('lecturer_id')?.value;
    if (!lecturerId) return undefined;
    return this.userService.users().find(user => user.id === lecturerId);
  }

  selectLecturer(lecturer: UserProfile) {
    if (this.isLecturerAlreadyInSelectedCouncil(lecturer.id)) return;
    this.memberForm.patchValue({ lecturer_id: lecturer.id });
  }

  isLecturerAlreadyInSelectedCouncil(lecturerId: string): boolean {
    return this.getSelectedCouncil()?.members.some(member =>
      member.lecturer_id === lecturerId && member.status !== 'removed'
    ) || false;
  }

  getLecturerOptionClass(lecturer: UserProfile): string {
    if (this.isLecturerAlreadyInSelectedCouncil(lecturer.id)) {
      return 'bg-surface-deep text-muted';
    }
    if (this.memberForm.get('lecturer_id')?.value === lecturer.id) {
      return 'bg-primary/10 border-l-4 border-primary';
    }
    return 'hover:bg-surface-raised';
  }

  formatLecturerOption(lecturer: UserProfile): string {
    return `${lecturer.institutional_code} - ${lecturer.full_name}`;
  }

  loadScheduleRegistrations() {
    this.isLoadingRegistrations = true;
    this.topicService.fetchLecturerRegistrations(1, 100).subscribe({
      next: () => this.isLoadingRegistrations = false,
      error: (err) => {
        this.isLoadingRegistrations = false;
        this.dialogErrorMessage = this.getErrorMessage(err, 'Không thể tải danh sách đăng ký để xếp lịch.');
      }
    });
  }

  getFilteredScheduleRegistrations(): Registration[] {
    const keyword = this.registrationSearchTerm.trim().toLowerCase();
    return this.topicService.registrations()
      .filter(registration => registration.academic_period_id === this.activePeriodId)
      .filter(registration => registration.status === 'approved')
      .filter(registration => !!registration.supervisor_id)
      .filter(registration => {
        if (!keyword) return true;
        return [
          registration.student_full_name,
          registration.student_institutional_code,
          registration.topic_title,
          registration.topic_code,
          registration.academic_period_name,
          registration.academic_period_code,
          registration.supervisor_full_name,
          registration.supervisor_institutional_code
        ].some(value => (value || '').toLowerCase().includes(keyword));
      });
  }

  getSelectedScheduleRegistration(): Registration | undefined {
    const registrationId = this.scheduleForm.get('registration_id')?.value;
    if (!registrationId) return undefined;
    return this.topicService.registrations().find(registration => registration.id === registrationId);
  }

  selectScheduleRegistration(registration: Registration) {
    if (this.isRegistrationAlreadyScheduled(registration.id)) return;
    this.scheduleForm.patchValue({ registration_id: registration.id });
  }

  isRegistrationAlreadyScheduled(registrationId: string): boolean {
    return this.councilService.councils().some(council =>
      council.academic_period_id === this.activePeriodId
      && council.schedules.some(schedule => schedule.registration_id === registrationId && schedule.status !== 'cancelled')
    );
  }

  getScheduleRegistrationOptionClass(registration: Registration): string {
    if (this.isRegistrationAlreadyScheduled(registration.id)) {
      return 'bg-surface-deep text-muted';
    }
    if (this.scheduleForm.get('registration_id')?.value === registration.id) {
      return 'bg-primary/10 border-l-4 border-primary';
    }
    return 'hover:bg-surface-raised';
  }

  formatScheduleRegistrationPrimary(registration: Registration): string {
    const name = registration.student_full_name || registration.studentName || 'Sinh viên chưa rõ';
    return registration.student_institutional_code
      ? `${registration.student_institutional_code} - ${name}`
      : name;
  }

  formatScheduleRegistrationTopic(registration: Registration): string {
    const title = registration.topic_title || registration.topicName || 'Đề tài chưa rõ';
    return registration.topic_code ? `${registration.topic_code} - ${title}` : title;
  }

  formatScheduleRegistrationSupervisor(registration: Registration): string {
    const name = registration.supervisor_full_name || 'Chưa rõ';
    return registration.supervisor_institutional_code
      ? `${registration.supervisor_institutional_code} - ${name}`
      : name;
  }

  formatScheduleRegistrationPeriod(registration: Registration): string {
    const name = registration.academic_period_name || 'Chưa cập nhật';
    return registration.academic_period_code ? `${registration.academic_period_code} - ${name}` : name;
  }

  initForms() {
    this.councilForm = this.fb.group({
      code: ['', Validators.required],
      name: ['', Validators.required],
      description: [''],
      default_room: ['']
    });

    this.memberForm = this.fb.group({
      lecturer_id: ['', Validators.required],
      member_role: ['member', Validators.required]
    });

    this.scheduleForm = this.fb.group({
      registration_id: ['', Validators.required],
      scheduled_at: ['', Validators.required],
      duration_minutes: [45, [Validators.required, Validators.min(15), Validators.max(180)]],
      room: ['', Validators.required],
      presentation_order: [null, Validators.min(1)],
      note: ['']
    });
  }

  openCreateCouncilDialog() {
    this.errorMessage = '';
    this.dialogErrorMessage = '';
    this.councilForm.reset();
    this.activeDialog = 'council';
  }

  openAddMemberDialog(councilId: string) {
    this.errorMessage = '';
    this.dialogErrorMessage = '';
    this.selectedCouncilId = councilId;
    this.lecturerSearchTerm = '';
    this.memberForm.reset({ lecturer_id: '', member_role: 'member' });
    this.activeDialog = 'member';
    this.loadLecturers();
  }

  openAddScheduleDialog(councilId: string) {
    this.errorMessage = '';
    this.dialogErrorMessage = '';
    this.selectedCouncilId = councilId;
    this.registrationSearchTerm = '';
    this.scheduleForm.reset({ registration_id: '', duration_minutes: 45, presentation_order: null, note: '' });
    this.activeDialog = 'schedule';
    this.loadScheduleRegistrations();
  }

  closeDialog() {
    this.activeDialog = 'none';
    this.selectedCouncilId = null;
    this.dialogErrorMessage = '';
  }

  onSubmitCouncil() {
    if (this.councilForm.invalid || !this.activePeriodId) return;
    this.isSubmitting = true;
    this.dialogErrorMessage = '';
    const payload: CreateCouncilRequest = {
      ...this.councilForm.value,
      academic_period_id: this.activePeriodId
    };

    this.councilService.createCouncil(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.closeDialog();
        this.loadCouncils();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.dialogErrorMessage = this.getErrorMessage(err, 'Không thể thành lập hội đồng.');
      }
    });
  }

  onSubmitMember() {
    if (this.memberForm.invalid || !this.selectedCouncilId) return;
    this.isSubmitting = true;
    this.dialogErrorMessage = '';
    const payload = this.memberForm.value as CouncilMemberAssignRequest;

    this.councilService.assignMember(this.selectedCouncilId, payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.closeDialog();
        this.loadCouncils();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.dialogErrorMessage = this.getErrorMessage(err, 'Không thể thêm thành viên hội đồng.');
      }
    });
  }

  onSubmitSchedule() {
    if (this.scheduleForm.invalid || !this.selectedCouncilId) return;
    this.isSubmitting = true;
    this.dialogErrorMessage = '';
    const payload = this.scheduleForm.value as DefenseScheduleCreateRequest;

    if (payload.scheduled_at) {
      payload.scheduled_at = new Date(payload.scheduled_at).toISOString();
    }
    if (!payload.presentation_order) {
      payload.presentation_order = null;
    }

    this.councilService.createDefenseSchedule(this.selectedCouncilId, payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.closeDialog();
        this.loadCouncils();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.dialogErrorMessage = this.getErrorMessage(err, 'Không thể xếp lịch bảo vệ.');
      }
    });
  }

  formatCouncilStatus(status: CouncilStatus): string {
    const statusMap: Record<CouncilStatus, string> = {
      draft: 'Bản nháp',
      scheduled: 'Đã lên lịch',
      in_progress: 'Đang diễn ra (cũ)',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy'
    };
    return statusMap[status] || status;
  }

  getCouncilStatusBadgeType(status: CouncilStatus): 'success' | 'warning' | 'danger' | 'neutral' {
    if (status === 'scheduled') return 'success';
    if (status === 'draft') return 'warning';
    if (status === 'cancelled') return 'danger';
    return 'neutral';
  }

  formatRole(role: CouncilMemberRole): string {
    const roles: Record<CouncilMemberRole, string> = {
      chairperson: 'Chủ tịch',
      secretary: 'Thư ký',
      reviewer: 'Phản biện',
      member: 'Ủy viên'
    };
    return roles[role] || role;
  }

  formatMemberName(member: CouncilMember): string {
    const name = member.lecturer_full_name || member.lecturer_id;
    return member.lecturer_institutional_code
      ? `${name} (${member.lecturer_institutional_code})`
      : name;
  }

  formatTopicTitle(schedule: DefenseSchedule): string {
    if (schedule.topic_code && schedule.topic_title) {
      return `${schedule.topic_code} - ${schedule.topic_title}`;
    }
    return schedule.topic_title || 'Đề tài chưa rõ';
  }

  formatStudentName(schedule: DefenseSchedule): string {
    const name = schedule.student_full_name || 'Sinh viên chưa rõ';
    return schedule.student_institutional_code
      ? `${name} (${schedule.student_institutional_code})`
      : name;
  }

  private getErrorMessage(err: any, fallback: string): string {
    return err?.error?.message || err?.error?.error?.message || fallback;
  }
}
