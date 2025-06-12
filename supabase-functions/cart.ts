// Supabase Edge Function para carrinho
// Deploy: https://supabase.com/dashboard/project/[PROJECT_ID]/functions

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { verify } from "https://deno.land/x/djwt@v2.8/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to verify JWT token
async function verifyToken(authHeader: string | null, jwtSecret: string) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.replace('Bearer ', '')
  
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(jwtSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    )

    const payload = await verify(token, key)
    return payload
  } catch (error) {
    return null
  }
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

    const jwtSecret = Deno.env.get('JWT_SECRET')
    if (!jwtSecret) {
      return new Response(
        JSON.stringify({ message: 'JWT secret not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify authentication
    const authHeader = req.headers.get('authorization')
    const user = await verifyToken(authHeader, jwtSecret)
    
    if (!user) {
      return new Response(
        JSON.stringify({ message: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET /cart - Get user's cart
    if (req.method === 'GET') {
      const { data: cartItems, error } = await supabaseClient
        .from('cart_items')
        .select(`
          id, quantity, created_at,
          products (
            id, name, slug, price, images, sku, weight,
            height, width, length, stock_quantity: quantity
          )
        `)
        .eq('user_id', user.userId)

      if (error) {
        return new Response(
          JSON.stringify({ message: 'Error fetching cart', error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Transform cart items to expected format
      const transformedItems = cartItems?.map(item => ({
        id: item.id,
        quantity: item.quantity,
        product: {
          ...item.products,
          images: Array.isArray(item.products.images) ? item.products.images :
                   item.products.images ? [item.products.images] : []
        }
      })) || []

      return new Response(
        JSON.stringify(transformedItems),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST /cart - Add item to cart
    if (req.method === 'POST') {
      const { productId, quantity = 1 } = await req.json()

      if (!productId) {
        return new Response(
          JSON.stringify({ message: 'Product ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check if item already exists in cart
      const { data: existingItem } = await supabaseClient
        .from('cart_items')
        .select('id, quantity')
        .eq('user_id', user.userId)
        .eq('product_id', productId)
        .single()

      if (existingItem) {
        // Update existing item
        const { data, error } = await supabaseClient
          .from('cart_items')
          .update({ quantity: existingItem.quantity + quantity })
          .eq('id', existingItem.id)
          .select()
          .single()

        if (error) {
          return new Response(
            JSON.stringify({ message: 'Error updating cart item', error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ message: 'Cart updated', item: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } else {
        // Add new item
        const { data, error } = await supabaseClient
          .from('cart_items')
          .insert({
            user_id: user.userId,
            product_id: productId,
            quantity: quantity
          })
          .select()
          .single()

        if (error) {
          return new Response(
            JSON.stringify({ message: 'Error adding to cart', error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ message: 'Item added to cart', item: data }),
          { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // PUT /cart/:id - Update cart item quantity
    if (req.method === 'PUT') {
      const url = new URL(req.url)
      const pathSegments = url.pathname.split('/').filter(Boolean)
      const itemId = pathSegments[pathSegments.length - 1]

      if (!itemId) {
        return new Response(
          JSON.stringify({ message: 'Item ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { quantity } = await req.json()

      if (!quantity || quantity < 1) {
        return new Response(
          JSON.stringify({ message: 'Valid quantity is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data, error } = await supabaseClient
        .from('cart_items')
        .update({ quantity })
        .eq('id', itemId)
        .eq('user_id', user.userId)
        .select()
        .single()

      if (error) {
        return new Response(
          JSON.stringify({ message: 'Error updating cart item', error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ message: 'Cart item updated', item: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // DELETE /cart/:id - Remove item from cart
    if (req.method === 'DELETE') {
      const url = new URL(req.url)
      const pathSegments = url.pathname.split('/').filter(Boolean)
      const itemId = pathSegments[pathSegments.length - 1]

      if (!itemId) {
        return new Response(
          JSON.stringify({ message: 'Item ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { error } = await supabaseClient
        .from('cart_items')
        .delete()
        .eq('id', itemId)
        .eq('user_id', user.userId)

      if (error) {
        return new Response(
          JSON.stringify({ message: 'Error removing cart item', error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ message: 'Item removed from cart' }),
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
