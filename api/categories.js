// Serverless function for handling category requests
import cors from 'cors';

// Configure CORS
const corsMiddleware = cors({
  origin: '*',
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
});

// Mock categories data
const categories = [
  { id: 1, name: 'Perfumes Femininos', slug: 'perfumes-femininos' },
  { id: 2, name: 'Perfumes Masculinos', slug: 'perfumes-masculinos' },
  { id: 3, name: 'Skincare', slug: 'skincare' },
  { id: 4, name: 'Maquiagem', slug: 'maquiagem' }
];

// Handler function
export default function handler(req, res) {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    console.log('OPTIONS request received for categories');
    return corsMiddleware(req, res, () => {
      res.status(200).end();
    });
  }

  // Handle GET request
  if (req.method === 'GET') {
    console.log('Categories request received');
    
    // Apply CORS middleware
    return corsMiddleware(req, res, () => {
      try {
        // Return mock categories
        return res.status(200).json(categories);
      } catch (error) {
        console.error('Error fetching categories:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }
    });
  }
  
  // Handle other methods
  return res.status(405).json({ message: 'Method not allowed' });
}
