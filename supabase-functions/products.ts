// Supabase Edge Function para produtos
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
    
    // GET /products - List products with filters
    if (req.method === 'GET' && pathSegments.length === 1) {
      const { searchParams } = url
      const featured = searchParams.get('featured')
      const bestSeller = searchParams.get('bestSeller') 
      const category = searchParams.get('category')
      const visible = searchParams.get('visible') ?? 'true'
      const newArrival = searchParams.get('new_arrival')
      const id = searchParams.get('id')

      // If id is provided, get specific product
      if (id) {
        const isNumeric = /^\d+$/.test(id)
        
        let query = supabaseClient
          .from('products')
          .select(`
            id, name, slug, description, price, compareatprice, sku,
            weight, height, width, length, quantity, category_id,
            images, ingredients, how_to_use, visible, featured,
            new_arrival, best_seller, rating, review_count, created_at,
            categories (id, name, slug)
          `)
          .eq('visible', true)

        if (isNumeric) {
          query = query.eq('id', parseInt(id))
        } else {
          query = query.eq('slug', id)
        }

        const { data: product, error } = await query.single()

        if (error || !product) {
          return new Response(
            JSON.stringify({ message: 'Product not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const transformedProduct = {
          ...product,
          images: Array.isArray(product.images) ? product.images : 
                   product.images ? [product.images] : [],
          sale_price: product.compareatprice,
          stock_quantity: product.quantity,
          reviewCount: product.review_count,
          category: product.categories,
          categoryId: product.category_id
        }

        return new Response(
          JSON.stringify(transformedProduct),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // List products with filters
      let query = supabaseClient
        .from('products')
        .select(`
          id, name, slug, description, price, compareatprice, sku,
          weight, quantity, category_id, images, ingredients, how_to_use,
          visible, featured, new_arrival, best_seller, rating, review_count, created_at
        `)

      // Apply filters
      if (featured === 'true') query = query.eq('featured', true)
      if (bestSeller === 'true') query = query.eq('best_seller', true)
      if (newArrival === 'true') query = query.eq('new_arrival', true)
      if (visible === 'true') query = query.eq('visible', true)

      if (category) {
        const { data: categoryData } = await supabaseClient
          .from('categories')
          .select('id')
          .eq('slug', category)
          .single()

        if (categoryData) {
          query = query.eq('category_id', categoryData.id)
        }
      }

      query = query.order('created_at', { ascending: false })

      const { data: products, error } = await query

      if (error) {
        return new Response(
          JSON.stringify({ message: 'Error fetching products', error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const transformedProducts = products?.map(product => ({
        ...product,
        images: Array.isArray(product.images) ? product.images :
                 product.images ? [product.images] : [],
        sale_price: product.compareatprice,
        stock_quantity: product.quantity,
        reviewCount: product.review_count
      })) || []

      return new Response(
        JSON.stringify(transformedProducts),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ message: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ message: 'Internal server error', error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
