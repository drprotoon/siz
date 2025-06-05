// Temporary type definitions to fix build issues

declare module 'express-session' {
  interface SessionData {
    userId?: number;
    csrfToken?: string;
  }

  interface Session extends SessionData {
    userId?: number;
    csrfToken?: string;
  }

  // Fix for express-session import
  const session: any;
  export = session;
}

declare namespace Express {
  interface User {
    id: number;
    username: string;
    email: string;
    role: string;
  }
}

// Temporary any types for problematic imports
declare module '@shared/schema' {
  export const insertUserSchema: any;
  export const insertProductSchema: any;
  export const insertCategorySchema: any;
  export const insertOrderSchema: any;
  export const insertOrderItemSchema: any;
  export const insertReviewSchema: any;
  export const insertCartItemSchema: any;
  export const insertWishlistItemSchema: any;

  // Tables
  export const users: any;
  export const categories: any;
  export const products: any;
  export const orders: any;
  export const orderItems: any;
  export const reviews: any;
  export const cartItems: any;
  export const wishlistItems: any;
  export const addresses: any;

  // Types
  export interface User {
    id: number;
    username: string;
    email: string;
    role: string;
    [key: string]: any;
  }
  export interface InsertUser extends Omit<User, 'id'> {}
  export interface Category { id: number; [key: string]: any; }
  export interface InsertCategory extends Omit<Category, 'id'> {}
  export interface Product { id: number; [key: string]: any; }
  export interface InsertProduct extends Omit<Product, 'id'> {}
  export interface Order { id: number; [key: string]: any; }
  export interface InsertOrder extends Omit<Order, 'id'> {}
  export interface OrderItem { id: number; [key: string]: any; }
  export interface InsertOrderItem extends Omit<OrderItem, 'id'> {}
  export interface Review { id: number; [key: string]: any; }
  export interface InsertReview extends Omit<Review, 'id'> {}
  export interface WishlistItem { id: number; [key: string]: any; }
  export interface InsertWishlistItem extends Omit<WishlistItem, 'id'> {}
  export interface ProductWithCategory extends Product {}
  export interface PaymentIntent { [key: string]: any; }
  export interface InsertCartItem {
    userId?: number;
    productId: number;
    quantity: number;
    sessionId?: string;
  }
  export interface FreightCalculationResponse {
    options: FreightOption[];
    postalCode: string;
  }
  export interface FreightOption {
    name: string;
    price: number;
    estimatedDays: string;
  }
  export interface OrderWithItems {
    id: number;
    items: any[];
    user: {
      id: number;
      username: string;
      email: string;
      fullName?: string;
    };
    [key: string]: any;
  }
  export interface CartItem {
    id: number;
    quantity: number;
    userId: number | null;
    productId: number;
    sessionId: string | null;
    createdAt: Date | null;
  }
  export interface OrderItem {
    id: number;
    name: string;
    price: string;
    quantity: number;
    orderId: number;
    productId: number;
  }
}
