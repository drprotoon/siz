import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from '../shared/schema';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as fs from 'fs';
import * as bcrypt from 'bcrypt';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: join(__dirname, '..', '.env') });

async function main() {
  console.log('Setting up SQLite database...');

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  try {
    // Extract the file path from the DATABASE_URL
    const dbPath = process.env.DATABASE_URL.replace('file:', '');
    
    console.log(`Setting up SQLite database at: ${dbPath}`);
    
    // Remove existing database if it exists
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
      console.log('Existing database removed');
    }
    
    // Create a database connection
    const sqlite = new Database(dbPath);
    
    // Create the drizzle client
    const db = drizzle(sqlite, { schema });
    
    // Create schema
    console.log('Creating schema...');
    
    // Create tables using drizzle
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
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
        created_at INTEGER DEFAULT (unixepoch())
      );

      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        slug TEXT NOT NULL UNIQUE,
        description TEXT,
        image_url TEXT
      );

      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT,
        price REAL NOT NULL,
        compare_at_price REAL,
        sku TEXT NOT NULL UNIQUE,
        weight REAL NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 0,
        category_id INTEGER NOT NULL,
        images TEXT,
        ingredients TEXT,
        how_to_use TEXT,
        visible INTEGER NOT NULL DEFAULT 1,
        featured INTEGER DEFAULT 0,
        new_arrival INTEGER DEFAULT 0,
        best_seller INTEGER DEFAULT 0,
        rating REAL DEFAULT 0,
        review_count INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (unixepoch())
      );

      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        total REAL NOT NULL,
        shipping_address TEXT NOT NULL,
        shipping_city TEXT NOT NULL,
        shipping_state TEXT NOT NULL,
        shipping_postal_code TEXT NOT NULL,
        shipping_country TEXT NOT NULL,
        shipping_method TEXT,
        shipping_cost REAL,
        payment_method TEXT,
        payment_id TEXT,
        created_at INTEGER DEFAULT (unixepoch())
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        name TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        rating INTEGER NOT NULL,
        title TEXT,
        comment TEXT,
        created_at INTEGER DEFAULT (unixepoch())
      );

      CREATE TABLE IF NOT EXISTS cart_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        session_id TEXT,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        created_at INTEGER DEFAULT (unixepoch())
      );

      CREATE TABLE IF NOT EXISTS wishlist_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        created_at INTEGER DEFAULT (unixepoch())
      );
    `);

    console.log('Schema created successfully');
    
    // Create users
    console.log('Creating users...');
    
    // Create admin user
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    await db.insert(schema.users).values({
      username: 'admin',
      password: hashedPassword,
      email: 'admin@sizcosmeticos.com',
      fullName: 'Administrador',
      role: 'admin',
      address: 'Av Paulista, 1000',
      city: 'São Paulo',
      state: 'SP',
      postalCode: '01310-100',
      country: 'Brasil',
      phone: '11987654321'
    });
    
    // Create test user
    await db.insert(schema.users).values({
      username: 'teste',
      password: hashedPassword,
      email: 'teste@exemplo.com',
      fullName: 'Usuário Teste',
      role: 'customer',
      address: 'Rua Exemplo, 123',
      city: 'Rio de Janeiro',
      state: 'RJ',
      postalCode: '22222-222',
      country: 'Brasil',
      phone: '21987654321'
    });
    
    console.log('Users created successfully');
    
    // Create categories
    console.log('Creating categories...');
    
    const categoryData = [
      {
        name: "Skincare",
        slug: "skincare",
        description: "Produtos para cuidados com a pele",
        imageUrl: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80"
      },
      {
        name: "Maquiagem",
        slug: "maquiagem",
        description: "Produtos de maquiagem para todos os tipos de pele",
        imageUrl: "https://images.unsplash.com/photo-1596704017248-eb02655de3e4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80"
      },
      {
        name: "Cabelos",
        slug: "cabelos",
        description: "Produtos para cuidados com os cabelos",
        imageUrl: "https://images.unsplash.com/photo-1576426863848-c21f53c60b19?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80"
      },
      {
        name: "Corpo & Banho",
        slug: "corpo-banho",
        description: "Produtos para cuidados com o corpo",
        imageUrl: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1771&q=80"
      },
      {
        name: "Fragrâncias",
        slug: "fragrancias",
        description: "Perfumes e fragrâncias para todos os gostos",
        imageUrl: "https://images.unsplash.com/photo-1595425964072-537c688fe172?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80"
      }
    ];
    
    await db.insert(schema.categories).values(categoryData);
    
    console.log('Categories created successfully');
    
    // Close the database connection
    sqlite.close();
    
    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

main();
