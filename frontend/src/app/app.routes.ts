import { Routes } from '@angular/router';
import { AppLayoutComponent } from './shared/layouts/app-layout/app-layout';
import { authChildGuard, authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  // Đổi đường dẫn mặc định từ 'app' sang 'auth/login' để khi người dùng vào localhost:4200 sẽ tự động chuyển hướng đến trang đăng nhập
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },
  {
    path: 'app',
    component: AppLayoutComponent,
    canActivate: [authGuard],
    canActivateChild: [authChildGuard],
    children: [
      {
        path: 'registrations/:registrationId/progress',
        canActivate: [roleGuard],
        data: { roles: ['student', 'lecturer', 'admin'] },
        loadComponent: () => import('./features/progress/pages/progress-list-page/progress-list-page').then(m => m.ProgressListPageComponent)
      },
      {
        path: 'registrations/:registrationId/reports',
        canActivate: [roleGuard],
        data: { roles: ['student', 'lecturer', 'admin'] },
        loadComponent: () => import('./features/reports/pages/report-page/report-page').then(m => m.ReportPageComponent)
      },
      {
        path: 'councils',
        canActivate: [roleGuard],
        data: { roles: ['admin', 'lecturer'] },
        loadComponent: () => import('./features/councils/pages/council-list-page/council-list-page').then(m => m.CouncilListPageComponent)
      },
      {
        path: 'registrations/:registrationId/evaluation',
        canActivate: [roleGuard],
        data: { roles: ['lecturer', 'admin'] },
        loadComponent: () => import('./features/evaluation/pages/evaluation-page/evaluation-page').then(m => m.EvaluationPageComponent)
      },
      {
        path: 'registrations/:registrationId/final-results',
        canActivate: [roleGuard],
        data: { roles: ['student', 'admin'] },
        loadComponent: () => import('./features/evaluation/pages/final-results-page/final-results-page').then(m => m.FinalResultsPageComponent)
      },
      {
        path: 'users/new',
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
        loadComponent: () => import('./features/users/pages/user-form-page/user-form-page').then(m => m.UserFormPageComponent)
      },
      {
        path: 'users',
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
        loadComponent: () => import('./features/users/pages/user-list-page/user-list-page').then(m => m.UserListPageComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/users/pages/profile-page/profile-page').then(m => m.ProfilePageComponent)
      },
      {
        path: 'academic-periods',
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
        loadComponent: () => import('./features/academic-periods/pages/period-list-page/period-list-page').then(m => m.PeriodListPageComponent)
      },
      {
        path: 'topics',
        canActivate: [roleGuard],
        data: { roles: ['student', 'admin'] },
        loadComponent: () => import('./features/topics/pages/topic-list-page/topic-list-page').then(m => m.TopicListPageComponent)
      },
      {
        path: 'topics/my-topics',
        canActivate: [roleGuard],
        data: { roles: ['lecturer'] },
        loadComponent: () => import('./features/topics/pages/my-topics-page/my-topics-page').then(m => m.MyTopicsPageComponent)
      },
      {
        path: 'registrations/review',
        canActivate: [roleGuard],
        data: { roles: ['lecturer', 'admin'] },
        loadComponent: () => import('./features/topics/pages/review-registration-page/review-registration-page').then(m => m.ReviewRegistrationPageComponent)
      },
      {
        path: 'registrations/my',
        canActivate: [roleGuard],
        data: { roles: ['student'] },
        loadComponent: () => import('./features/topics/pages/my-registration-page/my-registration-page').then(m => m.MyRegistrationPageComponent)
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/pages/dashboard-page/dashboard-page').then(m => m.DashboardPageComponent)
      }
      // Các tính năng của Member A/B sẽ được lazy load tiếp ở đây
    ]
  },
  {
    path: 'auth/login',
    loadComponent: () => import('./features/auth/pages/login-page/login-page').then(m => m.LoginPageComponent)
  },
  { path: '**', redirectTo: 'auth/login' }
];
