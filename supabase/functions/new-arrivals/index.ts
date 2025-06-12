import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Build query for new arrival products
    const { data: products, error } = await supabase
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
      .eq('new_arrival', true)
      .eq('visible', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching new arrivals:', error)
      return new Response(
        JSON.stringify({ message: 'Error fetching new arrivals' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Transform the data to match expected format
    const transformedProducts = products?.map(product => ({
      ...product,
      images: Array.isArray(product.images) ? product.images :
               product.images ? [product.images] : [],
      sale_price: product.compareatprice,
      stock_quantity: product.quantity,
      reviewCount: product.review_count,
      category: product.categories
    })) || []

    return new Response(
      JSON.stringify(transformedProducts),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in new-arrivals function:', error)
    return new Response(
      JSON.stringify({ 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : String(error)
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
