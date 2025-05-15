// Simple test endpoint for Vercel
export default function handler(req, res) {
  res.status(200).json({
    message: 'API test endpoint is working!',
    timestamp: new Date().toISOString(),
    path: req.url,
    method: req.method,
    headers: req.headers,
    query: req.query,
    vercel: process.env.VERCEL === '1' ? 'true' : 'false',
    nodeEnv: process.env.NODE_ENV || 'development'
  });
}
