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
    const { featured, bestSeller, category, visible = 'true' } = req.query;

    // Build query
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
        howtouse,
        visible,
        featured,
        new_arrival,
        best_seller,
        rating,
        review_count,
        createdat
      `);

    // Apply filters
    if (featured === 'true') {
      query = query.eq('featured', true);
    }

    if (bestSeller === 'true') {
      query = query.eq('best_seller', true);
    }

    if (category) {
      // Get category by slug first
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', category)
        .single();

      if (categoryError || !categoryData) {
        return res.json([]);
      }

      query = query.eq('category_id', categoryData.id);
    }

    // Only show visible products by default
    if (visible === 'true') {
      query = query.eq('visible', true);
    }

    // Order by created_at desc
    query = query.order('created_at', { ascending: false });

    const { data: products, error } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      return res.status(500).json({ message: 'Error fetching products' });
    }

    // Transform the data to match expected format
    const transformedProducts = products?.map(product => ({
      ...product,
      images: Array.isArray(product.images) ? product.images :
               product.images ? [product.images] : [],
      sale_price: product.compareatprice,
      stock_quantity: product.quantity,
      created_at: product.createdat,
      reviewCount: product.review_count,
      how_to_use: product.howtouse
    })) || [];

    res.json(transformedProducts);

  } catch (error) {
    console.error('Error in /api/products:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
