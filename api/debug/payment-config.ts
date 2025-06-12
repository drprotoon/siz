import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check environment variables (without exposing sensitive data)
    const config = {
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      isVercel: process.env.VERCEL === '1',
      abacatePayConfigured: {
        apiKey: !!process.env.ABACATEPAY_API_KEY,
        apiUrl: process.env.ABACATEPAY_API_URL || 'https://api.abacatepay.com',
        webhookSecret: !!process.env.ABACATEPAY_WEBHOOK_SECRET,
        webhookBaseUrl: process.env.WEBHOOK_BASE_URL || 'https://siz-cosmetic-store-pro.vercel.app'
      },
      supabaseConfigured: {
        url: !!process.env.SUPABASE_URL,
        serviceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      },
      timestamp: new Date().toISOString()
    };

    return res.status(200).json(config);

  } catch (error) {
    console.error('Payment config debug error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
