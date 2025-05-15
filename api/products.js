// Serverless function for handling product requests
import cors from 'cors';

// Configure CORS
const corsMiddleware = cors({
  origin: '*',
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
});

// Mock products data
const products = [
  {
    id: 1,
    name: 'Perfume Feminino',
    slug: 'perfume-feminino',
    description: 'Um perfume delicado com notas florais',
    price: 129.90,
    compareAtPrice: 149.90,
    images: ['https://placehold.co/400x400?text=Perfume'],
    categoryId: 1,
    category: { id: 1, name: 'Perfumes Femininos', slug: 'perfumes-femininos' },
    featured: true,
    visible: true
  },
  {
    id: 2,
    name: 'Perfume Masculino',
    slug: 'perfume-masculino',
    description: 'Um perfume marcante com notas amadeiradas',
    price: 139.90,
    compareAtPrice: 159.90,
    images: ['https://placehold.co/400x400?text=Perfume'],
    categoryId: 2,
    category: { id: 2, name: 'Perfumes Masculinos', slug: 'perfumes-masculinos' },
    featured: true,
    visible: true
  }
];

// Handler function
export default function handler(req, res) {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    console.log('OPTIONS request received for products');
    return corsMiddleware(req, res, () => {
      res.status(200).end();
    });
  }

  // Handle GET request
  if (req.method === 'GET') {
    console.log('Products request received');
    
    // Apply CORS middleware
    return corsMiddleware(req, res, () => {
      try {
        // Return mock products
        return res.status(200).json(products);
      } catch (error) {
        console.error('Error fetching products:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }
    });
  }
  
  // Handle other methods
  return res.status(405).json({ message: 'Method not allowed' });
}
