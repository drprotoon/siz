#!/usr/bin/env node

// Simple script to test database connection
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env file
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

console.log('Current directory:', __dirname);
console.log('Parent directory:', path.resolve(__dirname, '..'));

// Check if .env file exists
const envPath = path.resolve(__dirname, '../.env');
console.log('.env file exists:', fs.existsSync(envPath));

// Log environment variables
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
console.log('NODE_ENV:', process.env.NODE_ENV || 'Not set');

async function testConnection() {
  // Create a PostgreSQL connection pool
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  console.log('Pool created');

  try {
    console.log('Testing connection...');
    const result = await pool.query('SELECT NOW()');
    console.log('Connection successful!');
    console.log('Current time from database:', result.rows[0].now);
    
    // Test if users table exists
    const usersTableResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);
    
    console.log('Users table exists:', usersTableResult.rows[0].exists);
    
    // If users table exists, check its columns
    if (usersTableResult.rows[0].exists) {
      const columnsResult = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users';
      `);
      
      console.log('Users table columns:', columnsResult.rows.map(row => row.column_name));
    }
    
  } catch (error) {
    console.error('Error connecting to database:', error);
  } finally {
    await pool.end();
    console.log('Pool ended');
  }
}

testConnection()
  .then(() => console.log('Done!'))
  .catch(err => console.error('Script failed:', err));
