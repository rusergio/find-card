import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/pages/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard(['ADMIN'])],
    loadComponent: () =>
      import('./features/admin/pages/admin-shell/admin-shell.component').then(
        (m) => m.AdminShellComponent,
      ),
    loadChildren: () =>
      import('./features/admin/admin.routes').then((m) => m.adminRoutes),
  },
  {
    path: 'employee',
    canActivate: [authGuard, roleGuard(['EMPLOYEE'])],
    loadComponent: () =>
      import('./features/employee/pages/employee-shell/employee-shell.component').then(
        (m) => m.EmployeeShellComponent,
      ),
    loadChildren: () =>
      import('./features/employee/employee.routes').then((m) => m.employeeRoutes),
  },
  {
    path: 'client',
    canActivate: [authGuard, roleGuard(['CLIENT'])],
    loadComponent: () =>
      import('./features/client/pages/client-shell/client-shell.component').then(
        (m) => m.ClientShellComponent,
      ),
    loadChildren: () =>
      import('./features/client/client.routes').then((m) => m.clientRoutes),
  },
  { path: '**', redirectTo: 'login' },
];
