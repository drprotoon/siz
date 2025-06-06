import { VercelRequest, VercelResponse } from '@vercel/node';
import { runEssentialMigrations } from '../server/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests for security
  if (req.method !== 'POST') {
    res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only POST requests are allowed for migrations'
    });
    return;
  }

  try {
    console.log('🚀 Manual migration endpoint called');
    
    // Execute essential migrations
    await runEssentialMigrations();
    
    console.log('✅ Manual migrations completed successfully');
    
    res.status(200).json({
      success: true,
      message: 'Essential migrations completed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Manual migration failed:', error);
    
    res.status(500).json({
      success: false,
      message: 'Migration failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
