import { Routes } from '@angular/router';
import { AppLayoutComponent } from './shared/layouts/app-layout/app-layout';

export const routes: Routes = [
  { path: '', redirectTo: 'app', pathMatch: 'full' },
  {
    path: 'app',
    component: AppLayoutComponent,
    children: [
      {
        path: 'progress',
        loadComponent: () => import('./features/progress/pages/progress-list-page/progress-list-page').then(m => m.ProgressListPageComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/reports/pages/report-page/report-page').then(m => m.ReportPageComponent)
      },
      {
        path: 'councils',
        loadComponent: () => import('./features/councils/pages/council-list-page/council-list-page').then(m => m.CouncilListPageComponent)
      },
      {
        path: 'evaluation',
        loadComponent: () => import('./features/evaluation/pages/evaluation-page/evaluation-page').then(m => m.EvaluationPageComponent)
      },
      {
        path: 'final-results',
        loadComponent: () => import('./features/evaluation/pages/final-results-page/final-results-page').then(m => m.FinalResultsPageComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./features/users/pages/user-list-page/user-list-page').then(m => m.UserListPageComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/users/pages/profile-page/profile-page').then(m => m.ProfilePageComponent)
      },
      {
        path: 'academic-periods',
        loadComponent: () => import('./features/academic-periods/pages/period-list-page/period-list-page').then(m => m.PeriodListPageComponent)
      },
      {
        path: 'topics',
        loadComponent: () => import('./features/topics/pages/topic-list-page/topic-list-page').then(m => m.TopicListPageComponent)
      },
      {
        path: 'topics/my-topics',
        loadComponent: () => import('./features/topics/pages/my-topics-page/my-topics-page').then(m => m.MyTopicsPageComponent)
      },
      {
        path: 'registrations/review',
        loadComponent: () => import('./features/topics/pages/review-registration-page/review-registration-page').then(m => m.ReviewRegistrationPageComponent)
      },
      {
        path: 'registrations/my',
        loadComponent: () => import('./features/topics/pages/my-registration-page/my-registration-page').then(m => m.MyRegistrationPageComponent)
      }
      // Các tính năng của Member A/B sẽ được lazy load tiếp ở đây
    ]
  },
  { path: '**', redirectTo: 'app' }
];
