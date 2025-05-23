// Declarações de tipos globais para o projeto

// Declaração para módulos Node.js
declare module 'fs' {
  export * from 'node:fs';
}

declare module 'path' {
  export * from 'node:path';
}

declare module 'url' {
  export * from 'node:url';
}

declare module 'uuid' {
  export function v4(): string;
}

// Declarações para módulos de terceiros
declare module 'cors';
declare module 'express';
declare module 'express-session';
declare module 'passport';
declare module 'passport-local';
declare module 'bcrypt';
declare module 'memorystore';
declare module 'dotenv';
declare module 'pg';
declare module 'drizzle-orm';
declare module 'drizzle-orm/node-postgres' {
  export function drizzle(client: any, options?: any): any;
}
declare module '@supabase/supabase-js';
declare module 'fast-xml-parser' {
  export class XMLParser {
    constructor(options?: any);
    parse(xml: string): any;
  }

  export class XMLBuilder {
    constructor(options?: any);
    build(obj: any): string;
  }
}
declare module 'axios';
declare module 'multer';
declare module 'uuid';
declare module 'fs-extra';

// Extend Express Request type to include user and session
declare namespace Express {
  interface Request {
    user?: {
      id: number;
      username: string;
      role: string;
    };
    session: Session & {
      id: string;
      user?: {
        id: number;
        username: string;
        role: string;
      };
      destroy(callback?: (err?: any) => void): void;
    };
  }
}

// Declare global process variable for Node.js
declare const process: {
  env: {
    NODE_ENV: 'development' | 'production' | 'test';
    DATABASE_URL?: string;
    SUPABASE_URL?: string;
    SUPABASE_ANON_KEY?: string;
    SUPABASE_SERVICE_ROLE_KEY?: string;
    SESSION_SECRET?: string;
    PORT?: string;
    VERCEL?: string;
    DISABLE_SECURE_COOKIE?: string;
    TS_NODE_TRANSPILE_ONLY?: string;
    [key: string]: string | undefined;
  };
};

// Tipos para o Supabase Storage
interface StorageItem {
  id: string;
  name: string;
  metadata?: {
    mimetype?: string;
    size?: number;
    cacheControl?: string;
    lastModified?: string;
  };
}

// Tipos para o cliente
interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  name?: string;
  password?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  price: string;
  compareAtPrice?: string;
  sku?: string;
  weight?: string;
  quantity: number;
  categoryId: number;
  category?: Category;
  images: string[];
  ingredients?: string;
  howToUse?: string;
  visible: boolean;
  featured?: boolean;
  bestSeller?: boolean;
  newArrival?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CartItem {
  id: number;
  userId?: number;
  sessionId?: string;
  productId: number;
  product?: Product;
  quantity: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface WishlistItem {
  id: number;
  userId: number;
  productId: number;
  product?: Product;
  createdAt?: Date;
}

interface Order {
  id: number;
  userId: number;
  status: string;
  total: string;
  subtotal: string;
  shipping: string;
  tax: string;
  discount: string;
  paymentMethod: string;
  paymentStatus: string;
  shippingMethod: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingZip: string;
  shippingCountry: string;
  billingAddress: string;
  billingCity: string;
  billingState: string;
  billingZip: string;
  billingCountry: string;
  notes?: string;
  items?: OrderItem[];
  createdAt?: Date;
  updatedAt?: Date;
}

interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  product?: Product;
  quantity: number;
  price: string;
  total: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface Review {
  id: number;
  userId: number;
  productId: number;
  rating: number;
  title?: string;
  content?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface Address {
  id: number;
  userId: number;
  postalCode: string;
  street: string;
  number: string;
  complement?: string;
  district: string;
  city: string;
  state: string;
  country: string;
  createdAt?: Date;
  updatedAt?: Date;
}
