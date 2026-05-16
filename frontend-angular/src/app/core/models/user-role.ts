export type UserRole = 'ADMIN' | 'EMPLOYEE' | 'CLIENT';

export const USER_ROLES: readonly UserRole[] = ['ADMIN', 'EMPLOYEE', 'CLIENT'];

export function isUserRole(value: string): value is UserRole {
  return (USER_ROLES as readonly string[]).includes(value);
}

/** Mapeia {@code USER} / {@code ADMIN} do Spring para o tipo da sessão Angular. */
export function mapSpringRoleToUserRole(role: string): UserRole | null {
  const r = role.toUpperCase();
  if (r.includes('ADMIN')) {
    return 'ADMIN';
  }
  if (r.includes('EMPLOYEE')) {
    return 'EMPLOYEE';
  }
  if (r.includes('USER') || r.includes('CLIENT') || r.includes('CUSTOMER')) {
    return 'CLIENT';
  }
  return null;
}
