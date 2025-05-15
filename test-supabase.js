// Use CommonJS syntax
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const bucketName = 'product-images';

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseKey ? `${supabaseKey.substring(0, 10)}...` : 'Not set');

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testSupabase() {
  try {
    console.log('Testing Supabase connection...');

    // List buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      return;
    }

    console.log('Available buckets:', buckets.map(b => b.name));

    // Check if our bucket exists
    const bucketExists = buckets.some(bucket => bucket.name === bucketName);
    console.log(`Bucket '${bucketName}' exists:`, bucketExists);

    if (!bucketExists) {
      console.log(`Creating bucket '${bucketName}'...`);
      const { error } = await supabase.storage.createBucket(bucketName, {
        public: true
      });

      if (error) {
        console.error('Error creating bucket:', error);
        return;
      }

      console.log(`Bucket '${bucketName}' created successfully`);
    }

    // List folders in the bucket
    console.log(`Listing folders in bucket '${bucketName}'...`);
    const { data: folders, error: foldersError } = await supabase.storage
      .from(bucketName)
      .list();

    if (foldersError) {
      console.error('Error listing folders:', foldersError);
      return;
    }

    console.log('Folders in bucket:', folders);

    // List only directories
    const directories = folders
      .filter(item => item.id && item.id.endsWith('/'))
      .map(folder => {
        const name = folder.name && folder.name.endsWith('/')
          ? folder.name.slice(0, -1)
          : folder.name;
        return name;
      });

    console.log('Directories in bucket:', directories);

    // If there are directories, list images in the first one
    if (directories.length > 0) {
      const firstDir = directories[0];
      console.log(`Listing images in directory '${firstDir}'...`);

      const { data: images, error: imagesError } = await supabase.storage
        .from(bucketName)
        .list(firstDir);

      if (imagesError) {
        console.error(`Error listing images in '${firstDir}':`, imagesError);
        return;
      }

      console.log(`Images in '${firstDir}':`, images);

      // Filter only image files
      const imageFiles = images.filter(item =>
        !item.id.endsWith('/') && // Not a folder
        /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(item.name) // Is an image
      );

      console.log(`Image files in '${firstDir}':`, imageFiles);

      // Generate public URLs for images
      const imageUrls = imageFiles.map(file => {
        const filePath = `${firstDir}/${file.name}`;
        const { data } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath);

        return {
          name: file.name,
          url: data.publicUrl,
          path: filePath
        };
      });

      console.log(`Image URLs in '${firstDir}':`, imageUrls);
    }

  } catch (error) {
    console.error('Error testing Supabase:', error);
  }
}

testSupabase();
