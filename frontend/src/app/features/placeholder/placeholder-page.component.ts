import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-placeholder-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="mx-auto max-w-7xl">
      <div class="rounded-lg border border-border-subtle bg-surface p-6 shadow-sm">
        <p class="text-sm font-medium text-primary">Module placeholder</p>
        <h2 class="mt-2 text-2xl font-semibold tracking-tight text-foreground">{{ title }}</h2>
        <p class="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">{{ description }}</p>
        <p class="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">
          This branch only adds authentication, protected routing, and the shared app shell. The business feature UI and API integration for this module are intentionally excluded.
        </p>
        <a
          class="mt-6 inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-primary transition hover:bg-primary-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          routerLink="/app/dashboard"
        >
          Back to dashboard
        </a>
      </div>
    </section>
  `,
})
export class PlaceholderPageComponent {
  private readonly route = inject(ActivatedRoute);

  protected readonly title = this.route.snapshot.data['title'] ?? 'Module';
  protected readonly description = this.route.snapshot.data['description'] ?? 'This module will be implemented in a later branch.';
}
