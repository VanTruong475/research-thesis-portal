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
      }
      // Các tính năng của Member B sẽ được lazy load tiếp ở đây
    ]
  },
  { path: '**', redirectTo: 'app' }
];
