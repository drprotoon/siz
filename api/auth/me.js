// Serverless function for checking authentication status
import cors from 'cors';

// Configure CORS
const corsMiddleware = cors({
  origin: '*',
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
});

// Handler function
export default function handler(req, res) {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    console.log('OPTIONS request received for auth check');
    return corsMiddleware(req, res, () => {
      res.status(200).end();
    });
  }

  // Handle GET request
  if (req.method === 'GET') {
    console.log('Auth check request received');
    
    // Apply CORS middleware
    return corsMiddleware(req, res, () => {
      try {
        // For testing purposes, return not authenticated
        // In a real app, you would check the session or token
        console.log('User is not authenticated');
        return res.status(401).json({ message: 'Not authenticated' });
      } catch (error) {
        console.error('Error checking authentication:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }
    });
  }
  
  // Handle other methods
  return res.status(405).json({ message: 'Method not allowed' });
}
