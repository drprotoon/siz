import { pgTable, text, serial, integer, numeric, boolean, timestamp, varchar, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

// Função auxiliar para lidar com arrays em diferentes bancos de dados
const getArrayType = () => {
  // Verifica se estamos usando SQLite (file:) ou PostgreSQL
  const isSQLite = process.env.DATABASE_URL?.startsWith('file:');

  if (isSQLite) {
    // SQLite não suporta arrays nativamente, então usamos TEXT
    return text("images");
  } else {
    // PostgreSQL suporta arrays nativamente
    return text("images").array();
  }
};

// User schema - Corresponde exatamente à estrutura do Supabase
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  postalCode: text("postal_code"),
  country: text("country"),
  phone: text("phone"),
  role: text("role").notNull().default("customer"),
  createdAt: timestamp("created_at").defaultNow(),
  name: text("name"),
  cpf: text("cpf"),
  birthdate: timestamp("birthdate"),
  updatedAt: timestamp("updated_at").defaultNow(),
  addressComplement: text("address_complement"),
  addressNumber: text("address_number"),
  district: text("district"),
  authId: text("auth_id")
});

export const insertUserSchema = z.object({
  username: z.string(),
  password: z.string(),
  email: z.string().email(),
  role: z.string().default("customer"),
  name: z.string().optional(),
  fullName: z.string().optional(),
  phone: z.string().optional(),
  cpf: z.string().optional(),
  birthdate: z.date().optional(),
  address: z.string().optional(),
  addressNumber: z.string().optional(),
  addressComplement: z.string().optional(),
  district: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  updatedAt: z.date().optional()
});

// Category schema
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  imageUrl: text("image_url"),
  parentId: integer("parent_id"),
  order: integer("order").default(sql`0`)
});

export const insertCategorySchema = z.object({
  name: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  parentId: z.number().optional(),
  order: z.number().optional()
});

// Product schema - Simplificado para usar apenas colunas que funcionam
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  compareatprice: numeric("compareatprice", { precision: 10, scale: 2 }),
  sku: text("sku").notNull().unique(),
  weight: numeric("weight", { precision: 6, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull().default(sql`0`),
  categoryId: integer("category_id").notNull(),
  images: getArrayType(), // Usa a função auxiliar para determinar o tipo correto
  ingredients: text("ingredients"),
  howtouse: text("howtouse"), // Usar a coluna que existe
  visible: boolean("visible").notNull().default(true),
  featured: boolean("featured").default(false),
  newArrival: boolean("new_arrival").default(false),
  bestSeller: boolean("best_seller").default(false),
  rating: numeric("rating", { precision: 3, scale: 1 }).default(sql`0`),
  reviewCount: integer("review_count").default(sql`0`), // Usar a coluna que existe
  createdAt: timestamp("createdat").defaultNow()
});

export const insertProductSchema = z.object({
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().optional(),
  price: z.string(),
  compareatprice: z.string().nullable().optional(),
  sku: z.string(),
  weight: z.string(),
  quantity: z.number().optional(),
  categoryId: z.number(),
  images: z.union([z.string(), z.array(z.string())]).nullable().optional(),
  ingredients: z.string().nullable().optional(),
  howtouse: z.string().nullable().optional(),
  visible: z.boolean().optional(),
  featured: z.boolean().optional(),
  newArrival: z.boolean().optional(),
  bestSeller: z.boolean().optional(),
  rating: z.string().nullable().optional(),
  reviewCount: z.number().nullable().optional()
});

// Order schema
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  status: text("status").notNull().default("pending"),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  shippingAddress: text("shipping_address").notNull(),
  shippingCity: text("shipping_city").notNull(),
  shippingState: text("shipping_state").notNull(),
  shippingPostalCode: text("shipping_postal_code").notNull(),
  shippingCountry: text("shipping_country").notNull(),
  shippingMethod: text("shipping_method"),
  shippingCost: numeric("shipping_cost", { precision: 10, scale: 2 }),
  paymentMethod: text("payment_method"),
  paymentId: text("payment_id"),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertOrderSchema = z.object({
  userId: z.number(),
  status: z.string().optional(),
  total: z.string(),
  shippingAddress: z.string(),
  shippingCity: z.string(),
  shippingState: z.string(),
  shippingPostalCode: z.string(),
  shippingCountry: z.string(),
  shippingMethod: z.string().optional(),
  shippingCost: z.string().optional(),
  paymentMethod: z.string().optional(),
  paymentId: z.string().optional()
});

// Order items schema
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  name: text("name").notNull()
});

export const insertOrderItemSchema = z.object({
  orderId: z.number(),
  productId: z.number(),
  quantity: z.number(),
  price: z.string(),
  name: z.string()
});

// Review schema
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  userId: integer("user_id").notNull(),
  rating: integer("rating").notNull(),
  title: text("title"),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertReviewSchema = z.object({
  productId: z.number(),
  userId: z.number(),
  rating: z.number(),
  title: z.string().optional(),
  comment: z.string().optional()
});

// Cart schema
export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  sessionId: text("session_id"),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

// Wishlist schema
export const wishlistItems = pgTable("wishlist_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  productId: integer("product_id").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

// Address schema
export const addresses = pgTable("addresses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  postalCode: text("postal_code").notNull(),
  street: text("street").notNull(),
  number: text("number"),
  complement: text("complement"),
  district: text("district").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  country: text("country").notNull().default("Brasil"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Settings schema
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value"),
  description: text("description"),
  category: text("category").default("general"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Payments schema
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  userId: integer("user_id").notNull(),
  paymentMethod: text("payment_method").notNull(), // 'pix', 'credit_card', 'boleto', etc.
  paymentProvider: text("payment_provider").notNull(), // 'abacatepay', 'stripe', etc.
  externalPaymentId: text("external_payment_id").unique(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("BRL"),
  status: text("status").notNull().default("pending"), // 'pending', 'paid', 'failed', 'expired', 'cancelled'
  pixQrCode: text("pix_qr_code"), // QR Code PIX (se aplicável)
  pixQrCodeText: text("pix_qr_code_text"), // Texto do QR Code PIX (se aplicável)
  expiresAt: timestamp("expires_at"), // Data de expiração do pagamento
  paidAt: timestamp("paid_at"), // Data de confirmação do pagamento
  failedAt: timestamp("failed_at"), // Data de falha do pagamento
  failureReason: text("failure_reason"), // Motivo da falha
  webhookData: jsonb("webhook_data"), // Dados do webhook recebido
  customerInfo: jsonb("customer_info"), // Informações do cliente
  metadata: jsonb("metadata"), // Dados adicionais
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const insertCartItemSchema = z.object({
  userId: z.number().optional(),
  sessionId: z.string().optional(),
  productId: z.number(),
  quantity: z.number()
}).refine((data) => data.userId !== undefined || data.sessionId !== undefined, {
  message: "Either userId or sessionId must be provided"
});

export const insertWishlistItemSchema = z.object({
  userId: z.number(),
  productId: z.number()
});

export const insertAddressSchema = z.object({
  userId: z.number(),
  postalCode: z.string(),
  street: z.string(),
  number: z.string().optional(),
  complement: z.string().optional(),
  district: z.string(),
  city: z.string(),
  state: z.string(),
  country: z.string().optional()
});

export const insertSettingSchema = z.object({
  key: z.string(),
  value: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional()
});

export const insertPaymentSchema = z.object({
  orderId: z.number(),
  userId: z.number(),
  paymentMethod: z.string(),
  paymentProvider: z.string(),
  externalPaymentId: z.string().optional(),
  amount: z.string(),
  currency: z.string().optional(),
  status: z.string().optional(),
  pixQrCode: z.string().optional(),
  pixQrCodeText: z.string().optional(),
  expiresAt: z.date().optional(),
  paidAt: z.date().optional(),
  failedAt: z.date().optional(),
  failureReason: z.string().optional(),
  webhookData: z.any().optional(),
  customerInfo: z.any().optional(),
  metadata: z.any().optional()
});

export const selectPaymentSchema = createInsertSchema(payments);
export const selectSettingSchema = createInsertSchema(settings);

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;

export type WishlistItem = typeof wishlistItems.$inferSelect;
export type InsertWishlistItem = z.infer<typeof insertWishlistItemSchema>;

export type Address = typeof addresses.$inferSelect;
export type InsertAddress = z.infer<typeof insertAddressSchema>;

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

// Helper type for product with category
export type ProductWithCategory = Product & {
  category: Category;
};

// Helper type for order with items
export type OrderWithItems = Order & {
  items: OrderItem[];
  user: {
    id: number;
    username: string;
    email: string;
    fullName?: string;
  };
};

// Freight calculation
export type FreightOption = {
  name: string;
  price: number;
  estimatedDays: string;
};

export type FreightCalculationResponse = {
  options: FreightOption[];
  postalCode: string;
};

// Payment types
export type PaymentIntent = {
  id: string;
  status: "pending" | "completed" | "failed";
  amount: number;
};
