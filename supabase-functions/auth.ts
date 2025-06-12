// Supabase Edge Function para autenticação
// Deploy: https://supabase.com/dashboard/project/[PROJECT_ID]/functions

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts"
import { create, verify, getNumericDate } from "https://deno.land/x/djwt@v2.8/mod.ts"

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

    const jwtSecret = Deno.env.get('JWT_SECRET')
    if (!jwtSecret) {
      return new Response(
        JSON.stringify({ message: 'JWT secret not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST /auth - Login
    if (req.method === 'POST') {
      const { email, password } = await req.json()

      if (!email || !password) {
        return new Response(
          JSON.stringify({ message: 'Email and password are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get user from Supabase
      const { data: user, error } = await supabaseClient
        .from('users')
        .select('*')
        .eq('email', email)
        .single()

      if (error || !user) {
        return new Response(
          JSON.stringify({ message: 'Invalid credentials' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password)
      if (!isValidPassword) {
        return new Response(
          JSON.stringify({ message: 'Invalid credentials' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Generate JWT token
      const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(jwtSecret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign", "verify"]
      )

      const payload = {
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        exp: getNumericDate(60 * 60 * 24 * 7) // 7 days
      }

      const token = await create({ alg: "HS256", typ: "JWT" }, payload, key)

      return new Response(
        JSON.stringify({
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET /auth - Verify token and get user info
    if (req.method === 'GET') {
      const authHeader = req.headers.get('authorization')
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(
          JSON.stringify({ message: 'No token provided' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
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
        
        // Get fresh user data from database
        const { data: userData, error } = await supabaseClient
          .from('users')
          .select('id, username, email, role, created_at')
          .eq('id', payload.userId)
          .single()

        if (error || !userData) {
          return new Response(
            JSON.stringify({ message: 'User not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ user: userData }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } catch (error) {
        return new Response(
          JSON.stringify({ message: 'Invalid token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
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
