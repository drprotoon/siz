import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../shared/schema';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: join(__dirname, '..', '.env') });

async function main() {
  console.log('Setting up database...');

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  try {
    // Create database if it doesn't exist
    const connectionString = process.env.DATABASE_URL;
    const dbName = 'siz_cosmeticos';

    console.log(`Setting up PostgreSQL database: ${dbName}`);

    // Create a connection to the default postgres database
    const mainPool = new Pool({
      connectionString: connectionString.replace(/\/[^/]*$/, '/postgres'),
    });

    try {
      // Check if database exists
      const dbCheckResult = await mainPool.query(
        "SELECT 1 FROM pg_database WHERE datname = $1",
        [dbName]
      );

      if (dbCheckResult.rowCount === 0) {
        // Database doesn't exist, create it
        await mainPool.query(`CREATE DATABASE ${dbName}`);
        console.log(`Database ${dbName} created successfully`);
      } else {
        console.log(`Database ${dbName} already exists, continuing...`);
      }
    } catch (error) {
      console.error('Error checking/creating database:', error);
      throw error;
    } finally {
      await mainPool.end();
    }

    // Connect to the database
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    const db = drizzle(pool, { schema });

    // Create schema
    console.log('Creating schema...');

    // Create tables based on schema
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        full_name TEXT,
        address TEXT,
        city TEXT,
        state TEXT,
        postal_code TEXT,
        country TEXT,
        phone TEXT,
        role TEXT NOT NULL DEFAULT 'customer',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        slug TEXT NOT NULL UNIQUE,
        description TEXT,
        image_url TEXT
      );

      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT,
        price NUMERIC(10, 2) NOT NULL,
        compare_at_price NUMERIC(10, 2),
        sku TEXT NOT NULL UNIQUE,
        weight NUMERIC(6, 2) NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 0,
        category_id INTEGER NOT NULL,
        images TEXT[],
        ingredients TEXT,
        how_to_use TEXT,
        visible BOOLEAN NOT NULL DEFAULT TRUE,
        featured BOOLEAN DEFAULT FALSE,
        new_arrival BOOLEAN DEFAULT FALSE,
        best_seller BOOLEAN DEFAULT FALSE,
        rating NUMERIC(3, 1) DEFAULT 0,
        review_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        total NUMERIC(10, 2) NOT NULL,
        shipping_address TEXT NOT NULL,
        shipping_city TEXT NOT NULL,
        shipping_state TEXT NOT NULL,
        shipping_postal_code TEXT NOT NULL,
        shipping_country TEXT NOT NULL,
        shipping_method TEXT,
        shipping_cost NUMERIC(6, 2),
        payment_method TEXT,
        payment_id TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        price NUMERIC(10, 2) NOT NULL,
        name TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        rating INTEGER NOT NULL,
        title TEXT,
        comment TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS cart_items (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        session_id TEXT,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS wishlist_items (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('Schema created successfully');

    await pool.end();

    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

main();
