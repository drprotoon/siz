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
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    // Check if id is a number or slug
    const isNumeric = /^\d+$/.test(id as string);
    
    if (!id) {
      return res.status(400).json({ message: 'Product ID or slug is required' });
    }

    let query = supabase
      .from('products')
      .select(`
        id,
        name,
        slug,
        description,
        price,
        compareatprice,
        sku,
        weight,
        quantity,
        category_id,
        images,
        ingredients,
        how_to_use,
        visible,
        featured,
        new_arrival,
        best_seller,
        rating,
        review_count,
        created_at,
        categories (
          id,
          name,
          slug
        )
      `)
      .eq('visible', true);

    // If numeric, search by ID, otherwise by slug
    if (isNumeric) {
      query = query.eq('id', parseInt(id as string));
    } else {
      query = query.eq('slug', id as string);
    }

    const { data: product, error } = await query.single();

    if (error || !product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Transform the data to match expected format
    const transformedProduct = {
      ...product,
      images: Array.isArray(product.images) ? product.images :
               product.images ? [product.images] : [],
      sale_price: product.compareatprice,
      stock_quantity: product.quantity,
      created_at: product.created_at,
      reviewCount: product.review_count,
      how_to_use: product.how_to_use,
      category: product.categories,
      categoryId: product.category_id
    };

    res.json(transformedProduct);

  } catch (error) {
    console.error('Error in /api/products/[id]:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
