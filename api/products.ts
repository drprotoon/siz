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
    const { featured, bestSeller, category, visible = 'true', new_arrival, id } = req.query;

    // If id is provided, get specific product
    if (id && typeof id === 'string') {
      // Check if id is a number or slug
      const isNumeric = /^\d+$/.test(id);

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
        query = query.eq('id', parseInt(id));
      } else {
        query = query.eq('slug', id);
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

      return res.json(transformedProduct);
    }

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
        how_to_use,
        visible,
        featured,
        new_arrival,
        best_seller,
        rating,
        review_count,
        created_at
      `);

    // Apply filters
    if (featured === 'true') {
      query = query.eq('featured', true);
    }

    if (bestSeller === 'true') {
      query = query.eq('best_seller', true);
    }

    if (new_arrival === 'true') {
      query = query.eq('new_arrival', true);
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
      created_at: product.created_at,
      reviewCount: product.review_count,
      how_to_use: product.how_to_use
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
