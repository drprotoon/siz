/**
 * Typed API Service
 * 
 * This service provides typed API functions to replace the generic apiRequest calls
 * and fix TypeScript errors related to unknown response types.
 */

import { apiRequest } from './queryClient';
import type { 
  Product, 
  Category, 
  Order, 
  User, 
  CartItem, 
  WishlistItem, 
  WishlistCheck,
  AdminStats,
  ApiResponse 
} from '@/types';

// Products API
const productsService = {
  getAll: async (): Promise<Product[]> => {
    const response = await apiRequest('GET', '/api/products');
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  },

  getById: async (id: number): Promise<Product | null> => {
    try {
      const response = await apiRequest('GET', `/api/products/${id}`);
      const data = await response.json();
      return data || null;
    } catch (error) {
      console.error('Error fetching product:', error);
      return null;
    }
  },

  getBySlug: async (slug: string): Promise<Product | null> => {
    try {
      const response = await apiRequest('GET', `/api/products/${slug}`);
      const data = await response.json();
      return data || null;
    } catch (error) {
      console.error('Error fetching product by slug:', error);
      return null;
    }
  },

  getByCategory: async (categoryId: number): Promise<Product[]> => {
    const response = await apiRequest('GET', `/api/products?categoryId=${categoryId}`);
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  },

  getFeatured: async (): Promise<Product[]> => {
    const response = await apiRequest('GET', '/api/products?featured=true');
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  },

  getBestSellers: async (): Promise<Product[]> => {
    const response = await apiRequest('GET', '/api/products?bestSeller=true');
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  },

  getNewArrivals: async (): Promise<Product[]> => {
    const response = await apiRequest('GET', '/api/products?new_arrival=true');
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }
};

// Categories API
const categoriesService = {
  getAll: async (): Promise<Category[]> => {
    const response = await apiRequest('GET', '/api/categories');
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  },

  getById: async (id: number): Promise<Category | null> => {
    try {
      const response = await apiRequest('GET', `/api/categories/${id}`);
      const data = await response.json();
      return data || null;
    } catch (error) {
      console.error('Error fetching category:', error);
      return null;
    }
  },

  getBySlug: async (slug: string): Promise<Category | null> => {
    try {
      const response = await apiRequest('GET', `/api/categories/${slug}`);
      const data = await response.json();
      return data || null;
    } catch (error) {
      console.error('Error fetching category by slug:', error);
      return null;
    }
  }
};

// Orders API
const ordersService = {
  getAll: async (): Promise<Order[]> => {
    const response = await apiRequest('GET', '/api/orders');
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  },

  getById: async (id: number): Promise<Order | null> => {
    try {
      const response = await apiRequest('GET', `/api/orders/${id}`);
      const data = await response.json();
      return data || null;
    } catch (error) {
      console.error('Error fetching order:', error);
      return null;
    }
  }
};

// Users API
const usersService = {
  getAll: async (): Promise<User[]> => {
    const response = await apiRequest('GET', '/api/users');
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  },

  getById: async (id: number): Promise<User | null> => {
    try {
      const response = await apiRequest('GET', `/api/users/${id}`);
      const data = await response.json();
      return data || null;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }
};

// Cart API
const cartService = {
  getItems: async (): Promise<CartItem[]> => {
    const response = await apiRequest('GET', '/api/cart');
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }
};

// Wishlist API
const wishlistService = {
  getItems: async (): Promise<WishlistItem[]> => {
    const response = await apiRequest('GET', '/api/wishlist');
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  },

  checkItem: async (productId: number): Promise<WishlistCheck> => {
    try {
      const response = await apiRequest('GET', `/api/wishlist/check/${productId}`);
      const data = await response.json();
      return { isInWishlist: data?.isInWishlist || false };
    } catch (error) {
      console.error('Error checking wishlist item:', error);
      return { isInWishlist: false };
    }
  }
};

// Admin Stats API
const adminService = {
  getStats: async (): Promise<AdminStats> => {
    try {
      const response = await apiRequest('GET', '/api/admin/stats');
      const data = await response.json();
      return {
        totalSales: data?.totalSales || 0,
        totalOrders: data?.totalOrders || 0,
        newCustomers: data?.newCustomers || 0,
        lowStockProducts: data?.lowStockProducts || 0
      };
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      return {
        totalSales: 0,
        totalOrders: 0,
        newCustomers: 0,
        lowStockProducts: 0
      };
    }
  }
};

// Export all services as default export to avoid conflicts
export default {
  products: productsService,
  categories: categoriesService,
  orders: ordersService,
  users: usersService,
  cart: cartService,
  wishlist: wishlistService,
  admin: adminService
};
