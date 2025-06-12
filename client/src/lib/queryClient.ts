import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { apiRequest as configApiRequest, API_ENDPOINTS } from "./api-config";

/**
 * Obtém a URL base da API com base no ambiente
 * Em produção, usa a URL atual do navegador
 * Em desenvolvimento, usa localhost:5000
 */
export function getApiBaseUrl(): string {
  // Em ambiente de produção, usa a URL atual do navegador
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    const { protocol, host } = window.location;
    return `${protocol}//${host}`;
  }

  // Em desenvolvimento, usa localhost:5000
  return 'http://localhost:5000';
}

/**
 * Verifica se a resposta da API é válida e lança um erro se não for
 */
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      const text = await res.text();
      console.error(`API Error ${res.status}: ${text}`);
      throw new Error(`${res.status}: ${text || res.statusText}`);
    } catch (error) {
      console.error(`Error parsing API response: ${error}`);
      throw new Error(`${res.status}: ${res.statusText}`);
    }
  }
}

/**
 * Função para fazer requisições à API
 *
 * @param method - Método HTTP (GET, POST, PUT, DELETE, etc)
 * @param url - URL da requisição
 * @param data - Dados a serem enviados (opcional)
 * @param customHeaders - Headers personalizados (opcional)
 * @returns Resposta da requisição
 */
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  customHeaders?: Record<string, string>
): Promise<Response> {
  try {
    // Definir headers padrão
    const headers: Record<string, string> = {
      ...(data ? { "Content-Type": "application/json" } : {}),
      ...customHeaders
    };

    // Adicionar token JWT se disponível
    const token = localStorage.getItem('authToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Construir a URL completa
    const fullUrl = url.startsWith('http')
      ? url
      : `${url.startsWith('/') ? getApiBaseUrl() : ''}${url}`;

    console.log(`Making API request to: ${fullUrl}`);

    // Fazer a requisição
    const res = await fetch(fullUrl, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error(`Error in apiRequest (${method} ${url}):`, error);
    throw error;
  }
}

/**
 * Tipos de comportamento para requisições não autorizadas
 */
type UnauthorizedBehavior = "returnNull" | "throw" | "redirect";

/**
 * Função para buscar dados da API
 */
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
  customHeaders?: Record<string, string>;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior, customHeaders = {} }) =>
  async ({ queryKey, signal }) => {
    // Verificar se a queryKey é uma string ou um array
    const url = typeof queryKey[0] === 'string'
      ? queryKey[0]
      : Array.isArray(queryKey[0])
        ? queryKey[0][0]
        : '';

    // Verificar se há parâmetros adicionais na queryKey
    const params = queryKey.length > 1 ? queryKey[1] : undefined;

    // Construir a URL com os parâmetros, se houver
    let finalUrl = params
      ? `${url}${url.includes('?') ? '&' : '?'}${new URLSearchParams(params as Record<string, string>).toString()}`
      : url;

    // Adicionar a URL base se a URL não for absoluta
    if (!finalUrl.startsWith('http')) {
      const baseUrl = getApiBaseUrl();
      finalUrl = `${finalUrl.startsWith('/') ? baseUrl : ''}${finalUrl}`;
    }

    console.log(`Making query request to: ${finalUrl}`);

    // Adicionar token JWT aos headers se disponível
    const headers: Record<string, string> = { ...customHeaders };
    const token = localStorage.getItem('authToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Fazer a requisição
    const res = await fetch(finalUrl, {
      credentials: "include",
      headers,
      signal,
    });

    // Tratar erros de autenticação
    if (res.status === 401) {
      if (unauthorizedBehavior === "returnNull") {
        return null;
      } else if (unauthorizedBehavior === "redirect") {
        window.location.href = "/login";
        return null;
      }
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

/**
 * Função para buscar dados do usuário do Supabase
 */
export const getUserQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // A queryKey deve ser um array com pelo menos um elemento
    if (!Array.isArray(queryKey) || queryKey.length === 0) {
      throw new Error("Invalid queryKey");
    }

    // O primeiro elemento da queryKey deve ser a URL base
    const baseUrl = queryKey[0] as string;

    // O segundo elemento da queryKey pode ser o ID do usuário
    const userId = queryKey.length > 1 ? queryKey[1] : undefined;

    // Construir a URL final
    let url = userId ? `${baseUrl}/${userId}` : baseUrl;

    // Adicionar a URL base se a URL não for absoluta
    if (!url.startsWith('http')) {
      const apiBaseUrl = getApiBaseUrl();
      url = `${url.startsWith('/') ? apiBaseUrl : ''}${url}`;
    }

    console.log(`Making user query request to: ${url}`);

    // Adicionar token JWT aos headers se disponível
    const headers: Record<string, string> = {
      "Cache-Control": "no-cache",
      "Pragma": "no-cache"
    };
    const token = localStorage.getItem('authToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Fazer a requisição
    const res = await fetch(url, {
      credentials: "include",
      headers
    });

    // Tratar erros de autenticação
    if (res.status === 401) {
      if (unauthorizedBehavior === "returnNull") {
        return null;
      } else if (unauthorizedBehavior === "redirect") {
        window.location.href = "/login";
        return null;
      }
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

/**
 * Função para invalidar queries relacionadas ao usuário
 *
 * @param userId - ID do usuário
 */
export function invalidateUserQueries(userId?: string | number) {
  queryClient.invalidateQueries({
    predicate: (query) => {
      const queryKey = query.queryKey;
      if (!queryKey || !Array.isArray(queryKey)) return false;

      // Verificar se a query está relacionada ao usuário
      const isUserQuery =
        queryKey.includes('user-profile') ||
        queryKey.includes('user-address') ||
        queryKey.includes('/api/users');

      // Se não houver userId, invalidar todas as queries de usuário
      if (!userId) return isUserQuery;

      // Se houver userId, invalidar apenas as queries desse usuário
      return isUserQuery && queryKey.includes(userId.toString());
    }
  });
}

/**
 * Cliente de queries para a aplicação
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

// Export the new API configuration
export { API_ENDPOINTS, configApiRequest };
