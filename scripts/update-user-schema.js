#!/usr/bin/env node

// Script to update the user schema with missing fields
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function updateUserSchema() {
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
  console.log('NODE_ENV:', process.env.NODE_ENV || 'Not set');

  // Create a PostgreSQL connection pool
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  console.log('Pool created');

  try {
    console.log('Connecting to database...');

    // Check if columns exist before adding them
    const checkColumnsQuery = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name IN ('name', 'cpf', 'birthdate', 'updated_at');
    `;

    const { rows } = await pool.query(checkColumnsQuery);
    const existingColumns = rows.map(row => row.column_name);

    console.log('Existing columns:', existingColumns);

    // Add missing columns
    if (!existingColumns.includes('name')) {
      console.log('Adding name column...');
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT;`);
    }

    if (!existingColumns.includes('cpf')) {
      console.log('Adding cpf column...');
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS cpf TEXT;`);
    }

    if (!existingColumns.includes('birthdate')) {
      console.log('Adding birthdate column...');
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS birthdate DATE;`);
    }

    if (!existingColumns.includes('updated_at')) {
      console.log('Adding updated_at column...');
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();`);
    }

    // Check if addresses table exists
    const checkAddressesTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'addresses'
      );
    `;

    const addressTableExists = (await pool.query(checkAddressesTableQuery)).rows[0].exists;

    if (!addressTableExists) {
      console.log('Creating addresses table...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS addresses (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          postal_code TEXT NOT NULL,
          street TEXT NOT NULL,
          number TEXT,
          complement TEXT,
          district TEXT NOT NULL,
          city TEXT NOT NULL,
          state TEXT NOT NULL,
          country TEXT NOT NULL DEFAULT 'Brasil',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );

        CREATE UNIQUE INDEX IF NOT EXISTS addresses_user_id_idx ON addresses(user_id);
      `);
    }

    console.log('Schema update completed successfully!');
  } catch (error) {
    console.error('Error updating schema:', error);
  } finally {
    await pool.end();
  }
}

updateUserSchema()
  .then(() => console.log('Done!'))
  .catch(err => console.error('Script failed:', err));
