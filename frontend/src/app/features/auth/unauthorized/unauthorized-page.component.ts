import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-unauthorized-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="mx-auto max-w-3xl">
      <div class="rounded-lg border border-warning/30 bg-warning-soft p-6 shadow-sm">
        <p class="text-sm font-medium text-warning">Access restricted</p>
        <h2 class="mt-2 text-2xl font-semibold tracking-tight text-foreground">You do not have permission to view this page.</h2>
        <p class="mt-3 text-base leading-7 text-text-secondary">
          Your current role cannot access this route. Backend authorization remains the source of truth for protected data and actions.
        </p>
        <a
          class="mt-6 inline-flex min-h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-text-inverse transition hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          routerLink="/app/dashboard"
        >
          Return to dashboard
        </a>
      </div>
    </section>
  `,
})
export class UnauthorizedPageComponent {}
