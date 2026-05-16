import type { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/admin-dashboard/admin-dashboard.component').then((m) => m.AdminDashboardComponent),
  },
  {
    path: 'employees',
    loadComponent: () =>
      import('./pages/admin-employees/admin-employees.component').then((m) => m.AdminEmployeesComponent),
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./pages/admin-profile/admin-profile.component').then((m) => m.AdminProfileComponent),
  },
  {
    path: 'account-management',
    loadComponent: () =>
      import('./pages/admin-account-management/admin-account-management.component').then(
        (m) => m.AdminAccountManagementComponent,
      ),
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./pages/admin-settings/admin-settings.component').then((m) => m.AdminSettingsComponent),
  },
];
