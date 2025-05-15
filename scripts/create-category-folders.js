// Script to create folders in Supabase storage for existing categories
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import pg from 'pg';

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const bucketName = 'product-images';

// Database configuration
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials not found in environment variables');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Create database pool
const { Pool } = pg;
const pool = new Pool({
  connectionString: dbUrl,
});

/**
 * Create a folder in the Supabase bucket
 */
async function createFolder(folderName) {
  try {
    // Add trailing slash to indicate it's a folder
    const folderPath = folderName.endsWith('/') ? folderName : `${folderName}/`;

    // Create an empty .keep file to represent the folder
    const { error } = await supabase.storage
      .from(bucketName)
      .upload(`${folderPath}.keep`, new Uint8Array(0), {
        contentType: 'application/octet-stream',
        upsert: true
      });

    if (error) {
      console.error(`Error creating folder '${folderName}':`, error);
      return false;
    }

    console.log(`Folder '${folderName}' created successfully`);
    return true;
  } catch (error) {
    console.error(`Error creating folder '${folderName}':`, error);
    return false;
  }
}

/**
 * Get all categories from the database
 */
async function getCategories() {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT id, name, slug FROM categories');
    return result.rows;
  } finally {
    client.release();
  }
}

/**
 * Main function
 */
async function main() {
  try {
    // Check if bucket exists, create if not
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      process.exit(1);
    }

    const bucketExists = buckets.some(bucket => bucket.name === bucketName);

    if (!bucketExists) {
      console.log(`Bucket '${bucketName}' does not exist. Creating it...`);

      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
      });

      if (createError) {
        console.error('Error creating bucket:', createError);
        process.exit(1);
      }

      console.log(`Bucket '${bucketName}' created successfully`);
    }

    // Get all categories
    const categories = await getCategories();
    console.log(`Found ${categories.length} categories`);

    // Create a folder for each category
    for (const category of categories) {
      console.log(`Processing category: ${category.name} (${category.slug})`);
      await createFolder(category.slug);
    }

    console.log('All category folders created successfully');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the script
main();
