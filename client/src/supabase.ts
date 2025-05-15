// Supabase client configuration
import { createClient } from '@supabase/supabase-js';

// Get Supabase URL and anon key from environment variables or use defaults
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// Create a Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Storage bucket name
export const bucketName = 'products';

// Helper function to get a public URL for a file in storage
export function getPublicUrl(path: string): string {
  const { data } = supabase.storage.from(bucketName).getPublicUrl(path);
  return data.publicUrl;
}

// Helper function to upload a file to storage
export async function uploadFile(file: File, path: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Error uploading file:', error);
      return null;
    }

    return getPublicUrl(data.path);
  } catch (error) {
    console.error('Error uploading file:', error);
    return null;
  }
}

// Helper function to delete a file from storage
export async function deleteFile(path: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([path]);

    if (error) {
      console.error('Error deleting file:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}

// Helper function to list files in a folder
export async function listFiles(folder: string): Promise<string[]> {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list(folder);

    if (error) {
      console.error('Error listing files:', error);
      return [];
    }

    return data.map(item => `${folder}/${item.name}`);
  } catch (error) {
    console.error('Error listing files:', error);
    return [];
  }
}

// Helper function to create a folder
export async function createFolder(folderPath: string): Promise<boolean> {
  try {
    // Create an empty file with a .keep extension to represent the folder
    const { error } = await supabase.storage
      .from(bucketName)
      .upload(`${folderPath}/.keep`, new Blob([]), {
        contentType: 'application/octet-stream',
        upsert: true
      });

    if (error) {
      console.error('Error creating folder:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error creating folder:', error);
    return false;
  }
}

export default supabase;
