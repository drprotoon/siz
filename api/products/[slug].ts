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
    const { slug } = req.query;

    if (!slug || typeof slug !== 'string') {
      return res.status(400).json({ message: 'Product slug is required' });
    }

    // Check if slug is a number (ID) or a string (slug)
    const isNumeric = /^\d+$/.test(slug);

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
        height,
        width,
        length,
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
      query = query.eq('id', parseInt(slug));
    } else {
      query = query.eq('slug', slug);
    }

    const { data: product, error } = await query.single();

    if (error || !product) {
      console.error('Product not found:', error);
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
      categoryId: product.category_id,
      // Add dimensions for shipping calculation
      weight: product.weight,
      height: product.height,
      width: product.width,
      length: product.length
    };

    return res.json(transformedProduct);

  } catch (error) {
    console.error('Error in /api/products/[slug]:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
