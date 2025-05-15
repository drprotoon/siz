import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from "@shared/schema";
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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
