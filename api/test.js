// Simple test endpoint for Vercel
export default function handler(req, res) {
  res.status(200).json({
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    path: req.url,
    method: req.method,
    headers: req.headers,
    query: req.query
  });
}
