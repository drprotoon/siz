// Server for Vercel deployment
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import cors from 'cors';

// These modules might cause issues in serverless environment, so we'll mock them
const mockSession = (req, res, next) => {
  if (!req.session) {
    req.session = { id: 'mock-session-id' };
    req.session.destroy = (cb) => cb && cb();
  }
  next();
};

// Setup for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();

// Enable CORS for all routes
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle OPTIONS method for preflight requests
app.options('*', cors());

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Use mock session middleware
app.use(mockSession);

// Find the static files directory
const publicDir = path.join(__dirname, 'dist', 'public');
console.log(`Serving static files from: ${publicDir}`);

// Serve static files
app.use(express.static(publicDir, {
  maxAge: '1d',
  etag: true
}));

// Serve assets with longer cache time
const assetsDir = path.join(publicDir, 'assets');
if (fs.existsSync(assetsDir)) {
  app.use('/assets', express.static(assetsDir, {
    maxAge: '7d',
    etag: true
  }));
}

// API endpoints
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from Vercel!' });
});

// Special handler for login route to debug
app.options('/api/auth/login', (req, res) => {
  console.log('OPTIONS request for login received');
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(200).send();
});

// Authentication endpoints
app.post('/api/auth/login', (req, res) => {
  console.log('Login request received:', req.body);

  // For testing purposes, accept any login
  const { username, password } = req.body;

  if (username && password) {
    // Set a mock user
    const user = {
      id: 1,
      username,
      role: 'customer'
    };

    // Store in mock session
    req.session.user = user;

    console.log('Login successful for user:', username);
    return res.status(200).json({
      message: 'Login successful',
      user
    });
  }

  console.log('Invalid credentials provided');
  res.status(401).json({ message: 'Invalid credentials' });
});

app.post('/api/auth/logout', (req, res) => {
  console.log('Logout request received');

  // Clear mock session
  delete req.session.user;

  res.status(200).json({ message: 'Logout successful' });
});

app.get('/api/auth/me', (req, res) => {
  console.log('Auth check request received');

  // Check mock session
  if (req.session.user) {
    console.log('User is authenticated:', req.session.user);
    res.status(200).json({ user: req.session.user });
  } else {
    console.log('User is not authenticated');
    res.status(401).json({ message: 'Not authenticated' });
  }
});

// Products endpoint
app.get('/api/products', (req, res) => {
  // Return mock products
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

  res.json(products);
});

// Categories endpoint
app.get('/api/categories', (req, res) => {
  // Return mock categories
  const categories = [
    { id: 1, name: 'Perfumes Femininos', slug: 'perfumes-femininos' },
    { id: 2, name: 'Perfumes Masculinos', slug: 'perfumes-masculinos' },
    { id: 3, name: 'Skincare', slug: 'skincare' },
    { id: 4, name: 'Maquiagem', slug: 'maquiagem' }
  ];

  res.json(categories);
});

// Cart endpoint
app.get('/api/cart', (req, res) => {
  res.json([]);
});

// Handle client-side routing (must be after API routes)
app.get('*', (req, res) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ message: 'API endpoint not found' });
  }

  const indexPath = path.join(publicDir, 'index.html');

  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  } else {
    return res.status(404).send('Not found: index.html is missing');
  }
});

// Start server if not in Vercel environment
if (process.env.VERCEL !== '1') {
  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

// Export for Vercel
export default app;
