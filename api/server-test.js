// Test endpoint to verify server integration
export default function handler(req, res) {
  res.status(200).json({
    message: 'Server integration test endpoint',
    timestamp: new Date().toISOString(),
    path: req.url,
    method: req.method,
    vercel: process.env.VERCEL === '1' ? 'true' : 'false',
    nodeEnv: process.env.NODE_ENV || 'development',
    info: 'This endpoint is used to verify that the server integration is working correctly'
  });
}
