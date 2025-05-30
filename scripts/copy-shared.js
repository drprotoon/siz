/**
 * Script to copy shared files to the dist directory
 * This ensures that shared modules like schema are available to the server
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const sharedDir = path.join(rootDir, 'shared');
const distSharedDir = path.join(rootDir, 'dist', 'shared');

console.log('Copying shared files to dist directory...');

// Create the dist/shared directory if it doesn't exist
if (!fs.existsSync(distSharedDir)) {
  fs.mkdirSync(distSharedDir, { recursive: true });
  console.log(`Created directory: ${distSharedDir}`);
}

// Function to copy a file with TypeScript to JavaScript conversion
function copyWithTsToJs(srcFile, destFile) {
  console.log(`Copying ${srcFile} to ${destFile}`);

  try {
    let content = fs.readFileSync(srcFile, 'utf8');

    // Convert TypeScript to JavaScript

    // Handle special case for schema.ts
    if (srcFile.endsWith('schema.ts')) {
      // Properly handle the schema.ts file which has type definitions
      content = handleSchemaFile(content);
    } else {
      // For other files, apply general TypeScript to JavaScript conversion

      // Remove type annotations
      content = content.replace(/:\s*[A-Za-z0-9_<>[\]|&]+/g, '');

      // Remove interface and type declarations
      content = content.replace(/interface\s+[^{]+\{[^}]+\}/g, '');
      content = content.replace(/type\s+[^=]+=\s*[^;]+;/g, '');

      // Remove import type statements
      content = content.replace(/import\s+type\s*\{[^}]+\}\s*from\s*['"][^'"]+['"];?/g, '');
    }

    // Fix object literals used as type definitions
    content = content.replace(/export const ([A-Za-z0-9_]+) = \{\s*([^}]*)\s*\};/g, (match, name, props) => {
      // If this is a type definition with missing commas between properties
      if (props.includes('\n') && !props.includes(',')) {
        // Convert to a proper object literal with commas
        const fixedProps = props
          .split('\n')
          .filter(line => line.trim())
          .map(line => line.trim())
          .join(',\n  ');
        return `export const ${name} = {\n  ${fixedProps}\n};`;
      }
      return match;
    });

    // Fix imports
    content = content.replace(/from\s+['"]([^'"]+)\.ts['"]/g, 'from "$1.js"');
    content = content.replace(/from\s+['"]\.\/([^'"]+)['"]/g, 'from "./$1.js"');
    content = content.replace(/from\s+['"]\.\.\/([^'"]+)['"]/g, 'from "../$1.js"');

    // Write the converted content to the destination file
    fs.writeFileSync(destFile, content);
    console.log(`✅ Successfully copied and converted ${srcFile}`);
  } catch (error) {
    console.error(`❌ Error copying ${srcFile}:`, error);
  }
}

// Special handler for schema.ts file
function handleSchemaFile(content) {
  // Create a completely new schema.js file with proper TypeScript to JavaScript conversion
  return `import { pgTable, text, serial, integer, numeric, boolean, timestamp } from "drizzle-orm/pg-core";
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
  order: integer("order").default(sql\`0\`)
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
  compareatprice: numeric("compare_at_price", { precision: 10, scale: 2 }),
  sku: text("sku").notNull().unique(),
  weight: numeric("weight", { precision: 6, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull().default(sql\`0\`),
  category_id: integer("category_id").notNull(),
  images: getArrayType(), // Usa a função auxiliar para determinar o tipo correto
  ingredients: text("ingredients"),
  howToUse: text("how_to_use"),
  visible: boolean("visible").notNull().default(true),
  featured: boolean("featured").default(false),
  new_arrival: boolean("new_arrival").default(false),
  best_seller: boolean("best_seller").default(false),
  rating: numeric("rating", { precision: 3, scale: 1 }).default(sql\`0\`),
  reviewcount: integer("reviewcount").default(sql\`0\`),
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
  .omit({ id: true, createdat: true, updatedAt: true });`;
}

// Function to recursively copy files from source to destination
function copyFilesRecursively(srcDir, destDir) {
  // Read the source directory
  const files = fs.readdirSync(srcDir);

  // Process each file/directory
  for (const file of files) {
    const srcPath = path.join(srcDir, file);
    const destPath = path.join(destDir, file.replace(/\.ts$/, '.js'));

    // Check if it's a directory
    if (fs.statSync(srcPath).isDirectory()) {
      // Create the destination directory if it doesn't exist
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
        console.log(`Created directory: ${destPath}`);
      }

      // Recursively copy files in the directory
      copyFilesRecursively(srcPath, destPath);
    } else if (file.endsWith('.ts')) {
      // Copy and convert TypeScript files to JavaScript
      copyWithTsToJs(srcPath, destPath);
    } else {
      // Copy other files as is
      fs.copyFileSync(srcPath, destPath);
      console.log(`✅ Copied ${srcPath} to ${destPath}`);
    }
  }
}

// Copy shared files to dist/shared
if (fs.existsSync(sharedDir)) {
  copyFilesRecursively(sharedDir, distSharedDir);
  console.log('✅ Shared files copied successfully!');
} else {
  console.error(`❌ Shared directory not found at ${sharedDir}`);
  process.exit(1);
}
