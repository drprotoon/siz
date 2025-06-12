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
      return res.status(400).json({ message: 'Category slug is required' });
    }

    // Get category by slug
    const { data: category, error } = await supabase
      .from('categories')
      .select(`
        id,
        name,
        slug,
        description,
        image_url,
        parent_id,
        order
      `)
      .eq('slug', slug)
      .single();

    if (error || !category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Transform the data to match expected format
    const transformedCategory = {
      ...category,
      image: category.image_url
    };

    res.json(transformedCategory);

  } catch (error) {
    console.error('Error in /api/categories/[slug]:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
