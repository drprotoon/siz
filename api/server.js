// Servidor Express para o Vercel
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import cors from 'cors';
import MemoryStore from 'memorystore';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

// Configuração para ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const isSupabaseConfigured = supabaseUrl && supabaseKey;

// Cliente do Supabase
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// Log de inicialização
console.log(`[VERCEL] Supabase client initialized: ${supabase ? 'Yes' : 'No'}`);
if (supabase) {
  console.log(`[VERCEL] Using Supabase URL: ${supabaseUrl.substring(0, 15)}...`);
}

// Importar storage
import { storage } from '../server/storage.js';

// Create Express app
const app = express();

// Enable CORS
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With', 'Accept', 'Accept-Version', 'Content-Length', 'Content-MD5', 'Date', 'X-Api-Version']
}));

// Middleware para parsing JSON e URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
console.log(`[VERCEL] Session configuration: secure=${sessionConfig.cookie.secure}, sameSite=${sessionConfig.cookie.sameSite}`);

app.use(session(sessionConfig));

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    console.log(`[VERCEL] Attempting to authenticate user: ${username}`);
    const user = await storage.getUserByUsername(username);
    
    if (!user) {
      console.log(`[VERCEL] User not found: ${username}`);
      return done(null, false, { message: "Incorrect username or password" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log(`[VERCEL] Invalid password for user: ${username}`);
      return done(null, false, { message: "Incorrect username or password" });
    }

    console.log(`[VERCEL] User authenticated successfully: ${username}`);
    return done(null, { id: user.id, username: user.username, role: user.role });
  } catch (error) {
    console.error(`[VERCEL] Authentication error for ${username}:`, error);
    return done(error);
  }
}));

passport.serializeUser((user, done) => {
  console.log(`[VERCEL] Serializing user: ${user.username}`);
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    console.log(`[VERCEL] Deserializing user ID: ${id}`);
    const user = await storage.getUser(id);
    
    if (!user) {
      console.log(`[VERCEL] User not found for ID: ${id}`);
      return done(null, false);
    }
    
    console.log(`[VERCEL] User deserialized successfully: ${user.username}`);
    done(null, { id: user.id, username: user.username, role: user.role });
  } catch (error) {
    console.error(`[VERCEL] Deserialization error for ID ${id}:`, error);
    done(error);
  }
});

// Middleware para verificar autenticação
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Not authenticated" });
};

// Middleware para verificar se é admin
const isAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user?.role === "admin") {
    return next();
  }
  res.status(403).json({ message: "Forbidden" });
};

// Rotas de autenticação
app.post("/api/auth/login", (req, res, next) => {
  console.log("[VERCEL] Login attempt:", req.body.username);
  
  passport.authenticate("local", async (err, user, info) => {
    if (err) {
      console.error("[VERCEL] Login error:", err);
      return next(err);
    }
    if (!user) {
      console.log("[VERCEL] Login failed for user:", req.body.username);
      return res.status(401).json({ message: info.message });
    }

    // Salvar o sessionId atual antes do login
    const sessionId = req.session.id;
    console.log("[VERCEL] Session ID before login:", sessionId);

    req.logIn(user, async (err) => {
      if (err) {
        console.error("[VERCEL] Login session error:", err);
        return next(err);
      }

      try {
        console.log("[VERCEL] User authenticated successfully:", user.username);
        
        // Incluir informações adicionais do usuário na resposta
        const userResponse = { 
          id: user.id, 
          username: user.username, 
          role: user.role,
          // Adicionar timestamp para evitar problemas de cache
          timestamp: new Date().getTime()
        };
        
        console.log("[VERCEL] Sending login response:", { message: "Login successful", user: userResponse });
        return res.json({ message: "Login successful", user: userResponse });
      } catch (error) {
        console.error("[VERCEL] Error during login:", error);
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

// Rota de logout
app.post("/api/auth/logout", (req, res) => {
  console.log("[VERCEL] Logout request received");
  req.logout(() => {
    console.log("[VERCEL] User logged out successfully");
    res.json({ message: "Logout successful" });
  });
});

// Rota para verificar autenticação
app.get("/api/auth/me", (req, res) => {
  console.log("[VERCEL] Auth check request received");
  console.log("[VERCEL] Is authenticated:", req.isAuthenticated());
  
  if (req.isAuthenticated() && req.user) {
    // Adicionar timestamp para evitar problemas de cache
    const userResponse = {
      ...req.user,
      timestamp: new Date().getTime()
    };
    
    console.log("[VERCEL] Sending authenticated user:", userResponse);
    res.json({ user: userResponse });
  } else {
    console.log("[VERCEL] User not authenticated");
    res.status(401).json({ message: "Not authenticated" });
  }
});

// Rota para registro de usuário
app.post("/api/auth/register", async (req, res) => {
  try {
    const userData = req.body;
    console.log("[VERCEL] Register attempt:", userData.username);

    // Check if user already exists
    const existingUser = await storage.getUserByUsername(userData.username);
    if (existingUser) {
      console.log("[VERCEL] Username already exists:", userData.username);
      return res.status(400).json({ message: "Username already exists" });
    }

    const existingEmail = await storage.getUserByEmail(userData.email);
    if (existingEmail) {
      console.log("[VERCEL] Email already exists:", userData.email);
      return res.status(400).json({ message: "Email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Create user with hashed password
    const newUser = await storage.createUser({
      ...userData,
      password: hashedPassword,
      role: "customer" // Always register as customer
    });

    console.log("[VERCEL] User registered successfully:", newUser.username);

    // Remove password from response
    const { password, ...userWithoutPassword } = newUser;

    res.status(201).json({
      message: "User registered successfully",
      user: userWithoutPassword
    });
  } catch (error) {
    console.error("[VERCEL] Error registering user:", error);
    res.status(500).json({ message: "Error registering user" });
  }
});

// Rota para produtos
app.get("/api/products", async (req, res) => {
  try {
    console.log("[VERCEL] Fetching products...");
    const options = {};

    if (req.query.category) {
      console.log("[VERCEL] Filtering by category:", req.query.category);
      const category = await storage.getCategoryBySlug(req.query.category);
      if (category) {
        options.categoryId = category.id;
      }
    }

    if (req.query.featured) {
      console.log("[VERCEL] Filtering by featured:", req.query.featured);
      options.featured = req.query.featured === "true";
    }

    // Only show visible products
    options.visible = true;

    // Get products with category information
    const products = await storage.getProductsWithCategory(options);
    console.log(`[VERCEL] Found ${products.length} products`);

    res.json(products);
  } catch (error) {
    console.error("[VERCEL] Error fetching products:", error);
    res.status(500).json({ message: "Error fetching products" });
  }
});

// Rota para categorias
app.get("/api/categories", async (req, res) => {
  try {
    console.log("[VERCEL] Fetching categories...");
    const categories = await storage.getCategories();
    console.log(`[VERCEL] Found ${categories.length} categories`);
    res.json(categories);
  } catch (error) {
    console.error("[VERCEL] Error fetching categories:", error);
    res.status(500).json({ message: "Error fetching categories" });
  }
});

// Rota para health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "API is running",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    supabase: supabase ? "connected" : "not connected"
  });
});

// Export the Express API
export default app;
