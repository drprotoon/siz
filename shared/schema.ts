import { pgTable, text, serial, integer, timestamp, numeric, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
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
  createdAt: timestamp("created_at").defaultNow()
});

export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, createdAt: true });

// Category schema
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  imageUrl: text("image_url")
});

export const insertCategorySchema = createInsertSchema(categories)
  .omit({ id: true });

// Product schema
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  compareAtPrice: numeric("compare_at_price", { precision: 10, scale: 2 }),
  sku: text("sku").notNull().unique(),
  weight: numeric("weight", { precision: 6, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull().default(0),
  categoryId: integer("category_id").notNull(),
  images: text("images").array(),
  ingredients: text("ingredients"),
  howToUse: text("how_to_use"),
  visible: boolean("visible").notNull().default(true),
  featured: boolean("featured").default(false),
  newArrival: boolean("new_arrival").default(false),
  bestSeller: boolean("best_seller").default(false),
  rating: numeric("rating", { precision: 3, scale: 1 }).default("0"),
  reviewCount: integer("review_count").default(0),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertProductSchema = createInsertSchema(products)
  .omit({ id: true, createdAt: true, rating: true, reviewCount: true });

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
  shippingCost: numeric("shipping_cost", { precision: 6, scale: 2 }),
  paymentMethod: text("payment_method"),
  paymentId: text("payment_id"),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertOrderSchema = createInsertSchema(orders)
  .omit({ id: true, createdAt: true });

// Order items schema
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  name: text("name").notNull()
});

export const insertOrderItemSchema = createInsertSchema(orderItems)
  .omit({ id: true });

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

export const insertReviewSchema = createInsertSchema(reviews)
  .omit({ id: true, createdAt: true });

// Cart schema
export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  sessionId: text("session_id"),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertCartItemSchema = createInsertSchema(cartItems)
  .omit({ id: true, createdAt: true })
  .refine(data => data.userId !== undefined || data.sessionId !== undefined, {
    message: "Either userId or sessionId must be provided"
  });

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
