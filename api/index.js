// API handler for Vercel - Integração com o servidor Express existente
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';
import session from 'express-session';
import MemoryStore from 'memorystore';

// Configuração para ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const serverDir = path.join(rootDir, 'server');

// Create Express app
const app = express();

// Enable CORS
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With', 'Accept', 'Accept-Version', 'Content-Length', 'Content-MD5', 'Date', 'X-Api-Version']
}));

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

// Cliente do Supabase
const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// Session setup
const MemoryStoreSession = MemoryStore(session);
app.use(session({
  secret: process.env.SESSION_SECRET || "beauty-essence-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production" && process.env.DISABLE_SECURE_COOKIE !== "true",
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax'
  },
  store: new MemoryStoreSession({
    checkPeriod: 86400000 // prune expired entries every 24h
  })
}));

// Importar e registrar as rotas do servidor
async function registerServerRoutes() {
  try {
    // Verificar se o módulo de rotas existe
    const routesPath = path.join(serverDir, 'routes.js');
    const routesTsPath = path.join(serverDir, 'routes.ts');

    if (fs.existsSync(routesPath)) {
      console.log('Carregando rotas do servidor a partir de routes.js');
      const { registerRoutes } = await import('../server/routes.js');
      await registerRoutes(app);
    } else if (fs.existsSync(routesTsPath)) {
      console.log('Carregando rotas do servidor a partir de routes.ts');
      const { registerRoutes } = await import('../server/routes.ts');
      await registerRoutes(app);
    } else {
      console.log('Arquivo de rotas não encontrado, usando rotas de fallback');
      setupFallbackRoutes();
    }
  } catch (error) {
    console.error('Erro ao carregar rotas do servidor:', error);
    console.log('Usando rotas de fallback devido a erro');
    setupFallbackRoutes();
  }
}

// Configurar rotas de fallback caso não seja possível carregar as rotas do servidor
function setupFallbackRoutes() {
  console.log('Configurando rotas de fallback para a API');

  // Mock data para fallback
  const mockUsers = [
    { id: 1, username: 'admin', email: 'admin@example.com', role: 'admin' },
    { id: 2, username: 'customer', email: 'customer@example.com', role: 'customer' }
  ];

  const mockProducts = [
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

  const mockCategories = [
    { id: 1, name: 'Perfumes Femininos', slug: 'perfumes-femininos' },
    { id: 2, name: 'Perfumes Masculinos', slug: 'perfumes-masculinos' },
    { id: 3, name: 'Skincare', slug: 'skincare' },
    { id: 4, name: 'Maquiagem', slug: 'maquiagem' }
  ];

  // Authentication routes
  app.post('/api/auth/login', async (req, res) => {
    try {
      console.log('Login request received:', req.body);

      // Extract credentials
      const { username, email, password } = req.body || {};

      // Determinar qual campo usar para login (username ou email)
      const loginField = email || username;

      // Simple validation
      if (!loginField || !password) {
        console.log('Missing login credentials or password');
        return res.status(400).json({ message: 'Login credentials and password are required' });
      }

      // Verificar se o Supabase está configurado
      if (!supabase) {
        console.log('Supabase not configured, using mock login');
        // Fallback para login mock
        const mockUser = mockUsers.find(u =>
          u.username === loginField || u.email === loginField
        );

        if (mockUser && (password === 'password' || password === '123456')) {
          console.log('Mock login successful for user:', loginField);
          return res.status(200).json({
            message: 'Login successful (mock)',
            user: mockUser
          });
        } else {
          return res.status(401).json({ message: 'Incorrect username/email or password' });
        }
      }

      // Determinar se o login é por email ou username
      const isEmail = loginField.includes('@');

      // Buscar usuário no banco de dados
      let query = supabase.from('users').select('*');

      if (isEmail) {
        query = query.eq('email', loginField);
      } else {
        query = query.eq('username', loginField);
      }

      const { data, error } = await query.single();

      if (error || !data) {
        console.log('User not found:', loginField);
        return res.status(401).json({ message: 'Incorrect username/email or password' });
      }

      // Verificar senha - primeiro tentar com bcrypt, se falhar usar comparação direta
      let isValidPassword = false;

      try {
        // Tentar usar bcrypt para comparar senhas
        isValidPassword = await bcrypt.compare(password, data.password);
      } catch (bcryptError) {
        console.log('Error using bcrypt, falling back to direct comparison:', bcryptError);
        // Fallback para comparação direta (não seguro, apenas para demonstração)
        isValidPassword = password === data.password;
      }

      if (!isValidPassword) {
        console.log('Invalid password for user:', loginField);
        return res.status(401).json({ message: 'Incorrect username/email or password' });
      }

      // Remover senha do objeto de usuário
      const { password: _, ...userWithoutPassword } = data;

      console.log('Login successful for user:', loginField);
      return res.status(200).json({
        message: 'Login successful',
        user: userWithoutPassword
      });
    } catch (error) {
      console.error('Error processing login:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/auth/me', async (_req, res) => {
    try {
      console.log('Auth check request received');

      // Para simplificar, retornamos um usuário mock
      return res.status(200).json({
        user: {
          id: 1,
          username: 'demo_user',
          email: 'demo@example.com',
          role: 'customer'
        }
      });
    } catch (error) {
      console.error('Error checking authentication:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Products route
  app.get('/api/products', async (req, res) => {
    try {
      console.log('Products request received');

      // Extrair parâmetros de consulta
      const { category, featured } = req.query;

      // Filtrar produtos mock de acordo com os parâmetros
      let filteredProducts = [...mockProducts];

      if (category) {
        filteredProducts = filteredProducts.filter(
          product => product.category.slug === category
        );
      }

      if (featured === 'true') {
        filteredProducts = filteredProducts.filter(
          product => product.featured === true
        );
      }

      return res.status(200).json(filteredProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Categories route
  app.get('/api/categories', async (_req, res) => {
    try {
      console.log('Categories request received');
      return res.status(200).json(mockCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Cart route
  app.get('/api/cart', async (_req, res) => {
    try {
      console.log('Cart request received');
      return res.status(200).json([]);
    } catch (error) {
      console.error('Error fetching cart:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
}

// Inicializar o servidor
async function initServer() {
  try {
    // Registrar rotas da API
    await registerServerRoutes();

    // Rota de teste para verificar se a API está funcionando
    app.get('/api/hello', (_req, res) => {
      res.json({ message: 'API está funcionando!', timestamp: new Date().toISOString() });
    });

    // Rota de fallback para endpoints não encontrados
    app.all('*', (req, res) => {
      console.log(`Requisição não tratada para ${req.method} ${req.path}`);
      res.status(404).json({
        message: 'API endpoint not found',
        path: req.path,
        method: req.method
      });
    });

    console.log('API inicializada com sucesso');
  } catch (error) {
    console.error('Erro ao inicializar a API:', error);
  }
}

// Inicializar o servidor
initServer();

// Export the Express API
export default app;
