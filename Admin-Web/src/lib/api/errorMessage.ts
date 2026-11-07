import axios from 'axios';

export function getApiErrorMessage(error: unknown, fallback = 'Não foi possível concluir a operação.'): string {
  if (axios.isAxiosError(error)) {
    const data: unknown = error.response?.data;
    if (typeof data === 'string' && data.trim() && !data.trim().startsWith('<')) return data;
    if (data && typeof data === 'object') {
      const body = data as Record<string, unknown>;
      for (const key of ['message', 'mensagem', 'detail']) {
        if (typeof body[key] === 'string' && body[key].trim()) return body[key];
      }
    }
    if (!error.response) return 'Falha de conexão. Verifique sua conexão e tente novamente.';
    return fallback;
  }
  return error instanceof Error ? error.message : fallback;
}
