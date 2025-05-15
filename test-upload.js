// Simple test script to upload a file to Supabase storage
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const bucketName = 'product-images';

// Check if Supabase is configured
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

// Create a test folder
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

// List folders in the bucket
async function listFolders() {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list();

    if (error) {
      console.error('Error listing folders:', error);
      return [];
    }

    // Filter folders (items ending with '/')
    const folders = data
      .filter(item => item.id && item.id.endsWith('/'))
      .map(folder => {
        const name = folder.name.endsWith('/') 
          ? folder.name.slice(0, -1) 
          : folder.name;
        return name;
      });

    return folders;
  } catch (error) {
    console.error('Error listing folders:', error);
    return [];
  }
}

// Main function
async function main() {
  try {
    // Create test folders
    await createFolder('test-folder');
    await createFolder('cabelos');
    await createFolder('maquiagem');
    
    // List folders
    const folders = await listFolders();
    console.log('Folders in bucket:', folders);
    
    console.log('Test completed successfully');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the script
main();
