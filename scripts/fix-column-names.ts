import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function fixColumnNames() {
  console.log('🔧 Fixing column names in database...');

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Check current column names in products table
    console.log('📋 Checking current column structure...');
    const columnsResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);

    const existingColumns = columnsResult.rows.map(row => row.column_name);
    console.log('Current columns:', existingColumns);

    // Rename createdat to created_at if it exists
    if (existingColumns.includes('createdat') && !existingColumns.includes('created_at')) {
      console.log('🔄 Renaming createdat to created_at...');
      await pool.query('ALTER TABLE products RENAME COLUMN createdat TO created_at');
      console.log('✅ Renamed createdat to created_at');
    } else if (existingColumns.includes('created_at')) {
      console.log('✅ Column created_at already exists');
    } else {
      console.log('⚠️ Neither createdat nor created_at found');
    }

    // Check if reviewcount exists and rename to review_count if needed
    if (existingColumns.includes('reviewcount') && !existingColumns.includes('review_count')) {
      console.log('🔄 Renaming reviewcount to review_count...');
      await pool.query('ALTER TABLE products RENAME COLUMN reviewcount TO review_count');
      console.log('✅ Renamed reviewcount to review_count');
    } else if (existingColumns.includes('review_count')) {
      console.log('✅ Column review_count already exists');
    }

    // Check if howtouse exists and rename to how_to_use if needed
    if (existingColumns.includes('howtouse') && !existingColumns.includes('how_to_use')) {
      console.log('🔄 Renaming howtouse to how_to_use...');
      await pool.query('ALTER TABLE products RENAME COLUMN howtouse TO how_to_use');
      console.log('✅ Renamed howtouse to how_to_use');
    } else if (existingColumns.includes('how_to_use')) {
      console.log('✅ Column how_to_use already exists');
    }

    // Verify final structure
    console.log('📋 Final column structure:');
    const finalResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);

    finalResult.rows.forEach(row => {
      console.log('  -', row.column_name);
    });

    console.log('✅ Column names fixed successfully!');

  } catch (error) {
    console.error('❌ Error fixing column names:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the script
fixColumnNames()
  .then(() => {
    console.log('🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
