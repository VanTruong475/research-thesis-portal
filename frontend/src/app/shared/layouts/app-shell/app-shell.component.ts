import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, finalize, map, startWith } from 'rxjs';

import { NavigationGroup, navigationForRole } from '../../../core/constants/navigation.constants';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app-shell.component.html',
})
export class AppShellComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly currentUser$ = this.authService.currentUser$;
  protected readonly pageTitle$ = this.router.events.pipe(
    filter((event): event is NavigationEnd => event instanceof NavigationEnd),
    startWith(null),
    map(() => this.currentPageTitle()),
  );

  protected readonly exactActiveOptions = { exact: true };
  protected readonly nonExactActiveOptions = { exact: false };
  protected navigationGroups: readonly NavigationGroup[] = [];
  protected isCurrentUserLoading = true;
  protected isMobileSidebarOpen = false;

  ngOnInit(): void {
    this.authService
      .loadCurrentUser()
      .pipe(finalize(() => (this.isCurrentUserLoading = false)))
      .subscribe({
        next: (user) => {
          this.navigationGroups = navigationForRole(user.role);
        },
        error: () => {
          this.authService.clearSession();
          void this.router.navigate(['/login']);
        },
      });
  }

  protected closeMobileSidebar(): void {
    this.isMobileSidebarOpen = false;
  }

  protected toggleMobileSidebar(): void {
    this.isMobileSidebarOpen = !this.isMobileSidebarOpen;
  }

  protected logout(): void {
    this.authService.logout().subscribe(() => {
      void this.router.navigate(['/login']);
    });
  }

  private currentPageTitle(): string {
    let child = this.route.firstChild;
    while (child?.firstChild) {
      child = child.firstChild;
    }

    return child?.snapshot.data['title'] ?? 'Dashboard';
  }
}
