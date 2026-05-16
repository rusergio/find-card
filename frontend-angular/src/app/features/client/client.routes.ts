import type { Routes } from '@angular/router';

export const clientRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/client-dashboard/client-dashboard.component').then((m) => m.ClientDashboardComponent),
  },
  {
    path: 'accounts',
    loadComponent: () =>
      import('./pages/client-accounts/client-accounts.component').then((m) => m.ClientAccountsComponent),
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./pages/client-settings/client-settings.component').then((m) => m.ClientSettingsComponent),
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./pages/client-profile/client-profile.component').then((m) => m.ClientProfileComponent),
  },
  {
    path: 'account-management',
    loadComponent: () =>
      import('./pages/client-account-management/client-account-management.component').then(
        (m) => m.ClientAccountManagementComponent,
      ),
  },
];
