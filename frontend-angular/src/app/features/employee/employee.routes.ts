import type { Routes } from '@angular/router';

export const employeeRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/employee-dashboard/employee-dashboard.component').then(
        (m) => m.EmployeeDashboardComponent,
      ),
  },
  {
    path: 'operations',
    loadComponent: () =>
      import('./pages/employee-operations/employee-operations.component').then(
        (m) => m.EmployeeOperationsComponent,
      ),
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./pages/employee-settings/employee-settings.component').then(
        (m) => m.EmployeeSettingsComponent,
      ),
  },
];
