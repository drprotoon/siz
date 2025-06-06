import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from "../shared/schema";
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { sql } from "drizzle-orm";

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: join(__dirname, '..', '.env') });

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Log da conexão com o banco de dados
console.log(`Database connection initialized with ${process.env.NODE_ENV === 'production' ? 'SSL enabled' : 'SSL disabled'}`);
if (process.env.NODE_ENV === 'production') {
  console.log(`[PROD] Using DATABASE_URL: ${process.env.DATABASE_URL?.substring(0, 25)}...`);
}

// Create the drizzle client
export const db = drizzle(pool, { schema });

// Função para verificar se uma tabela existe
async function tableExists(tableName: string): Promise<boolean> {
  try {
    const result = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = ${tableName}
      )
    `);
    return Boolean(result.rows[0]?.exists) || false;
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error);
    return false;
  }
}

// Função para executar migrações essenciais
async function runEssentialMigrations() {
  try {
    console.log('🔄 Checking and running essential migrations...');

    // Verificar se as tabelas essenciais existem
    const usersExists = await tableExists('users');
    const addressesExists = await tableExists('addresses');
    const categoriesExists = await tableExists('categories');
    const productsExists = await tableExists('products');
    const ordersExists = await tableExists('orders');
    const cartItemsExists = await tableExists('cart_items');

    console.log(`Tables status: users=${usersExists}, addresses=${addressesExists}, categories=${categoriesExists}, products=${productsExists}, orders=${ordersExists}, cart_items=${cartItemsExists}`);

    // Se as tabelas não existem, criar elas
    if (!usersExists) {
      console.log('Creating users table...');
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "users" (
          "id" serial PRIMARY KEY NOT NULL,
          "username" text NOT NULL,
          "password" text NOT NULL,
          "email" text NOT NULL,
          "name" text,
          "full_name" text,
          "address" text,
          "address_number" text,
          "address_complement" text,
          "district" text,
          "city" text,
          "state" text,
          "postal_code" text,
          "country" text,
          "phone" text,
          "cpf" text,
          "birthdate" timestamp,
          "role" text DEFAULT 'customer' NOT NULL,
          "created_at" timestamp DEFAULT now(),
          "updated_at" timestamp DEFAULT now(),
          CONSTRAINT "users_username_unique" UNIQUE("username"),
          CONSTRAINT "users_email_unique" UNIQUE("email")
        )
      `);
      console.log('✅ Users table created');
    }

    if (!addressesExists) {
      console.log('Creating addresses table...');
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "addresses" (
          "id" serial PRIMARY KEY NOT NULL,
          "user_id" integer NOT NULL,
          "postal_code" text NOT NULL,
          "street" text NOT NULL,
          "number" text,
          "complement" text,
          "district" text NOT NULL,
          "city" text NOT NULL,
          "state" text NOT NULL,
          "country" text DEFAULT 'Brasil' NOT NULL,
          "created_at" timestamp DEFAULT now(),
          "updated_at" timestamp DEFAULT now(),
          CONSTRAINT "addresses_user_id_unique" UNIQUE("user_id")
        )
      `);
      console.log('✅ Addresses table created');
    }

    if (!categoriesExists) {
      console.log('Creating categories table...');
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "categories" (
          "id" serial PRIMARY KEY NOT NULL,
          "name" text NOT NULL,
          "slug" text NOT NULL,
          "description" text,
          "image_url" text,
          "parent_id" integer,
          "sort_order" integer DEFAULT 0,
          "is_active" boolean DEFAULT true NOT NULL,
          "created_at" timestamp DEFAULT now(),
          "updated_at" timestamp DEFAULT now(),
          CONSTRAINT "categories_name_unique" UNIQUE("name"),
          CONSTRAINT "categories_slug_unique" UNIQUE("slug")
        )
      `);
      console.log('✅ Categories table created');
    }

    if (!productsExists) {
      console.log('Creating products table...');
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "products" (
          "id" serial PRIMARY KEY NOT NULL,
          "name" text NOT NULL,
          "slug" text NOT NULL,
          "description" text,
          "price" numeric(10,2) NOT NULL,
          "compareatprice" numeric(10,2),
          "sku" text NOT NULL,
          "weight" numeric(6,2) NOT NULL,
          "quantity" integer DEFAULT 0 NOT NULL,
          "category_id" integer NOT NULL,
          "images" text[],
          "ingredients" text,
          "howtouse" text,
          "visible" boolean DEFAULT true NOT NULL,
          "featured" boolean DEFAULT false,
          "newarrival" boolean DEFAULT false,
          "bestseller" boolean DEFAULT false,
          "rating" numeric(3,1) DEFAULT 0,
          "reviewcount" integer DEFAULT 0,
          "createdat" timestamp DEFAULT now(),
          CONSTRAINT "products_slug_unique" UNIQUE("slug"),
          CONSTRAINT "products_sku_unique" UNIQUE("sku")
        )
      `);
      console.log('✅ Products table created');
    }

    if (!ordersExists) {
      console.log('Creating orders table...');
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "orders" (
          "id" serial PRIMARY KEY NOT NULL,
          "user_id" integer NOT NULL,
          "status" text DEFAULT 'pending' NOT NULL,
          "total" numeric(10,2) NOT NULL,
          "shipping_address" text NOT NULL,
          "shipping_city" text NOT NULL,
          "shipping_state" text NOT NULL,
          "shipping_postal_code" text NOT NULL,
          "shipping_country" text NOT NULL,
          "shipping_method" text,
          "shipping_cost" numeric(10,2),
          "payment_method" text,
          "payment_id" text,
          "created_at" timestamp DEFAULT now()
        )
      `);
      console.log('✅ Orders table created');
    }

    if (!cartItemsExists) {
      console.log('Creating cart_items table...');
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "cart_items" (
          "id" serial PRIMARY KEY NOT NULL,
          "user_id" integer,
          "session_id" text,
          "product_id" integer NOT NULL,
          "quantity" integer NOT NULL,
          "created_at" timestamp DEFAULT now()
        )
      `);
      console.log('✅ Cart items table created');
    }

    console.log('✅ Essential migrations completed successfully');
  } catch (error) {
    console.error('❌ Error running essential migrations:', error);
    throw error;
  }
}

// Exportar a função de migração para uso externo
export { runEssentialMigrations };

// Executar migrações essenciais na inicialização em produção
if (process.env.NODE_ENV === 'production' || process.env.VERCEL === '1') {
  runEssentialMigrations().catch(error => {
    console.error('Failed to run essential migrations:', error);
  });
}
