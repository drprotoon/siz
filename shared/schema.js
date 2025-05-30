import { pgTable, text, serial, integer, numeric, boolean, timestamp } from "drizzle-orm/pg-core";
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
    }
    else {
        // PostgreSQL suporta arrays nativamente
        return text("images").array();
    }
};
// User schema
export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    username: text("username").notNull().unique(),
    password: text("password").notNull(),
    email: text("email").notNull().unique(),
    name: text("name"),
    fullName: text("full_name"),
    address: text("address"),
    addressNumber: text("address_number"),
    addressComplement: text("address_complement"),
    district: text("district"),
    city: text("city"),
    state: text("state"),
    postalCode: text("postal_code"),
    country: text("country"),
    phone: text("phone"),
    cpf: text("cpf"),
    birthdate: timestamp("birthdate"),
    role: text("role").notNull().default("customer"),
    createdat: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow()
});
export const insertUserSchema = createInsertSchema(users)
    .omit({ id: true, createdat: true });
// Category schema
export const categories = pgTable("categories", {
    id: serial("id").primaryKey(),
    name: text("name").notNull().unique(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    imageUrl: text("image_url"),
    parentId: integer("parent_id"),
    order: integer("order").default(sql `0`)
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
    compareatprice: numeric("compareatprice", { precision: 10, scale: 2 }),
    sku: text("sku").notNull().unique(),
    weight: numeric("weight", { precision: 6, scale: 2 }).notNull(),
    quantity: integer("quantity").notNull().default(sql `0`),
    category_id: integer("category_id").notNull(),
    images: getArrayType(), // Usa a função auxiliar para determinar o tipo correto
    ingredients: text("ingredients"),
    howToUse: text("how_to_use"),
    visible: boolean("visible").notNull().default(true),
    featured: boolean("featured").default(false),
    new_arrival: boolean("new_arrival").default(false),
    best_seller: boolean("best_seller").default(false),
    rating: numeric("rating", { precision: 3, scale: 1 }).default(sql `0`),
    reviewcount: integer("reviewcount").default(sql `0`),
    createdat: timestamp("created_at").defaultNow()
});
export const insertProductSchema = createInsertSchema(products)
    .omit({ id: true, createdat: true })
    .extend({
    // Garantir que os campos opcionais sejam tratados corretamente
    description: z.string().nullable().optional(),
    compareatprice: z.string().nullable().optional(),
    images: z.union([z.string(), z.array(z.string())]).nullable().optional(),
    ingredients: z.string().nullable().optional(),
    howToUse: z.string().nullable().optional(),
    rating: z.string().nullable().optional(),
    reviewcount: z.number().nullable().optional()
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
    createdat: timestamp("created_at").defaultNow()
});
export const insertOrderSchema = createInsertSchema(orders)
    .omit({ id: true, createdat: true });
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
    createdat: timestamp("created_at").defaultNow()
});
export const insertReviewSchema = createInsertSchema(reviews)
    .omit({ id: true, createdat: true });
// Cart schema
export const cartItems = pgTable("cart_items", {
    id: serial("id").primaryKey(),
    userId: integer("user_id"),
    sessionId: text("session_id"),
    productId: integer("product_id").notNull(),
    quantity: integer("quantity").notNull(),
    createdat: timestamp("created_at").defaultNow()
});
// Wishlist schema
export const wishlistItems = pgTable("wishlist_items", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    productId: integer("product_id").notNull(),
    createdat: timestamp("created_at").defaultNow()
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
    createdat: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow()
});
export const insertCartItemSchema = createInsertSchema(cartItems)
    .omit({ id: true, createdat: true })
    .refine(data => data.userId !== undefined || data.sessionId !== undefined, {
    message: "Either userId or sessionId must be provided"
});
export const insertWishlistItemSchema = createInsertSchema(wishlistItems)
    .omit({ id: true, createdat: true });
export const insertAddressSchema = createInsertSchema(addresses)
    .omit({ id: true, createdat: true, updatedAt: true });
