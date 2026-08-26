import { Routes } from '@angular/router';

import { ALL_ROLES } from './core/constants/navigation.constants';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { AppShellComponent } from './shared/layouts/app-shell/app-shell.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login-page.component').then((m) => m.LoginPageComponent),
    title: 'Sign in',
  },
  {
    path: 'app',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard-page.component').then((m) => m.DashboardPageComponent),
        title: 'Dashboard',
        data: {
          title: 'Dashboard',
        },
      },
      {
        path: 'users',
        canActivate: [roleGuard],
        loadComponent: () => import('./features/placeholder/placeholder-page.component').then((m) => m.PlaceholderPageComponent),
        title: 'Users',
        data: {
          title: 'Users',
          description: 'Manage portal accounts, roles, and account status.',
          roles: ['admin'],
        },
      },
      {
        path: 'academic-periods',
        canActivate: [roleGuard],
        loadComponent: () => import('./features/placeholder/placeholder-page.component').then((m) => m.PlaceholderPageComponent),
        title: 'Academic Periods',
        data: {
          title: 'Academic Periods',
          description: 'Manage academic periods used for topics, registrations, progress, and evaluation.',
          roles: ['admin'],
        },
      },
      {
        path: 'topics',
        canActivate: [roleGuard],
        loadComponent: () => import('./features/placeholder/placeholder-page.component').then((m) => m.PlaceholderPageComponent),
        title: 'Topics',
        data: {
          title: 'Topics',
          description: 'View and manage thesis topic workflows.',
          roles: ALL_ROLES,
        },
      },
      {
        path: 'registrations',
        canActivate: [roleGuard],
        loadComponent: () => import('./features/placeholder/placeholder-page.component').then((m) => m.PlaceholderPageComponent),
        title: 'Registrations',
        data: {
          title: 'Registrations',
          description: 'Track topic registration requests and review state.',
          roles: ALL_ROLES,
        },
      },
      {
        path: 'progress',
        canActivate: [roleGuard],
        loadComponent: () => import('./features/placeholder/placeholder-page.component').then((m) => m.PlaceholderPageComponent),
        title: 'Progress',
        data: {
          title: 'Progress',
          description: 'Follow progress milestones and submitted updates.',
          roles: ALL_ROLES,
        },
      },
      {
        path: 'reports',
        canActivate: [roleGuard],
        loadComponent: () => import('./features/placeholder/placeholder-page.component').then((m) => m.PlaceholderPageComponent),
        title: 'Reports',
        data: {
          title: 'Reports',
          description: 'Access thesis report submission and review workflows.',
          roles: ALL_ROLES,
        },
      },
      {
        path: 'councils',
        canActivate: [roleGuard],
        loadComponent: () => import('./features/placeholder/placeholder-page.component').then((m) => m.PlaceholderPageComponent),
        title: 'Councils',
        data: {
          title: 'Councils',
          description: 'Manage and review defense council assignments.',
          roles: ['lecturer', 'admin'],
        },
      },
      {
        path: 'evaluation',
        canActivate: [roleGuard],
        loadComponent: () => import('./features/placeholder/placeholder-page.component').then((m) => m.PlaceholderPageComponent),
        title: 'Evaluation',
        data: {
          title: 'Evaluation',
          description: 'Access supervisor and council evaluation tasks.',
          roles: ['lecturer', 'admin'],
        },
      },
      {
        path: 'final-results',
        canActivate: [roleGuard],
        loadComponent: () => import('./features/placeholder/placeholder-page.component').then((m) => m.PlaceholderPageComponent),
        title: 'Final Results',
        data: {
          title: 'Final Results',
          description: 'View thesis final-result publication state.',
          roles: ALL_ROLES,
        },
      },
      {
        path: 'unauthorized',
        loadComponent: () => import('./features/auth/unauthorized/unauthorized-page.component').then((m) => m.UnauthorizedPageComponent),
        title: 'Access restricted',
        data: {
          title: 'Access restricted',
        },
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
    ],
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'app/dashboard',
  },
  {
    path: '**',
    redirectTo: 'app/dashboard',
  },
];
