// API client configuration
import axios from 'axios';

// Determine the base URL based on the environment
const isProduction = process.env.NODE_ENV === 'production';
const baseURL = isProduction 
  ? 'https://siz-cosmetic-store-pro.vercel.app/api'
  : '/api';

// Create an axios instance with default config
const api = axios.create({
  baseURL,
  withCredentials: true, // Important for authentication cookies
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add a request interceptor to handle authentication
api.interceptors.request.use(
  (config) => {
    // You can add auth tokens here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle authentication errors
    if (error.response && error.response.status === 401) {
      // Redirect to login page or show auth error
      console.error('Authentication error:', error);
    }
    return Promise.reject(error);
  }
);

// Export the configured axios instance
export default api;

// Authentication API
export const authAPI = {
  login: (username: string, password: string) => 
    api.post('/auth/login', { username, password }),
  
  logout: () => 
    api.post('/auth/logout'),
  
  register: (userData: any) => 
    api.post('/auth/register', userData),
  
  getCurrentUser: () => 
    api.get('/auth/me'),
  
  updateProfile: (userId: number, profileData: any) => 
    api.put(`/users/${userId}/profile`, profileData),
  
  changePassword: (userId: number, currentPassword: string, newPassword: string) => 
    api.put(`/users/${userId}/password`, { currentPassword, newPassword })
};

// Products API
export const productsAPI = {
  getAll: (params?: any) => 
    api.get('/products', { params }),
  
  getByCategory: (categorySlug: string) => 
    api.get('/products', { params: { category: categorySlug } }),
  
  getFeatured: () => 
    api.get('/products', { params: { featured: true } }),
  
  getById: (id: number) => 
    api.get(`/products/${id}`),
  
  getBySlug: (slug: string) => 
    api.get(`/products/${slug}`),
  
  getReviews: (productId: number) => 
    api.get(`/products/${productId}/reviews`),
  
  addReview: (productId: number, reviewData: any) => 
    api.post(`/products/${productId}/reviews`, reviewData)
};

// Categories API
export const categoriesAPI = {
  getAll: () => 
    api.get('/categories'),
  
  getBySlug: (slug: string) => 
    api.get(`/categories/${slug}`)
};

// Cart API
export const cartAPI = {
  getCart: () => 
    api.get('/cart'),
  
  addToCart: (productId: number, quantity: number) => 
    api.post('/cart', { productId, quantity }),
  
  updateQuantity: (cartItemId: number, quantity: number) => 
    api.put(`/cart/${cartItemId}`, { quantity }),
  
  removeFromCart: (cartItemId: number) => 
    api.delete(`/cart/${cartItemId}`),
  
  clearCart: () => 
    api.delete('/cart')
};

// Wishlist API
export const wishlistAPI = {
  getWishlist: () => 
    api.get('/wishlist'),
  
  addToWishlist: (productId: number) => 
    api.post('/wishlist', { productId }),
  
  removeFromWishlist: (wishlistItemId: number) => 
    api.delete(`/wishlist/${wishlistItemId}`),
  
  checkInWishlist: (productId: number) => 
    api.get(`/wishlist/check/${productId}`)
};

// Orders API
export const ordersAPI = {
  getOrders: () => 
    api.get('/orders'),
  
  getOrderById: (orderId: number) => 
    api.get(`/orders/${orderId}`),
  
  createOrder: (orderData: any) => 
    api.post('/orders', orderData),
  
  updateOrderStatus: (orderId: number, status: string) => 
    api.put(`/orders/${orderId}/status`, { status })
};

// Shipping API
export const shippingAPI = {
  calculateShipping: (postalCode: string, items: any[]) => 
    api.post('/shipping/calculate', { postalCode, items }),
  
  getAddressByPostalCode: (postalCode: string) => 
    api.get(`/shipping/address/${postalCode}`)
};

// User API
export const userAPI = {
  getProfile: () => 
    api.get('/users/profile'),
  
  updateProfile: (profileData: any) => 
    api.put('/users/profile', profileData),
  
  getAddress: () => 
    api.get('/users/address'),
  
  saveAddress: (addressData: any) => 
    api.put('/users/address', addressData)
};

// Health check API
export const healthAPI = {
  check: () => 
    api.get('/health')
};
