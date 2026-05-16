/** Formato flexível para alinhar com vários contratos Spring (custom DTO, OAuth2, etc.). */
export interface RawLoginResponse {
  accessToken?: string;
  access_token?: string;
  token?: string;
  refreshToken?: string;
  refresh_token?: string;
  email?: string;
  displayName?: string;
  fullName?: string;
  full_name?: string;
  name?: string;
  role?: string;
  roles?: string[];
  authorities?: string[] | { authority: string }[];
}
