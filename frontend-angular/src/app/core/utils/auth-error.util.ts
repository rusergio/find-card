import { HttpErrorResponse } from '@angular/common/http';

export function formatAuthHttpError(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    const body = err.error;
    if (typeof body === 'string' && body.trim()) {
      const t = body.trim();
      if (t.startsWith('<!') || t.startsWith('<')) {
        return `O servidor devolveu uma página HTML (${err.status || '?'}). Verifique o URL da API, o proxy em desenvolvimento e se o Spring expõe JSON neste endpoint.`;
      }
      return t.length > 280 ? `${t.slice(0, 280)}…` : t;
    }
    if (body && typeof body === 'object') {
      const message = (body as Record<string, unknown>)['message'];
      if (typeof message === 'string' && message.trim()) {
        return message.trim();
      }
      if (Array.isArray(message)) {
        return message.map(String).join(', ');
      }
      const error = (body as Record<string, unknown>)['error'];
      if (typeof error === 'string' && error.trim()) {
        return error.trim();
      }
    }
    if (err.status === 0) {
      return 'Sem ligação ao servidor. Verifique se a API Spring está a correr, o URL em environment e o CORS.';
    }
    if (err.status === 401) {
      return 'Credenciais inválidas.';
    }
    if (err.status === 403) {
      return 'Acesso negado.';
    }
    if (err.status === 404) {
      return 'Endpoint não encontrado. Confirme auth.loginPath e o context-path do Spring.';
    }
    if (err.status >= 500) {
      return 'Erro no servidor. Tente novamente mais tarde.';
    }
  }
  if (err instanceof Error && err.message) {
    const m = err.message;
    if (m.includes("Unexpected token '<") || m.includes('Unexpected token "<')) {
      return 'Resposta em HTML em vez de JSON. Use `ng serve` com proxy, confirme `/auth/login` no Spring e cabeçalho Accept: application/json.';
    }
    return m;
  }
  return 'Não foi possível concluir o pedido.';
}
