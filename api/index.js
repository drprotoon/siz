// API handler for Vercel - Adaptado de server/routes.ts
import express from 'express';
import cors from 'cors';
import { storage } from '../server/storage.js';
import bcrypt from 'bcrypt';
import session from 'express-session';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import MemoryStore from 'memorystore';
import { ensureImagesArray } from '../server/utils.js';
import multer from 'multer';
import axios from 'axios';
import {
  initStorageService,
  uploadFile,
  listBucketImages,
  listBucketFolders,
  createNestedFoldersInBucket
} from '../server/storage-service.js';
import os from 'os';

// Inicializa o serviço de armazenamento quando o servidor inicia
console.log('Inicializando serviço de armazenamento...');
initStorageService();
console.log('Serviço de armazenamento inicializado com sucesso!');

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

// Configuração do multer para upload de arquivos
const upload = multer({
  dest: os.tmpdir(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (_req, file, cb) => {
    // Aceita apenas imagens
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas'));
    }
  }
});

// Session setup
const MemoryStoreSession = MemoryStore(session);

// Configuração de sessão
const sessionConfig = {
  secret: process.env.SESSION_SECRET || "beauty-essence-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    // Only use secure cookies in production with HTTPS, unless explicitly disabled
    secure: process.env.NODE_ENV === "production" && process.env.DISABLE_SECURE_COOKIE !== "true",
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax'
  },
  store: new MemoryStoreSession({
    checkPeriod: 86400000 // prune expired entries every 24h
  })
};

// Log da configuração de sessão
console.log(`Session configuration: secure=${sessionConfig.cookie.secure}, sameSite=${sessionConfig.cookie.sameSite}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV}, DISABLE_SECURE_COOKIE: ${process.env.DISABLE_SECURE_COOKIE}`);

app.use(session(sessionConfig));

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    const user = await storage.getUserByUsername(username);
    if (!user) {
      return done(null, false, { message: "Incorrect username or password" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return done(null, false, { message: "Incorrect username or password" });
    }

    return done(null, { id: user.id, username: user.username, role: user.role });
  } catch (error) {
    return done(error);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await storage.getUser(id);
    if (!user) {
      return done(null, false);
    }
    done(null, { id: user.id, username: user.username, role: user.role });
  } catch (error) {
    done(error);
  }
});

// Authentication middleware
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

const isAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === "admin") {
    return next();
  }
  console.log("Access denied: User is not authenticated as admin");
  res.status(403).json({ message: "Forbidden" });
};

const isAdminOrDev = (req, res, next) => {
  // Em ambiente de desenvolvimento, permite acesso sem autenticação
  if (process.env.NODE_ENV === 'development') {
    console.log("Development mode: Allowing access to storage routes without authentication");
    return next();
  }

  // Em produção, exige autenticação como admin
  if (req.isAuthenticated() && req.user.role === "admin") {
    return next();
  }

  console.log("Access denied: User is not authenticated as admin");
  res.status(403).json({ message: "Forbidden" });
};

// Rotas da API
app.get('/api/hello', (_req, res) => {
  res.json({
    message: 'API está funcionando!',
    timestamp: new Date().toISOString()
  });
});

// Authentication routes
app.post("/api/auth/login", (req, res, next) => {
  console.log("Login attempt:", req.body.username);

  passport.authenticate("local", async (err, user, info) => {
    if (err) {
      console.error("Login error:", err);
      return next(err);
    }
    if (!user) {
      console.log("Login failed for user:", req.body.username);
      return res.status(401).json({ message: info.message });
    }

    // Salvar o sessionId atual antes do login
    const sessionId = req.session.id;
    console.log("Session ID before login:", sessionId);

    req.logIn(user, async (err) => {
      if (err) {
        console.error("Login session error:", err);
        return next(err);
      }

      try {
        console.log("User authenticated successfully:", user.username);

        // Se havia um sessionId válido, mesclar o carrinho da sessão com o carrinho do usuário
        if (sessionId) {
          // Obter itens do carrinho da sessão
          const sessionCartItems = await storage.getUserCart(undefined, sessionId);
          console.log(`Found ${sessionCartItems.length} items in session cart`);

          // Se houver itens no carrinho da sessão, adicioná-los ao carrinho do usuário
          if (sessionCartItems.length > 0) {
            console.log(`Mesclando ${sessionCartItems.length} itens do carrinho da sessão para o usuário ${user.id}`);

            for (const item of sessionCartItems) {
              // Adicionar cada item ao carrinho do usuário
              await storage.addToCart({
                userId: user.id,
                productId: item.productId,
                quantity: item.quantity
              });
            }

            // Limpar o carrinho da sessão após a mesclagem
            await storage.clearCart(undefined, sessionId);
            console.log(`Carrinho da sessão ${sessionId} limpo após mesclagem`);
          }
        }

        // Incluir informações adicionais do usuário na resposta
        const userResponse = {
          id: user.id,
          username: user.username,
          role: user.role,
          // Adicionar timestamp para evitar problemas de cache
          timestamp: new Date().getTime()
        };

        console.log("Sending login response:", { message: "Login successful", user: userResponse });
        return res.json({ message: "Login successful", user: userResponse });
      } catch (error) {
        console.error("Erro ao mesclar carrinhos:", error);
        // Mesmo com erro na mesclagem, retornar sucesso no login
        return res.json({
          message: "Login successful",
          user: {
            id: user.id,
            username: user.username,
            role: user.role,
            timestamp: new Date().getTime()
          }
        });
      }
    });
  })(req, res, next);
});

app.post("/api/auth/logout", (req, res) => {
  req.logout(() => {
    res.json({ message: "Logout successful" });
  });
});

app.get("/api/auth/me", (req, res) => {
  console.log("Auth check request received");
  console.log("Is authenticated:", req.isAuthenticated());

  if (req.isAuthenticated() && req.user) {
    // Adicionar timestamp para evitar problemas de cache
    const userResponse = {
      ...req.user,
      timestamp: new Date().getTime()
    };

    console.log("Sending authenticated user:", userResponse);
    res.json({ user: userResponse });
  } else {
    console.log("User not authenticated");
    res.status(401).json({ message: "Not authenticated" });
  }
});

app.post("/api/auth/register", async (req, res) => {
  try {
    // Check if user already exists
    const existingUser = await storage.getUserByUsername(req.body.username);
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const existingEmail = await storage.getUserByEmail(req.body.email);
    if (existingEmail) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    // Create user with hashed password
    const newUser = await storage.createUser({
      ...req.body,
      password: hashedPassword,
      role: "customer" // Always register as customer
    });

    // Remove password from response
    const { password, ...userWithoutPassword } = newUser;

    res.status(201).json({
      message: "User registered successfully",
      user: userWithoutPassword
    });
  } catch (error) {
    res.status(500).json({ message: "Error registering user" });
  }
});

// Category routes
app.get("/api/categories", async (_req, res) => {
  try {
    const categories = await storage.getCategories();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Error fetching categories" });
  }
});

app.get("/api/categories/:slug", async (req, res) => {
  try {
    const category = await storage.getCategoryBySlug(req.params.slug);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: "Error fetching category" });
  }
});

// Product routes
app.get("/api/products", async (req, res) => {
  try {
    console.log("Fetching products...");
    const options = {};

    if (req.query.category) {
      console.log("Filtering by category:", req.query.category);
      const category = await storage.getCategoryBySlug(req.query.category);
      if (category) {
        options.categoryId = category.id;
      }
    }

    if (req.query.featured) {
      console.log("Filtering by featured:", req.query.featured);
      options.featured = req.query.featured === "true";
    }

    // Only admins can see hidden products
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      options.visible = true;
    }

    // Get products with category information
    const products = await storage.getProductsWithCategory(options);
    console.log(`Found ${products.length} products`);

    // Ensure images is an array for each product
    const productsWithArrayImages = products.map(product => ({
      ...product,
      images: ensureImagesArray(product.images)
    }));

    res.json(productsWithArrayImages);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Error fetching products" });
  }
});

// Get product by slug
app.get("/api/products/:slug", async (req, res) => {
  try {
    // Check if the parameter is a number (ID) or a string (slug)
    const isId = !isNaN(parseInt(req.params.slug));

    let product;
    if (isId) {
      // If it's an ID, get the product by ID
      const productId = parseInt(req.params.slug);
      product = await storage.getProductWithCategory(productId);
    } else {
      // If it's a slug, get the product by slug
      product = await storage.getProductWithCategoryBySlug(req.params.slug);
    }

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if product is visible for non-admins
    if (!product.visible && (!req.isAuthenticated() || req.user.role !== "admin")) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Ensure images is an array
    const productWithArrayImages = {
      ...product,
      images: ensureImagesArray(product.images)
    };

    res.json(productWithArrayImages);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ message: "Error fetching product" });
  }
});

// Cart routes
app.get("/api/cart", async (req, res) => {
  try {
    if (req.isAuthenticated()) {
      // Authenticated user - use userId
      const cartItems = await storage.getUserCartWithProducts(req.user.id);
      return res.json(cartItems);
    } else if (req.session.id) {
      // Non-authenticated user - use sessionId
      const cartItems = await storage.getUserCartWithProducts(undefined, req.session.id);
      return res.json(cartItems);
    } else {
      // No session or authentication
      return res.json([]);
    }
  } catch (error) {
    res.status(500).json({ message: "Error fetching cart" });
  }
});

app.post("/api/cart", async (req, res) => {
  try {
    let cartItemData;

    if (req.isAuthenticated()) {
      // Authenticated user
      cartItemData = {
        ...req.body,
        userId: req.user.id
      };
    } else if (req.session.id) {
      // Non-authenticated user with session
      cartItemData = {
        ...req.body,
        sessionId: req.session.id
      };
    } else {
      return res.status(400).json({ message: "Session not available" });
    }

    // Check if product exists and is in stock
    const product = await storage.getProduct(cartItemData.productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.quantity < cartItemData.quantity) {
      return res.status(400).json({ message: "Not enough stock available" });
    }

    const cartItem = await storage.addToCart(cartItemData);
    res.status(201).json(cartItem);
  } catch (error) {
    res.status(500).json({ message: "Error adding to cart" });
  }
});

app.delete("/api/cart/:id", async (req, res) => {
  try {
    const cartItemId = parseInt(req.params.id);

    // Get the cart item to verify ownership
    const cartItems = req.isAuthenticated()
      ? await storage.getUserCart(req.user.id)
      : await storage.getUserCart(undefined, req.session.id);

    const cartItem = cartItems.find(item => item.id === cartItemId);

    if (!cartItem) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    const success = await storage.removeFromCart(cartItemId);

    if (!success) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    res.json({ message: "Item removed from cart" });
  } catch (error) {
    res.status(500).json({ message: "Error removing from cart" });
  }
});

// Freight calculation
app.post("/api/freight/calculate", async (req, res) => {
  try {
    const { postalCode, weight, orderTotal } = req.body;
    console.log("Recebida requisição de cálculo de frete:", { postalCode, weight, orderTotal });

    if (!postalCode || typeof postalCode !== "string") {
      console.log("CEP inválido:", postalCode);
      return res.status(400).json({ message: "Invalid postal code" });
    }

    if (!weight || typeof weight !== "number" || weight <= 0) {
      console.log("Peso inválido:", weight);
      return res.status(400).json({ message: "Invalid weight" });
    }

    // Calculate shipping options
    console.log("Calculando opções de frete para CEP:", postalCode, "e peso:", weight);
    const freightResponse = await storage.calculateFreight(postalCode, weight);
    console.log("Resposta do cálculo de frete:", freightResponse);

    res.json(freightResponse);
  } catch (error) {
    console.error("Erro ao calcular frete:", error);
    res.status(500).json({
      message: "Error calculating freight",
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Busca de endereço por CEP
app.get("/api/address/:cep", async (req, res) => {
  try {
    const { cep } = req.params;
    console.log("Recebida requisição de busca de CEP:", cep);

    if (!cep || typeof cep !== "string") {
      console.log("CEP inválido:", cep);
      return res.status(400).json({
        Success: false,
        Msg: "CEP inválido"
      });
    }

    const formattedCEP = cep.replace(/\D/g, '');

    if (formattedCEP.length !== 8) {
      console.log("CEP com formato inválido:", cep);
      return res.status(400).json({
        Success: false,
        Msg: "CEP inválido. O formato correto é 00000-000.",
        CEP: cep
      });
    }

    console.log("Buscando CEP na API da Frenet:", formattedCEP);

    // Fazer a requisição para a API da Frenet
    const response = await axios.get(`https://api.frenet.com.br/CEP/Address/${formattedCEP}`, {
      headers: {
        'Accept': 'application/json',
        'token': "13B9E436RD32DR455ERAC99R93357F8D6640"
      }
    });

    console.log("Resposta da API da Frenet:", response.data);

    // Verificar se a resposta contém os dados esperados
    if (!response.data) {
      console.log("Resposta vazia da API da Frenet");
      return res.status(404).json({
        Success: false,
        Msg: "CEP não encontrado",
        CEP: formattedCEP,
        UF: '',
        City: '',
        District: '',
        Street: ''
      });
    }

    res.json(response.data);
  } catch (error) {
    console.error("Erro na busca de CEP:", error);
    res.status(500).json({
      Success: false,
      Msg: "Erro na busca de CEP",
      error: error instanceof Error ? error.message : String(error),
      CEP: req.params.cep
    });
  }
});

// Wishlist routes
// Importante: a rota específica com parâmetros deve vir antes da rota genérica
app.get("/api/wishlist/check/:productId", isAuthenticated, async (req, res) => {
  try {
    const productId = parseInt(req.params.productId);
    const isInWishlist = await storage.isProductInWishlist(req.user.id, productId);
    res.json({ isInWishlist });
  } catch (error) {
    res.status(500).json({ message: "Erro ao verificar produto na lista de desejos" });
  }
});

app.get("/api/wishlist", isAuthenticated, async (req, res) => {
  try {
    const wishlistItems = await storage.getUserWishlistWithProducts(req.user.id);
    res.json(wishlistItems);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar lista de desejos" });
  }
});

app.post("/api/wishlist", isAuthenticated, async (req, res) => {
  try {
    const wishlistItemData = {
      ...req.body,
      userId: req.user.id
    };

    // Check if product exists
    const product = await storage.getProduct(wishlistItemData.productId);
    if (!product) {
      return res.status(404).json({ message: "Produto não encontrado" });
    }

    const wishlistItem = await storage.addToWishlist(wishlistItemData);
    res.status(201).json(wishlistItem);
  } catch (error) {
    res.status(500).json({ message: "Erro ao adicionar à lista de desejos" });
  }
});

app.delete("/api/wishlist/:id", isAuthenticated, async (req, res) => {
  try {
    const wishlistItemId = parseInt(req.params.id);

    // Get the wishlist item to verify ownership
    const wishlistItems = await storage.getUserWishlist(req.user.id);
    const wishlistItem = wishlistItems.find(item => item.id === wishlistItemId);

    if (!wishlistItem) {
      return res.status(404).json({ message: "Item não encontrado na lista de desejos" });
    }

    const success = await storage.removeFromWishlist(wishlistItemId);

    if (!success) {
      return res.status(404).json({ message: "Item não encontrado na lista de desejos" });
    }

    res.json({ message: "Item removido da lista de desejos" });
  } catch (error) {
    res.status(500).json({ message: "Erro ao remover da lista de desejos" });
  }
});

// Order routes
app.get("/api/orders", isAuthenticated, async (req, res) => {
  try {
    let orders;

    if (req.user.role === "admin") {
      orders = await storage.getOrdersWithItems();
    } else {
      orders = await storage.getUserOrdersWithItems(req.user.id);
    }

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error fetching orders" });
  }
});

app.get("/api/orders/:id", isAuthenticated, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const order = await storage.getOrderWithItems(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if user is admin or the order belongs to the user
    if (req.user.role !== "admin" && order.userId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Error fetching order" });
  }
});

// Admin dashboard stats
app.get("/api/admin/stats", isAdmin, async (_req, res) => {
  try {
    const stats = await storage.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: "Error fetching stats" });
  }
});

// Endpoint para upload de imagens
app.post('/api/upload', isAdminOrDev, upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ message: 'Nenhum arquivo enviado' });
    }

    // Obtém a categoria do produto
    let categorySlug = 'outros';
    if (req.body.categoryId) {
      const categoryId = parseInt(req.body.categoryId);
      const category = await storage.getCategory(categoryId);
      if (category) {
        categorySlug = category.slug;
      }
    }

    // Processa cada arquivo
    const uploadResults = [];
    for (const file of req.files) {
      try {
        // Determina o caminho no bucket
        const bucketPath = `products/${categorySlug}/${file.originalname}`;

        // Faz o upload do arquivo
        const result = await uploadFile(file.path, bucketPath);

        // Adiciona o resultado ao array
        uploadResults.push({
          originalName: file.originalname,
          bucketPath,
          publicUrl: result.publicUrl,
          success: true
        });
      } catch (uploadError) {
        console.error(`Erro ao fazer upload do arquivo ${file.originalname}:`, uploadError);
        uploadResults.push({
          originalName: file.originalname,
          success: false,
          error: uploadError.message
        });
      }
    }

    res.json({
      message: `${uploadResults.filter(r => r.success).length} de ${req.files.length} arquivos enviados com sucesso`,
      files: uploadResults
    });
  } catch (error) {
    console.error('Erro no upload de imagens:', error);
    res.status(500).json({
      message: 'Erro no upload de imagens',
      error: error.message
    });
  }
});

// Endpoint para criar pastas no bucket do Supabase
app.post('/api/storage/folders', isAdminOrDev, async (req, res) => {
  try {
    const { path } = req.body;

    if (!path) {
      return res.status(400).json({
        success: false,
        message: 'Caminho da pasta não especificado'
      });
    }

    console.log(`API: Creating folder structure: ${path}`);

    // Cria a estrutura de pastas
    const success = await createNestedFoldersInBucket(path);

    if (!success) {
      return res.status(500).json({
        success: false,
        message: 'Falha ao criar estrutura de pastas'
      });
    }

    return res.status(201).json({
      success: true,
      message: `Estrutura de pastas '${path}' criada com sucesso`
    });
  } catch (error) {
    console.error('Erro ao criar pasta no bucket:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao criar pasta no bucket',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// Endpoint para listar pastas do bucket do Supabase
app.get('/api/storage/folders', isAdminOrDev, async (req, res) => {
  try {
    const { path, includeFullPath } = req.query;
    console.log(`API: Listing folders from path: ${path || 'root'}, includeFullPath: ${includeFullPath}`);

    // Listar pastas do bucket
    let folders = await listBucketFolders(
      path || '',
      includeFullPath === 'true'
    );
    console.log(`API: Found ${folders.length} folders`);

    return res.json({
      success: true,
      folders
    });
  } catch (error) {
    console.error('Erro ao listar pastas do bucket:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao listar pastas do bucket',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// Endpoint para listar imagens do bucket do Supabase
app.get('/api/storage/images', isAdminOrDev, async (req, res) => {
  try {
    const { path } = req.query;
    console.log(`API: Listing images from path: ${path || 'root'}`);

    // Listar imagens do bucket
    const images = await listBucketImages(path || '');
    console.log(`API: Found ${images.length} images`);

    return res.json({
      success: true,
      images
    });
  } catch (error) {
    console.error('Erro ao listar imagens do bucket:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao listar imagens do bucket',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// Rota de teste
app.get('/api/test', (req, res) => {
  res.json({
    message: 'API test endpoint is working!',
    timestamp: new Date().toISOString(),
    path: req.url,
    method: req.method,
    vercel: process.env.VERCEL === '1' ? 'true' : 'false',
    nodeEnv: process.env.NODE_ENV || 'development'
  });
});

// Middleware para logging de todas as requisições
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
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

// Log para indicar que a API está pronta
console.log('API handler for Vercel initialized with real database connection');
console.log('Rotas disponíveis:');
console.log('- GET /api/hello');
console.log('- POST /api/auth/login');
console.log('- POST /api/auth/logout');
console.log('- GET /api/auth/me');
console.log('- POST /api/auth/register');
console.log('- GET /api/categories');
console.log('- GET /api/categories/:slug');
console.log('- GET /api/products');
console.log('- GET /api/products/:slug');
console.log('- GET /api/cart');
console.log('- POST /api/cart');
console.log('- DELETE /api/cart/:id');
console.log('- GET /api/wishlist/check/:productId');
console.log('- GET /api/wishlist');
console.log('- POST /api/wishlist');
console.log('- DELETE /api/wishlist/:id');
console.log('- GET /api/orders');
console.log('- GET /api/orders/:id');
console.log('- GET /api/admin/stats');
console.log('- POST /api/upload');
console.log('- POST /api/storage/folders');
console.log('- GET /api/storage/folders');
console.log('- GET /api/storage/images');
console.log('- GET /api/test');

// Export the Express API
export default app;
