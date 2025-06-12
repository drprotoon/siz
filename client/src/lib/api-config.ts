// Configuração de API - permite alternar entre Vercel e Supabase Edge Functions

const USE_SUPABASE_FUNCTIONS = true; // Altere para false para usar Vercel

const SUPABASE_FUNCTIONS_URL = 'https://wvknjjquuztcoszluuxu.supabase.co/functions/v1';
const VERCEL_API_URL = '/api';

// Mapeamento de endpoints
const API_ENDPOINTS = {
  // Produtos
  products: USE_SUPABASE_FUNCTIONS 
    ? `${SUPABASE_FUNCTIONS_URL}/products`
    : `${VERCEL_API_URL}/products`,
  
  // Produto individual
  product: (slug: string) => USE_SUPABASE_FUNCTIONS
    ? `${SUPABASE_FUNCTIONS_URL}/products?id=${slug}`
    : `${VERCEL_API_URL}/products/${slug}`,
  
  // Autenticação
  auth: USE_SUPABASE_FUNCTIONS
    ? `${SUPABASE_FUNCTIONS_URL}/auth`
    : `${VERCEL_API_URL}/auth`,
  
  // Carrinho
  cart: USE_SUPABASE_FUNCTIONS
    ? `${SUPABASE_FUNCTIONS_URL}/cart`
    : `${VERCEL_API_URL}/cart`,
  
  // Categorias
  categories: USE_SUPABASE_FUNCTIONS
    ? `${SUPABASE_FUNCTIONS_URL}/categories`
    : `${VERCEL_API_URL}/categories`,
  
  // Categoria individual
  category: (slug: string) => USE_SUPABASE_FUNCTIONS
    ? `${SUPABASE_FUNCTIONS_URL}/categories/${slug}`
    : `${VERCEL_API_URL}/categories?category=${slug}`,
  
  // Endpoints que permanecem no Vercel (menos críticos)
  orders: `${VERCEL_API_URL}/orders`,
  payment: `${VERCEL_API_URL}/payment`,
  address: (cep: string) => `${VERCEL_API_URL}/address/${cep}`,
  users: (userId: string) => `${VERCEL_API_URL}/users/${userId}`,
};

// Headers padrão para Supabase Functions
const getSupabaseHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Adicionar token de autenticação se disponível
  const token = localStorage.getItem('authToken');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

// Headers padrão para Vercel API
const getVercelHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Adicionar token de autenticação se disponível
  const token = localStorage.getItem('authToken');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

// Função helper para fazer requests
export const apiRequest = async (
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  data?: any,
  customHeaders?: Record<string, string>
) => {
  const isSupabaseEndpoint = endpoint.includes('supabase.co');
  
  const headers = {
    ...(isSupabaseEndpoint ? getSupabaseHeaders() : getVercelHeaders()),
    ...customHeaders,
  };

  const config: RequestInit = {
    method,
    headers,
    credentials: isSupabaseEndpoint ? 'omit' : 'include',
  };

  if (data && method !== 'GET') {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(endpoint, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}`);
  }

  return response;
};

export { API_ENDPOINTS, USE_SUPABASE_FUNCTIONS };
export default API_ENDPOINTS;
