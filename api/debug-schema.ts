import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client directly
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Test basic connection
    console.log('Testing Supabase connection...');
    
    // Get table info for categories
    const { data: categoriesInfo, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .limit(1);
    
    // Get table info for products
    const { data: productsInfo, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(1);
    
    // Try to get column information using a simple query
    let categoriesColumns = [];
    let productsColumns = [];
    
    if (categoriesInfo && categoriesInfo.length > 0) {
      categoriesColumns = Object.keys(categoriesInfo[0]);
    }
    
    if (productsInfo && productsInfo.length > 0) {
      productsColumns = Object.keys(productsInfo[0]);
    }
    
    return res.json({
      success: true,
      tables: {
        categories: {
          error: categoriesError,
          columns: categoriesColumns,
          sampleData: categoriesInfo?.[0] || null
        },
        products: {
          error: productsError,
          columns: productsColumns,
          sampleData: productsInfo?.[0] || null
        }
      }
    });
    
  } catch (error) {
    console.error('Debug schema error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}
