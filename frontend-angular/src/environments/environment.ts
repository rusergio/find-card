/**
 * Desenvolvimento (`ng serve`):
 * - O browser só carrega a app em `http://localhost:4200`.
 * - A API é chamada em URLs relativas `apiBaseUrl` + `loginPath` → ex.: `/api/auth/login`.
 * - O `proxy.conf.json` reencaminha isso para `http://localhost:8080/auth/login` (Spring na 8080).
 * - O Java **não** precisa de servir a página na 4200; só de aceitar pedidos na 8080 (e CORS se
 *   algum cliente for direto a `http://localhost:8080` sem proxy). Com o proxy, o browser fala
 *   só com a 4200, por isso o “Failed to fetch” por CORS costuma desaparecer.
 * Produção: `environment.prod` com `/api` + reverse proxy (Nginx/Laragon) para o JAR.
 */
export const environment = {
  production: false,
  apiBaseUrl: '/api',
  /** Cores da marca (RGB) — ajuste ao branding do banco; usadas na página de login. */
  brand: {
    accentRgb: '16 185 129',
    accentStrongRgb: '5 150 105',
  },
  auth: {
    /** `true`: login local sem Java. `false`: chamada HTTP a `apiBaseUrl` + `loginPath`. */
    useMockLogin: false,
    /**
     * `post-json`: POST `{ email, password }`.
     * `get-query`: GET `?email=&password=` (como no Postman; menos seguro — a URL fica em logs).
     */
    loginTransport: 'post-json',
    loginPath: '/auth/login',
    forgotPasswordPath: '/auth/forgot-password',
    registerPath: '/auth/register',
  },
};
