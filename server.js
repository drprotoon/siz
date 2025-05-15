// Server for Vercel deployment
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import session from 'express-session';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import cors from 'cors';

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

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session setup
app.use(session({
  secret: process.env.SESSION_SECRET || 'siz-cosmeticos-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

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

// Authentication endpoints
app.post('/api/auth/login', (req, res) => {
  // For testing purposes, accept any login
  const { username, password } = req.body;

  if (username && password) {
    // Set a user in the session
    req.session.user = {
      id: 1,
      username,
      role: 'customer'
    };

    return res.json({
      message: 'Login successful',
      user: {
        id: 1,
        username,
        role: 'customer'
      }
    });
  }

  res.status(401).json({ message: 'Invalid credentials' });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ message: 'Logout successful' });
  });
});

app.get('/api/auth/me', (req, res) => {
  if (req.session.user) {
    res.json({ user: req.session.user });
  } else {
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
