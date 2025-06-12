// Supabase Edge Function para categorias
// Deploy: https://supabase.com/dashboard/project/[PROJECT_ID]/functions

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
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const pathSegments = url.pathname.split('/').filter(Boolean)

    // GET /categories - List all categories
    if (req.method === 'GET' && pathSegments.length === 1) {
      const { data: categories, error } = await supabaseClient
        .from('categories')
        .select('*')
        .order('name')

      if (error) {
        return new Response(
          JSON.stringify({ message: 'Error fetching categories', error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify(categories || []),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET /categories/:slug - Get category by slug with products
    if (req.method === 'GET' && pathSegments.length === 2) {
      const slug = pathSegments[1]

      // Get category
      const { data: category, error: categoryError } = await supabaseClient
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .single()

      if (categoryError || !category) {
        return new Response(
          JSON.stringify({ message: 'Category not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get products in this category
      const { data: products, error: productsError } = await supabaseClient
        .from('products')
        .select(`
          id, name, slug, description, price, compareatprice, sku,
          weight, quantity, images, visible, featured, new_arrival,
          best_seller, rating, review_count, created_at
        `)
        .eq('category_id', category.id)
        .eq('visible', true)
        .order('created_at', { ascending: false })

      if (productsError) {
        return new Response(
          JSON.stringify({ message: 'Error fetching products', error: productsError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Transform products
      const transformedProducts = products?.map(product => ({
        ...product,
        images: Array.isArray(product.images) ? product.images :
                 product.images ? [product.images] : [],
        sale_price: product.compareatprice,
        stock_quantity: product.quantity,
        reviewCount: product.review_count
      })) || []

      return new Response(
        JSON.stringify({
          category,
          products: transformedProducts
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ message: 'Not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ message: 'Internal server error', error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
