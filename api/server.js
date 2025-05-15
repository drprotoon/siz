// Servidor Express simplificado para o Vercel
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuração para ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Criar app Express
const app = express();

// Habilitar CORS
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware para parsing JSON
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Rotas da API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'API está funcionando!',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'production'
  });
});

// Rota para categorias (mock)
app.get('/api/categories', (req, res) => {
  res.json([
    { id: 1, name: 'Perfumes Femininos', slug: 'perfumes-femininos' },
    { id: 2, name: 'Perfumes Masculinos', slug: 'perfumes-masculinos' },
    { id: 3, name: 'Skincare', slug: 'skincare' },
    { id: 4, name: 'Maquiagem', slug: 'maquiagem' }
  ]);
});

// Rota para produtos (mock)
app.get('/api/products', (req, res) => {
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

  // Filtrar por categoria se especificado
  if (req.query.category) {
    return res.json(products.filter(p => p.category.slug === req.query.category));
  }

  // Filtrar por featured se especificado
  if (req.query.featured === 'true') {
    return res.json(products.filter(p => p.featured));
  }

  res.json(products);
});

// Rota para produto específico
app.get('/api/products/:slug', (req, res) => {
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

  const product = products.find(p => p.slug === req.params.slug);

  if (product) {
    return res.json(product);
  }

  res.status(404).json({ message: 'Produto não encontrado' });
});

// Rota para autenticação (mock)
app.get('/api/auth/me', (req, res) => {
  res.json({
    user: null
  });
});

// Rota para login (mock)
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (username && password) {
    return res.json({
      message: 'Login successful',
      user: {
        id: 1,
        username,
        role: 'customer',
        timestamp: new Date().getTime()
      }
    });
  }

  res.status(401).json({ message: 'Invalid credentials' });
});

// Rota para logout (mock)
app.post('/api/auth/logout', (req, res) => {
  res.json({ message: 'Logout successful' });
});

// Rota para carrinho (mock)
app.get('/api/cart', (req, res) => {
  res.json([]);
});

// Rota de fallback para endpoints não encontrados
app.all('/api/*', (req, res) => {
  res.status(404).json({
    message: 'API endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Export the Express API
export default app;
