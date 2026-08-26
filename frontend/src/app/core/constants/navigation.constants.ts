import { UserRole } from '../models/auth.model';

export interface NavigationItem {
  label: string;
  route: string;
  description: string;
  roles: readonly UserRole[];
}

export interface NavigationGroup {
  label: string;
  items: readonly NavigationItem[];
}

export const ALL_ROLES: readonly UserRole[] = ['student', 'lecturer', 'admin'];

export const NAVIGATION_GROUPS: readonly NavigationGroup[] = [
  {
    label: 'Core',
    items: [
      {
        label: 'Dashboard',
        route: '/app/dashboard',
        description: 'Overview of thesis activity and pending academic work.',
        roles: ALL_ROLES,
      },
      {
        label: 'Academic Periods',
        route: '/app/academic-periods',
        description: 'Manage academic periods for thesis topics and registrations.',
        roles: ['admin'],
      },
      {
        label: 'Topics',
        route: '/app/topics',
        description: 'View and manage thesis topic workflows.',
        roles: ALL_ROLES,
      },
      {
        label: 'Registrations',
        route: '/app/registrations',
        description: 'Track topic registration requests and review state.',
        roles: ALL_ROLES,
      },
    ],
  },
  {
    label: 'Thesis Work',
    items: [
      {
        label: 'Progress',
        route: '/app/progress',
        description: 'Follow progress milestones and submitted updates.',
        roles: ALL_ROLES,
      },
      {
        label: 'Reports',
        route: '/app/reports',
        description: 'Access thesis report submission and review workflows.',
        roles: ALL_ROLES,
      },
    ],
  },
  {
    label: 'Evaluation',
    items: [
      {
        label: 'Councils',
        route: '/app/councils',
        description: 'Manage and review defense council assignments.',
        roles: ['lecturer', 'admin'],
      },
      {
        label: 'Evaluation',
        route: '/app/evaluation',
        description: 'Access supervisor and council evaluation tasks.',
        roles: ['lecturer', 'admin'],
      },
      {
        label: 'Final Results',
        route: '/app/final-results',
        description: 'View thesis final-result publication state.',
        roles: ALL_ROLES,
      },
    ],
  },
  {
    label: 'Administration',
    items: [
      {
        label: 'Users',
        route: '/app/users',
        description: 'Manage portal accounts and role assignments.',
        roles: ['admin'],
      },
    ],
  },
];

export function navigationForRole(role: UserRole | undefined): readonly NavigationGroup[] {
  if (!role) {
    return [];
  }

  return NAVIGATION_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.roles.includes(role)),
  })).filter((group) => group.items.length > 0);
}
