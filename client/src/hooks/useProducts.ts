import { useQuery } from "@tanstack/react-query";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

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

  // Try Vercel API first
  try {
    const response = await fetch(`/api/products?${params.toString()}`);
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Vercel API failed');
  } catch (error) {
    console.warn('Vercel API failed, trying Supabase Edge Function:', error);
    
    // Fallback to Supabase Edge Function
    try {
      const supabaseResponse = await fetch(
        `${SUPABASE_URL}/functions/v1/products?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
        }
      );
      
      if (!supabaseResponse.ok) {
        throw new Error('Supabase Edge Function failed');
      }
      
      return await supabaseResponse.json();
    } catch (supabaseError) {
      console.error('Both APIs failed:', supabaseError);
      throw new Error('Failed to fetch products from all sources');
    }
  }
}

async function fetchBestSellers() {
  // Try Vercel API first
  try {
    const response = await fetch('/api/products?bestSeller=true');
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Vercel API failed');
  } catch (error) {
    console.warn('Vercel API failed, trying Supabase Edge Function:', error);
    
    // Fallback to Supabase Edge Function
    try {
      const supabaseResponse = await fetch(
        `${SUPABASE_URL}/functions/v1/best-sellers`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
        }
      );
      
      if (!supabaseResponse.ok) {
        throw new Error('Supabase Edge Function failed');
      }
      
      return await supabaseResponse.json();
    } catch (supabaseError) {
      console.error('Both APIs failed:', supabaseError);
      throw new Error('Failed to fetch best sellers from all sources');
    }
  }
}

async function fetchNewArrivals() {
  // Try Vercel API first
  try {
    const response = await fetch('/api/products?new_arrival=true');
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Vercel API failed');
  } catch (error) {
    console.warn('Vercel API failed, trying Supabase Edge Function:', error);
    
    // Fallback to Supabase Edge Function
    try {
      const supabaseResponse = await fetch(
        `${SUPABASE_URL}/functions/v1/new-arrivals`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
        }
      );
      
      if (!supabaseResponse.ok) {
        throw new Error('Supabase Edge Function failed');
      }
      
      return await supabaseResponse.json();
    } catch (supabaseError) {
      console.error('Both APIs failed:', supabaseError);
      throw new Error('Failed to fetch new arrivals from all sources');
    }
  }
}

export function useProducts(options: ProductsOptions = {}) {
  return useQuery({
    queryKey: ["/api/products", options],
    queryFn: () => fetchProducts(options),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useBestSellers() {
  return useQuery({
    queryKey: ["/api/products/best-sellers"],
    queryFn: fetchBestSellers,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useNewArrivals() {
  return useQuery({
    queryKey: ["/api/products/new-arrivals"],
    queryFn: fetchNewArrivals,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}
