import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS, USE_SUPABASE_FUNCTIONS } from "@/lib/api-config";

interface ProductsOptions {
  bestSeller?: boolean;
  newArrival?: boolean;
  featured?: boolean;
  category?: string;
  visible?: boolean;
}

async function fetchProducts(options: ProductsOptions = {}) {
  const params = new URLSearchParams();

  if (options.bestSeller) params.append('bestSeller', 'true');
  if (options.newArrival) params.append('new_arrival', 'true');
  if (options.featured) params.append('featured', 'true');
  if (options.category) params.append('category', options.category);
  if (options.visible !== false) params.append('visible', 'true');

  const url = `${API_ENDPOINTS.products}?${params.toString()}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add auth token if available
  const token = localStorage.getItem('authToken');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    headers,
    credentials: USE_SUPABASE_FUNCTIONS ? 'omit' : 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.status}`);
  }

  return await response.json();
}

async function fetchBestSellers() {
  return fetchProducts({ bestSeller: true });
}

async function fetchNewArrivals() {
  return fetchProducts({ newArrival: true });
}

export function useProducts(options: ProductsOptions = {}) {
  return useQuery({
    queryKey: [API_ENDPOINTS.products, options],
    queryFn: () => fetchProducts(options),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useBestSellers() {
  return useQuery({
    queryKey: [API_ENDPOINTS.products, { bestSeller: true }],
    queryFn: fetchBestSellers,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useNewArrivals() {
  return useQuery({
    queryKey: [API_ENDPOINTS.products, { newArrival: true }],
    queryFn: fetchNewArrivals,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
