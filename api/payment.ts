// This file has been removed as payment processing is now handled by Supabase Edge Functions
// See: supabase/functions/payment/index.ts
//
// The Supabase Edge Function provides better performance, scalability, and avoids
// Vercel's serverless function limits while maintaining the same functionality.
//
// Frontend code automatically uses the Edge Function when VITE_SUPABASE_URL is configured.

export default function handler() {
  return new Response(
    JSON.stringify({
      error: 'This endpoint has been migrated to Supabase Edge Functions',
      message: 'Please use the Supabase Edge Function at /functions/v1/payment instead'
    }),
    {
      status: 410, // Gone
      headers: { 'Content-Type': 'application/json' }
    }
  );
}
