import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="mx-auto max-w-7xl">
      <div class="rounded-lg border border-border-subtle bg-surface p-6 shadow-sm">
        <p class="text-sm font-medium text-primary">Dashboard</p>
        <h2 class="mt-2 text-2xl font-semibold tracking-tight text-foreground">Welcome to the thesis workspace</h2>
        <p class="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">
          Authentication and role-aware navigation are ready. Business dashboards and module data will be implemented in their own branches.
        </p>
      </div>

      <div class="mt-6 grid gap-4 md:grid-cols-3" *ngIf="authService.currentUser$ | async as user">
        <article class="rounded-lg border border-border-subtle bg-surface p-5 shadow-sm">
          <p class="text-sm font-medium text-muted-foreground">Account</p>
          <p class="mt-2 text-lg font-semibold text-foreground">{{ user.full_name }}</p>
          <p class="mt-1 text-sm text-muted-foreground">{{ user.institutional_code }}</p>
        </article>
        <article class="rounded-lg border border-border-subtle bg-surface p-5 shadow-sm">
          <p class="text-sm font-medium text-muted-foreground">Role</p>
          <p class="mt-2 text-lg font-semibold capitalize text-foreground">{{ user.role }}</p>
          <p class="mt-1 text-sm text-muted-foreground">Navigation is filtered for this role.</p>
        </article>
        <article class="rounded-lg border border-border-subtle bg-surface p-5 shadow-sm">
          <p class="text-sm font-medium text-muted-foreground">Status</p>
          <p class="mt-2 text-lg font-semibold capitalize text-success">{{ user.status }}</p>
          <p class="mt-1 text-sm text-muted-foreground">Current user details come from the auth API contract.</p>
        </article>
      </div>
    </section>
  `,
})
export class DashboardPageComponent {
  protected readonly authService = inject(AuthService);
}
