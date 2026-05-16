/** Produção — substitua `apiBaseUrl` e defina `useMockLogin: false` quando a API Java estiver em produção. */
export const environment = {
  production: true,
  apiBaseUrl: '/api',
  brand: {
    accentRgb: '16 185 129',
    accentStrongRgb: '5 150 105',
  },
  auth: {
    useMockLogin: false,
    loginTransport: 'post-json',
    loginPath: '/auth/login',
    forgotPasswordPath: '/auth/forgot-password',
    registerPath: '/auth/register',
  },
};
