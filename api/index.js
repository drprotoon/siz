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
import { initStorageService } from '../server/storage-service.js';
import os from 'os';

// Inicializa o serviço de armazenamento quando o servidor inicia
initStorageService();

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

// Configuração do multer para upload de arquivos (não usado neste arquivo, mas mantido para referência)
multer({
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
app.use(session({
  secret: process.env.SESSION_SECRET || "beauty-essence-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    // Only use secure cookies in production with HTTPS
    secure: process.env.NODE_ENV === "production" && process.env.DISABLE_SECURE_COOKIE !== "true",
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax'
  },
  store: new MemoryStoreSession({
    checkPeriod: 86400000 // prune expired entries every 24h
  })
}));

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

// Authentication middleware (definidos mas não usados neste arquivo - mantidos para referência)
// Estes middlewares são usados no arquivo server/routes.ts original
/*
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
*/

// Rotas da API
app.get('/api/hello', (_req, res) => {
  res.json({
    message: 'API está funcionando!',
    timestamp: new Date().toISOString()
  });
});

// Authentication routes
app.post("/api/auth/login", (req, res, next) => {
  passport.authenticate("local", async (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({ message: info.message });
    }

    // Salvar o sessionId atual antes do login
    const sessionId = req.session.id;

    req.logIn(user, async (err) => {
      if (err) {
        return next(err);
      }

      try {
        // Se havia um sessionId válido, mesclar o carrinho da sessão com o carrinho do usuário
        if (sessionId) {
          // Obter itens do carrinho da sessão
          const sessionCartItems = await storage.getUserCart(undefined, sessionId);

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

        return res.json({ message: "Login successful", user: { id: user.id, username: user.username, role: user.role } });
      } catch (error) {
        console.error("Erro ao mesclar carrinhos:", error);
        // Mesmo com erro na mesclagem, retornar sucesso no login
        return res.json({ message: "Login successful", user: { id: user.id, username: user.username, role: user.role } });
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
  if (req.isAuthenticated()) {
    res.json({ user: req.user });
  } else {
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

// Export the Express API
export default app;
