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

    const url = new URL(req.url)
    const { searchParams } = url

    // Get query parameters
    const featured = searchParams.get('featured')
    const bestSeller = searchParams.get('bestSeller')
    const newArrival = searchParams.get('new_arrival')
    const category = searchParams.get('category')
    const visible = searchParams.get('visible') || 'true'
    const id = searchParams.get('id')

    // If id is provided, get specific product
    if (id) {
      // Check if id is a number or slug
      const isNumeric = /^\d+$/.test(id)

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
        .eq('visible', true)

      // If numeric, search by ID, otherwise by slug
      if (isNumeric) {
        query = query.eq('id', parseInt(id))
      } else {
        query = query.eq('slug', id)
      }

      const { data: product, error } = await query.single()

      if (error || !product) {
        return new Response(
          JSON.stringify({ message: 'Product not found' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Transform the data to match expected format
      const transformedProduct = {
        ...product,
        images: Array.isArray(product.images) ? product.images :
                 product.images ? [product.images] : [],
        sale_price: product.compareatprice,
        stock_quantity: product.quantity,
        reviewCount: product.review_count,
        category: product.categories
      }

      return new Response(
        JSON.stringify(transformedProduct),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build query for multiple products
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

    // Apply filters
    if (featured === 'true') {
      query = query.eq('featured', true)
    }

    if (bestSeller === 'true') {
      query = query.eq('best_seller', true)
    }

    if (newArrival === 'true') {
      query = query.eq('new_arrival', true)
    }

    if (category) {
      // Get category by slug first
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', category)
        .single()

      if (categoryError || !categoryData) {
        return new Response(
          JSON.stringify([]),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      query = query.eq('category_id', categoryData.id)
    }

    // Only show visible products by default
    if (visible === 'true') {
      query = query.eq('visible', true)
    }

    // Order by created_at desc
    query = query.order('created_at', { ascending: false })

    const { data: products, error } = await query

    if (error) {
      console.error('Error fetching products:', error)
      return new Response(
        JSON.stringify({ message: 'Error fetching products' }),
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
    console.error('Error in products function:', error)
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
