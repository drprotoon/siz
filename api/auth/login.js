// Serverless function for handling login requests
import cors from 'cors';

// Configure CORS
const corsMiddleware = cors({
  origin: '*',
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
});

// Handler function
export default function handler(req, res) {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    console.log('OPTIONS request received for login');
    return corsMiddleware(req, res, () => {
      res.status(200).end();
    });
  }

  // Handle POST request
  if (req.method === 'POST') {
    console.log('Login request received:', req.body);
    
    // Apply CORS middleware
    return corsMiddleware(req, res, () => {
      try {
        // Extract credentials
        const { username, password } = req.body || {};
        
        // Simple validation
        if (!username || !password) {
          console.log('Missing username or password');
          return res.status(400).json({ message: 'Username and password are required' });
        }
        
        // For testing purposes, accept any login
        const user = {
          id: 1,
          username,
          role: 'customer'
        };
        
        console.log('Login successful for user:', username);
        return res.status(200).json({
          message: 'Login successful',
          user
        });
      } catch (error) {
        console.error('Error processing login:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }
    });
  }
  
  // Handle other methods
  return res.status(405).json({ message: 'Method not allowed' });
}
