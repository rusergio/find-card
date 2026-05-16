import type { UserRole } from './user-role';

export interface SessionUser {
  email: string;
  displayName: string;
  /** Nome completo quando a API o enviar; na UI administrativa usa-se em conjunto com displayName. */
  fullName?: string;
  /** Foto escolhida localmente na área cliente (persistida na sessão do browser). */
  avatarDataUrl?: string;
  phone?: string;
  role: UserRole;
  /** Preenchido após login via API (Spring / JWT). */
  accessToken?: string;
  refreshToken?: string;
}
