// Simple test script to verify Supabase storage connection
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import { dirname } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const bucketName = 'product-images';

// Check if Supabase is configured
if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials not found in environment variables');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseStorage() {
  try {
    // List buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) {
      throw new Error(`Error listing buckets: ${bucketsError.message}`);
    }

    console.log('Available buckets:', buckets.map(b => b.name));

    // Check if our bucket exists
    const bucketExists = buckets.some(bucket => bucket.name === bucketName);

    if (!bucketExists) {
      console.log(`Bucket '${bucketName}' does not exist. Creating it...`);

      // Create bucket
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
      });

      if (createError) {
        throw new Error(`Error creating bucket: ${createError.message}`);
      }

      console.log(`Bucket '${bucketName}' created successfully`);
    } else {
      console.log(`Bucket '${bucketName}' already exists`);

      // List files in the bucket
      const { data: files, error: filesError } = await supabase.storage
        .from(bucketName)
        .list();

      if (filesError) {
        throw new Error(`Error listing files: ${filesError.message}`);
      }

      console.log(`Files in bucket '${bucketName}':`, files.length ? files : 'No files found');
    }

    console.log('Supabase storage test completed successfully');
  } catch (error) {
    console.error('Error testing Supabase storage:', error);
  }
}

testSupabaseStorage();
