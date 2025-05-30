// Client-side type definitions

// API Response types
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
  success?: boolean;
}

// User types
export interface User {
  id: number;
  username: string;
  email: string;
  name?: string;
  role: 'admin' | 'customer';
  createdat?: string;
  updatedAt?: string;
}

export interface AuthData {
  user?: User;
  isAuthenticated?: boolean;
}

// Product types
export interface Product {
  id: number;
  name: string;
  description: string;
  price: string | number;
  images: string[];
  category_id: number;
  quantity: number;
  featured?: boolean;
  new_arrival?: boolean;
  best_seller?: boolean;
  visible?: boolean;
  weight?: string;
  dimensions?: string;
  brand?: string;
  sku?: string;
  createdat?: string;
  updatedAt?: string;
}

// Category types
export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: number | null;
  createdat?: string;
  updatedAt?: string;
}

// Cart types
export interface CartItem {
  id: number;
  productId: number;
  quantity: number;
  product: Product;
  userId?: number;
  sessionId?: string;
  createdat?: string;
  updatedAt?: string;
}

// Order types
export interface Order {
  id: number;
  userId: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  items: OrderItem[];
  shippingAddress?: any;
  paymentMethod?: string;
  createdat?: string;
  updatedAt?: string;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: number;
  product?: Product;
}

// Wishlist types
export interface WishlistItem {
  id: number;
  userId: number;
  productId: number;
  product: Product;
  createdat?: string;
}

export interface WishlistCheck {
  isInWishlist: boolean;
}

// Shipping types
export interface FrenetShippingService {
  Carrier: string;
  ServiceDescription: string;
  ServiceCode: string;
  CarrierCode: string;
  ShippingPrice: number;
  DeliveryTime: string;
  Error: boolean;
}

// Stats types
export interface AdminStats {
  totalSales: number;
  totalOrders: number;
  newCustomers: number;
  lowStockProducts: number;
}

// Form types
export interface LoginForm {
  username: string;
  password: string;
}

export interface RegisterForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// Query types
export interface UseQueryResult<T> {
  data: T;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

// Location types for wouter
export type LocationHook = [
  string, // current location
  (to: string, options?: { replace?: boolean; state?: any }) => void // navigate function
];

// Utility types
export type SortOption = 'name' | 'price-asc' | 'price-desc' | 'newest' | 'oldest';

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

// Component prop types
export interface ProductCardProps {
  product: Product;
  showAddToCart?: boolean;
  showWishlist?: boolean;
}

export interface CategoryCardProps {
  category: Category;
  showProductCount?: boolean;
}

export interface StatsCardsProps {
  stats?: AdminStats;
  loading?: boolean;
}

// Hook return types
export interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: LoginForm) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterForm) => Promise<void>;
  loading: boolean;
}

export interface UseCartReturn {
  items: CartItem[];
  addItem: (productId: number, quantity?: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  total: number;
  itemCount: number;
  loading: boolean;
}

export interface UseWishlistReturn {
  items: WishlistItem[];
  addItem: (productId: number) => Promise<void>;
  removeItem: (productId: number) => Promise<void>;
  isInWishlist: (productId: number) => boolean;
  loading: boolean;
}

// API endpoint types
export type ApiEndpoint = 
  | '/api/auth/login'
  | '/api/auth/logout'
  | '/api/auth/register'
  | '/api/auth/me'
  | '/api/products'
  | '/api/categories'
  | '/api/cart'
  | '/api/wishlist'
  | '/api/orders'
  | '/api/users'
  | '/api/admin/stats'
  | '/api/health';

// Error types
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

// Global window extensions
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}
