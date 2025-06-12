import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import {
  insertUserSchema,
  insertProductSchema,
  insertCategorySchema,
  insertOrderSchema,
  insertOrderItemSchema,
  insertReviewSchema,
  insertCartItemSchema,
  insertWishlistItemSchema
} from "@shared/schema";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import MemoryStore from "memorystore";
import { ensureImagesArray, prepareImagesForStorage } from "./utils";
import multer from 'multer';
import axios from 'axios';
import rateLimit from 'express-rate-limit';
// Import validation and auth middlewares
import {
  validateRequest,
  validateQuery,
  validationSchemas,
  rateLimitConfig
} from './middleware/validation-simple';
import {
  requireAuth,
  requireAdmin,
  requireRole,
  optionalAuth,
  securityHeaders,
  generateToken
} from './middleware/auth';
import {
  initStorageService,
  uploadFile,
  listBucketImages,
  listBucketFolders,
  createFolderInBucket,
  createNestedFoldersInBucket
} from './storage-service';
import { checkSupabaseConnection } from './supabase';
import { productionConfig, logProductionConfig } from './config/production';
import path from 'path';
import fs from 'fs';
import os from 'os';

// Inicializa o serviço de armazenamento quando o servidor inicia
initStorageService();

// Configuração do multer para upload de arquivos
const upload = multer({
  dest: os.tmpdir(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    // Aceita apenas imagens
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas'));
    }
  }
});

interface User {
  id: number;
  username: string;
  password: string;
  role: string;
}

declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      role: string;
    }
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Log production configuration if in production
  if (process.env.NODE_ENV === 'production') {
    logProductionConfig();
  }

  // Apply security headers to all routes
  app.use(securityHeaders);

  // Rate limiting - use production config in production
  const isProduction = process.env.NODE_ENV === 'production';
  const generalLimiter = rateLimit(isProduction ? productionConfig.rateLimit.general : rateLimitConfig.general);
  const authLimiter = rateLimit(isProduction ? productionConfig.rateLimit.auth : rateLimitConfig.auth);
  const freightLimiter = rateLimit(rateLimitConfig.freight);

  // Apply general rate limiting to all API routes
  app.use('/api', generalLimiter);

  // Session setup
  const MemoryStoreSession = MemoryStore(session);

  // Configuração de sessão - usar configuração de produção quando apropriado
  const sessionConfig = isProduction ? {
    ...productionConfig.session,
    store: new MemoryStoreSession({
      checkPeriod: 86400000 // prune expired entries every 24h
    })
  } : {
    secret: process.env.SESSION_SECRET || "beauty-essence-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      // Only use secure cookies in production with HTTPS, unless explicitly disabled
      secure: process.env.NODE_ENV === "production" && process.env.DISABLE_SECURE_COOKIE !== "true",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: process.env.NODE_ENV === "production" ? 'none' as const : 'lax' as const
    },
    store: new MemoryStoreSession({
      checkPeriod: 86400000 // prune expired entries every 24h
    })
  };

  // Log da configuração de sessão
  console.log(`Session configuration: secure=${sessionConfig.cookie.secure}, sameSite=${sessionConfig.cookie.sameSite}`);

  app.use(session(sessionConfig));

  // Passport configuration
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      // Tentar buscar por username primeiro
      let user = await storage.getUserByUsername(username);

      // Se não encontrou por username, tentar por email
      if (!user) {
        user = await storage.getUserByEmail(username);
      }

      if (!user) {
        return done(null, false, { message: "Incorrect username/email or password" });
      }

      console.log(`[DEBUG] Verificando senha para usuário: ${user.username}`);
      console.log(`[DEBUG] Senha fornecida: "${password}"`);
      console.log(`[DEBUG] Hash armazenado: "${user.password?.substring(0, 20)}..."`);

      // Verificar se é usuário gerenciado pelo Supabase Auth
      if (user.password === '**MANAGED_BY_SUPABASE**') {
        console.log(`[DEBUG] Usuário ${user.username} é gerenciado pelo Supabase Auth`);

        // Importar supabase dinamicamente para evitar problemas de circular dependency
        const { supabase } = await import('./supabase');

        if (!supabase) {
          console.error('[DEBUG] Supabase não configurado');
          return done(null, false, { message: "Authentication service unavailable" });
        }

        try {
          // Tentar autenticar via Supabase Auth
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: password
          });

          if (authError || !authData.user) {
            console.log(`[DEBUG] Falha na autenticação Supabase: ${authError?.message}`);
            return done(null, false, { message: "Incorrect username/email or password" });
          }

          console.log(`[DEBUG] Autenticação Supabase bem-sucedida para: ${user.username}`);
          return done(null, { id: user.id, username: user.username, email: user.email || '', role: user.role });
        } catch (supabaseError) {
          console.error(`[DEBUG] Erro na autenticação Supabase:`, supabaseError);
          return done(null, false, { message: "Authentication error" });
        }
      } else {
        // Usuário com senha bcrypt (sistema legado)
        const isValidPassword = await bcrypt.compare(password, user.password);
        console.log(`[DEBUG] Senha bcrypt válida: ${isValidPassword}`);

        if (!isValidPassword) {
          return done(null, false, { message: "Incorrect username/email or password" });
        }

        return done(null, { id: user.id, username: user.username, email: user.email || '', role: user.role });
      }
    } catch (error) {
      console.error('[DEBUG] Erro no passport strategy:', error);
      return done(error);
    }
  }));

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      done(null, { id: user.id, username: user.username, email: user.email || '', role: user.role });
    } catch (error) {
      done(error);
    }
  });

  // Authentication middleware
  // JWT middleware for user authentication
  const isAuthenticatedJWT = async (req: Request, res: Response, next: Function) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log("JWT Auth check: No token provided");
        return res.status(401).json({
          message: "Usuário não autenticado",
          error: "No token provided"
        });
      }

      const token = authHeader.replace('Bearer ', '');

      if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET not configured");
        return res.status(500).json({
          message: "Server configuration error"
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;

      // Add user info to request for use in route handlers
      req.user = {
        id: decoded.id,
        username: decoded.username,
        email: decoded.email || '',
        role: decoded.role
      };

      console.log("JWT Auth successful for user:", decoded.username);
      next();
    } catch (error) {
      console.error("JWT Auth error:", error);
      res.status(401).json({
        message: "Usuário não autenticado",
        error: "Invalid token"
      });
    }
  };

  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    console.log("Auth check - Details:", {
      isAuthenticated: req.isAuthenticated(),
      user: req.user,
      hasAuthHeader: !!req.headers.authorization,
      environment: process.env.NODE_ENV
    });

    // Try JWT authentication first if Authorization header is present
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      console.log("Using JWT authentication");
      return isAuthenticatedJWT(req, res, next);
    }

    // Fallback to session-based authentication
    if (req.isAuthenticated()) {
      console.log("Session-based auth successful for user:", req.user?.username);
      return next();
    }

    console.log("Authentication failed - no valid session or JWT token");
    res.status(401).json({ message: "Unauthorized" });
  };

  // JWT middleware for admin authentication
  const isAdminJWT = async (req: Request, res: Response, next: Function) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log("JWT Admin check: No token provided");
        return res.status(401).json({
          error: "Unauthorized. Admin access required.",
          message: "No token provided"
        });
      }

      const token = authHeader.replace('Bearer ', '');

      if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET not configured");
        return res.status(500).json({
          error: "Server configuration error"
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;

      if (decoded.role !== 'admin') {
        console.log("JWT Admin check: User is not admin", {
          username: decoded.username,
          role: decoded.role
        });
        return res.status(403).json({
          error: "Unauthorized. Admin access required.",
          message: "Insufficient permissions"
        });
      }

      // Add user info to request for use in route handlers
      req.user = {
        id: decoded.id,
        username: decoded.username,
        email: decoded.email || '',
        role: decoded.role
      };

      console.log("JWT Admin access granted for user:", decoded.username);
      next();
    } catch (error) {
      console.error("JWT Admin check error:", error);
      res.status(401).json({
        error: "Unauthorized. Admin access required.",
        message: "Invalid token"
      });
    }
  };

  const isAdmin = (req: Request, res: Response, next: Function) => {
    console.log("Admin check - Auth details:", {
      isAuthenticated: req.isAuthenticated(),
      user: req.user,
      userRole: req.user?.role,
      sessionId: req.session?.id,
      cookies: req.headers.cookie,
      environment: process.env.NODE_ENV,
      hasAuthHeader: !!req.headers.authorization
    });

    // Try JWT authentication first if Authorization header is present
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      console.log("Using JWT authentication for admin check");
      return isAdminJWT(req, res, next);
    }

    // Fallback to session-based authentication
    if (req.isAuthenticated() && req.user && req.user.role === "admin") {
      console.log("Session-based admin access granted for user:", req.user.username);
      return next();
    }

    console.log("Access denied: User is not authenticated as admin", {
      isAuthenticated: req.isAuthenticated(),
      userRole: req.user?.role || 'no user',
      hasUser: !!req.user,
      hasAuthHeader: !!req.headers.authorization
    });

    res.status(403).json({
      error: "Unauthorized. Admin access required.",
      details: {
        isAuthenticated: req.isAuthenticated(),
        userRole: req.user?.role || null,
        hasUser: !!req.user,
        hasAuthHeader: !!req.headers.authorization
      }
    });
  };

  // Middleware para rotas de storage - permite acesso mesmo sem autenticação em desenvolvimento
  const isAdminOrDev = (req: Request, res: Response, next: Function) => {
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

  // Authentication routes
  app.post("/api/auth/login", authLimiter, validateRequest(validationSchemas.login), (req, res, next) => {
    console.log("Login attempt:", req.body.username);

    passport.authenticate("local", async (err: Error, user: User, info: { message: string }) => {
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

      req.logIn({ ...user, email: (user as any).email || '' } as any, async (err) => {
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

  // JWT-based login for serverless environments
  app.post("/api/auth/login-jwt", authLimiter, validateRequest(validationSchemas.login), async (req, res) => {
    try {
      console.log("JWT Login attempt:", req.body.username);

      // Buscar usuário por username ou email
      let user = await storage.getUserByUsername(req.body.username);
      if (!user) {
        // Tentar buscar por email se não encontrou por username
        user = await storage.getUserByEmail(req.body.username);
      }

      if (!user) {
        console.log("User not found:", req.body.username);
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      // Verificar se a senha está correta
      const isValidPassword = await bcrypt.compare(req.body.password, user.password);
      if (!isValidPassword) {
        console.log("Invalid password for user:", req.body.username);
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      // Generate JWT token
      if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET not configured");
        return res.status(500).json({ message: "Erro de configuração do servidor" });
      }

      const token = jwt.sign(
        {
          userId: user.id, // Usar userId para compatibilidade com o middleware
          id: user.id,
          username: user.username,
          email: user.email || '',
          role: user.role
        },
        process.env.JWT_SECRET,
        {
          expiresIn: '7d', // Token válido por 7 dias
          issuer: 'siz-cosmeticos',
          audience: 'siz-users'
        }
      );

      console.log("JWT login successful for user:", user.username, "role:", user.role);

      res.json({
        message: "Login realizado com sucesso",
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email || '',
          name: user.full_name || user.name || user.username,
          role: user.role,
          timestamp: new Date().getTime()
        }
      });
    } catch (error) {
      console.error("JWT login error:", error);
      res.status(500).json({ message: "Login error" });
    }
  });

  // JWT-based admin check
  app.get("/api/auth/admin-check", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          isAdmin: false,
          message: "No token provided"
        });
      }

      const token = authHeader.replace('Bearer ', '');

      if (!process.env.JWT_SECRET) {
        return res.status(500).json({
          isAdmin: false,
          message: "Server configuration error"
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
      const isAdmin = decoded.role === 'admin';

      console.log("JWT admin check:", {
        username: decoded.username,
        role: decoded.role,
        isAdmin
      });

      res.json({
        isAdmin,
        user: {
          id: decoded.id,
          username: decoded.username,
          role: decoded.role
        }
      });
    } catch (error) {
      console.error("JWT admin check error:", error);
      res.status(401).json({
        isAdmin: false,
        message: "Invalid token"
      });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    console.log("Auth check request received");

    try {
      // Verificar se há token JWT no header Authorization
      const authHeader = req.headers.authorization;
      let token = null;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }

      // Se não há token no header, verificar cookies
      if (!token && req.headers.cookie) {
        const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split('=');
          acc[key] = value;
          return acc;
        }, {} as Record<string, string>);

        token = cookies.authToken || cookies.token;
      }

      // Se não há token, verificar autenticação por sessão (fallback)
      if (!token) {
        if (req.isAuthenticated() && req.user) {
          const userResponse = {
            ...req.user,
            timestamp: new Date().getTime()
          };
          console.log("Sending session authenticated user:", userResponse);
          return res.json({ user: userResponse });
        } else {
          console.log("No token and not session authenticated");
          return res.status(401).json({ message: "Não autenticado" });
        }
      }

      // Verificar e decodificar o token JWT
      if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET not configured");
        return res.status(500).json({ message: "Erro de configuração do servidor" });
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;

        if (!decoded.userId) {
          return res.status(401).json({ message: "Token inválido" });
        }

        // Buscar dados atualizados do usuário no banco
        const user = await storage.getUser(decoded.userId);

        if (!user) {
          return res.status(401).json({ message: "Usuário não encontrado" });
        }

        // Retornar dados do usuário no formato esperado pelo frontend
        const userResponse = {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.full_name || user.name || user.username,
          role: user.role,
          timestamp: new Date().getTime()
        };

        console.log("Sending JWT authenticated user:", userResponse);
        return res.status(200).json({ user: userResponse });

      } catch (jwtError) {
        console.error('JWT verification error:', jwtError);
        return res.status(401).json({ message: "Token inválido" });
      }

    } catch (error) {
      console.error('Error in auth/me endpoint:', error);
      return res.status(500).json({
        message: 'Erro interno do servidor'
      });
    }
  });

  // Auth status endpoint for debugging
  app.get('/api/auth/status', (req, res) => {
    // Return detailed information about the authentication state
    res.json({
      isAuthenticated: req.isAuthenticated(),
      user: req.user || null,
      session: {
        id: req.session?.id || null,
        cookie: {
          ...req.session?.cookie,
          // Convert dates to strings for JSON serialization
          expires: req.session?.cookie?.expires?.toISOString() || null,
        },
      },
      headers: {
        cookie: req.headers.cookie || null,
        origin: req.headers.origin || null,
        host: req.headers.host || null,
        referer: req.headers.referer || null,
      },
      env: {
        NODE_ENV: process.env.NODE_ENV || 'unknown',
        VERCEL: process.env.VERCEL || 'unknown',
      }
    });
  });

  // Debug route to check authentication
  app.get("/api/debug/auth", (req, res) => {
    res.json({
      isAuthenticated: req.isAuthenticated(),
      user: req.user || null,
      sessionId: req.session.id,
      environment: process.env.NODE_ENV
    });
  });

  // Debug route to check database schema
  app.get("/api/debug/schema", async (req, res) => {
    try {
      const { supabase } = await import('./supabase');

      if (!supabase) {
        return res.status(500).json({
          success: false,
          error: 'Supabase not configured'
        });
      }

      const tables = ['users', 'categories', 'products', 'orders', 'addresses', 'payments', 'cart_items', 'wishlist_items', 'reviews', 'order_items'];
      const results: any = {};

      for (const tableName of tables) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);

          results[tableName] = {
            exists: !error,
            error: error?.message || null,
            columns: data && data.length > 0 ? Object.keys(data[0]) : [],
            sampleData: data?.[0] || null,
            count: data?.length || 0
          };
        } catch (tableError) {
          results[tableName] = {
            exists: false,
            error: tableError instanceof Error ? tableError.message : String(tableError),
            columns: [],
            sampleData: null,
            count: 0
          };
        }
      }

      return res.json({
        success: true,
        timestamp: new Date().toISOString(),
        tables: results
      });

    } catch (error) {
      console.error('Debug schema error:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Get all users (admin only)
  app.get("/api/users", isAdmin, async (req, res) => {
    try {
      console.log("Fetching users - Auth check:", {
        isAuthenticated: req.isAuthenticated(),
        user: req.user,
        role: req.user?.role
      });

      const users = await storage.getUsers();
      console.log(`Found ${users.length} users in database`);

      // Remove passwords from response
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Error fetching users" });
    }
  });

  app.post("/api/auth/register", authLimiter, validateRequest(validationSchemas.register), async (req, res) => {
    try {
      const userData = req.body; // Already validated by middleware

      console.log("Registration attempt for:", userData.username, userData.email);

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        console.log("Username already exists:", userData.username);
        return res.status(400).json({ message: "Nome de usuário já existe" });
      }

      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        console.log("Email already exists:", userData.email);
        return res.status(400).json({ message: "Email já está em uso" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Create user with hashed password
      const newUser = await storage.createUser({
        username: userData.username,
        email: userData.email,
        password: hashedPassword,
        full_name: userData.name || userData.username,
        name: userData.name || userData.username,
        role: "customer" // Always register as customer
      });

      console.log("User registered successfully:", newUser.username);

      // Remove password from response
      const { password, ...userWithoutPassword } = newUser;

      res.status(201).json({
        message: "Usuário registrado com sucesso",
        user: userWithoutPassword
      });
    } catch (error) {
      console.error("Registration error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Dados de usuário inválidos", errors: error.errors });
      } else {
        res.status(500).json({ message: "Erro ao registrar usuário" });
      }
    }
  });

  // Category routes
  app.get("/api/categories", async (req, res) => {
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

  app.post("/api/categories", isAdmin, async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const newCategory = await storage.createCategory(categoryData);

      // Create a folder in Supabase storage for this category
      try {
        // Import the createFolderInBucket function
        const { createFolderInBucket } = await import('./storage-service.js');

        // Create the folder using the category slug
        await createFolderInBucket(newCategory.slug);
        console.log(`Created storage folder for category: ${newCategory.slug}`);
      } catch (storageError) {
        // Log the error but don't fail the request
        console.error(`Failed to create storage folder for category: ${newCategory.slug}`, storageError);
      }

      res.status(201).json(newCategory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid category data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error creating category" });
      }
    }
  });

  app.put("/api/categories/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const categoryData = insertCategorySchema.parse(req.body);
      const updatedCategory = await storage.updateCategory(id, categoryData);

      if (!updatedCategory) {
        return res.status(404).json({ message: "Category not found" });
      }

      res.json(updatedCategory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid category data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error updating category" });
      }
    }
  });

  app.delete("/api/categories/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteCategory(id);

      if (!deleted) {
        return res.status(404).json({ message: "Category not found" });
      }

      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting category" });
    }
  });

  // Product routes
  app.get("/api/products", validateQuery(validationSchemas.search), async (req, res) => {
    try {
      console.log("Fetching products...");
      const options: { categoryId?: number, featured?: boolean, visible?: boolean } = {};

      if (req.query.category) {
        console.log("Filtering by category:", req.query.category);
        const category = await storage.getCategoryBySlug(req.query.category as string);
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

  app.post("/api/products", isAdmin, async (req, res) => {
    try {
      // Parse the product data
      const productData = insertProductSchema.parse(req.body);

      // Handle images properly for PostgreSQL
      if (productData.images) {
        productData.images = prepareImagesForStorage(productData.images);
      }

      const newProduct = await storage.createProduct(productData);

      // Ensure images is returned as an array in the response
      const productWithArrayImages = {
        ...newProduct,
        images: ensureImagesArray(newProduct.images)
      };

      res.status(201).json(productWithArrayImages);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid product data", errors: error.errors });
      } else {
        console.error("Error creating product:", error);
        res.status(500).json({ message: "Error creating product" });
      }
    }
  });

  app.put("/api/products/:id", isAdmin, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const productData = insertProductSchema.partial().parse(req.body);

      // Handle images properly for PostgreSQL
      if (productData.images) {
        productData.images = prepareImagesForStorage(productData.images);
      }

      const updatedProduct = await storage.updateProduct(productId, productData);

      if (!updatedProduct) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Ensure images is returned as an array in the response
      const productWithArrayImages = {
        ...updatedProduct,
        images: ensureImagesArray(updatedProduct.images)
      };

      res.json(productWithArrayImages);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid product data", errors: error.errors });
      } else {
        console.error("Error updating product:", error);
        res.status(500).json({ message: "Error updating product" });
      }
    }
  });

  app.delete("/api/products/:id", isAdmin, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const success = await storage.deleteProduct(productId);

      if (!success) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting product" });
    }
  });

  // Review routes
  app.get("/api/products/:id/reviews", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const reviews = await storage.getProductReviews(productId);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Error fetching reviews" });
    }
  });

  app.post("/api/products/:id/reviews", isAuthenticated, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const product = await storage.getProduct(productId);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const reviewData = insertReviewSchema.parse({
        ...req.body,
        productId,
        userId: req.user?.id || 0
      });

      const newReview = await storage.createReview(reviewData);
      res.status(201).json(newReview);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid review data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error creating review" });
      }
    }
  });

  app.delete("/api/reviews/:id", isAuthenticated, async (req, res) => {
    try {
      const reviewId = parseInt(req.params.id);
      const success = await storage.deleteReview(reviewId);

      if (!success) {
        return res.status(404).json({ message: "Review not found" });
      }

      res.json({ message: "Review deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting review" });
    }
  });

  // Cart routes
  app.get("/api/cart", optionalAuth, async (req, res) => {
    try {
      if (req.user?.id) {
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
      console.error("Error fetching cart:", error);
      res.status(500).json({ message: "Erro ao buscar carrinho" });
    }
  });

  app.post("/api/cart", optionalAuth, async (req, res) => {
    try {
      let cartItemData;

      if (req.user?.id) {
        // Authenticated user
        cartItemData = insertCartItemSchema.parse({
          ...req.body,
          userId: req.user.id
        });
      } else if (req.session.id) {
        // Non-authenticated user with session
        cartItemData = insertCartItemSchema.parse({
          ...req.body,
          sessionId: req.session.id
        });
      } else {
        return res.status(400).json({ message: "Sessão não disponível" });
      }

      // Check if product exists and is in stock
      const product = await storage.getProduct(cartItemData.productId);
      if (!product) {
        return res.status(404).json({ message: "Produto não encontrado" });
      }

      if (product.quantity < cartItemData.quantity) {
        return res.status(400).json({ message: "Estoque insuficiente" });
      }

      const cartItem = await storage.addToCart(cartItemData);
      res.status(201).json(cartItem);
    } catch (error) {
      console.error("Error adding to cart:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Dados do carrinho inválidos", errors: error.errors });
      } else {
        res.status(500).json({ message: "Erro ao adicionar ao carrinho" });
      }
    }
  });

  app.put("/api/cart/:id", async (req, res) => {
    try {
      const cartItemId = parseInt(req.params.id);
      const { quantity } = req.body;

      if (typeof quantity !== "number" || quantity < 1) {
        return res.status(400).json({ message: "Invalid quantity" });
      }

      const updatedCartItem = await storage.updateCartItem(cartItemId, quantity);

      if (!updatedCartItem) {
        return res.status(404).json({ message: "Cart item not found" });
      }

      // Verify that the user has permission to update this cart item
      if (req.isAuthenticated() && updatedCartItem.userId && updatedCartItem.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (!req.isAuthenticated() && updatedCartItem.sessionId && updatedCartItem.sessionId !== req.session.id) {
        return res.status(403).json({ message: "Forbidden" });
      }

      res.json(updatedCartItem);
    } catch (error) {
      res.status(500).json({ message: "Error updating cart" });
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

  app.delete("/api/cart", async (req, res) => {
    try {
      if (req.isAuthenticated()) {
        await storage.clearCart(req.user.id);
      } else if (req.session.id) {
        await storage.clearCart(undefined, req.session.id);
      } else {
        return res.status(400).json({ message: "No cart to clear" });
      }

      res.json({ message: "Cart cleared" });
    } catch (error) {
      res.status(500).json({ message: "Error clearing cart" });
    }
  });

  // Optimized wishlist routes
  app.get("/api/wishlist", isAuthenticated, async (req, res) => {
    try {
      const { optimizedWishlistService: wishlistService } = await import('./services/wishlist-service-optimized');
      const wishlistItems = await wishlistService.getUserWishlist(req.user?.id || 0);
      res.json(wishlistItems);
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      res.status(500).json({ message: "Erro ao buscar lista de desejos" });
    }
  });

  app.post("/api/wishlist", isAuthenticated, async (req, res) => {
    try {
      const { productId } = req.body;

      if (!productId || typeof productId !== "number") {
        return res.status(400).json({ message: "ID do produto é obrigatório" });
      }

      const { optimizedWishlistService: wishlistService } = await import('./services/wishlist-service-optimized');

      // Check if already in wishlist
      const isAlreadyInWishlist = await wishlistService.isInWishlist(req.user?.id || 0, productId);
      if (isAlreadyInWishlist) {
        return res.status(400).json({ message: "Produto já está na lista de desejos" });
      }

      // Add to wishlist using optimized service
      await wishlistService.addToWishlist(req.user?.id || 0, productId);

      res.status(201).json({
        message: "Produto adicionado à lista de desejos",
        productId
      });
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      res.status(500).json({ message: "Erro ao adicionar à lista de desejos" });
    }
  });

  app.delete("/api/wishlist/:productId", isAuthenticated, async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);

      if (!productId || isNaN(productId)) {
        return res.status(400).json({ message: "ID do produto inválido" });
      }

      const { optimizedWishlistService: wishlistService } = await import('./services/wishlist-service-optimized');

      // Check if product is in wishlist
      const isInWishlist = await wishlistService.isInWishlist(req.user?.id || 0, productId);
      if (!isInWishlist) {
        return res.status(404).json({ message: "Produto não encontrado na lista de desejos" });
      }

      // Remove from wishlist using optimized service
      await wishlistService.removeFromWishlist(req.user?.id || 0, productId);

      res.json({ message: "Produto removido da lista de desejos" });
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      res.status(500).json({ message: "Erro ao remover da lista de desejos" });
    }
  });

  app.get("/api/wishlist/check/:productId", isAuthenticated, async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);

      if (!productId || isNaN(productId)) {
        return res.status(400).json({ message: "ID do produto inválido" });
      }

      const { optimizedWishlistService: wishlistService } = await import('./services/wishlist-service-optimized');
      const isInWishlist = await wishlistService.isInWishlist(req.user?.id || 0, productId);
      res.json({ isInWishlist });
    } catch (error) {
      console.error("Error checking wishlist:", error);
      res.status(500).json({ message: "Erro ao verificar produto na lista de desejos" });
    }
  });

  // Freight calculation route - removido para evitar duplicação

  // Order routes
  app.get("/api/orders", requireAuth, async (req, res) => {
    try {
      let orders;

      if (req.user?.role === "admin") {
        orders = await storage.getOrdersWithItems();
      } else {
        orders = await storage.getUserOrdersWithItems(req.user?.id || 0);
      }

      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Erro ao buscar pedidos" });
    }
  });

  app.get("/api/orders/:id", requireAuth, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const order = await storage.getOrderWithItems(orderId);

      if (!order) {
        return res.status(404).json({ message: "Pedido não encontrado" });
      }

      // Check if user is admin or the order belongs to the user
      if (req.user?.role !== "admin" && order.userId !== req.user?.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Erro ao buscar pedido" });
    }
  });

  app.post("/api/orders", requireAuth, async (req, res) => {
    try {
      const { order, items } = req.body;

      const orderData = insertOrderSchema.parse({
        ...order,
        userId: req.user?.id || 0
      });

      // Validate items
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Pedido deve ter pelo menos um item" });
      }

      const orderItems = [];

      for (const item of items) {
        const orderItem = insertOrderItemSchema.parse({
          ...item,
          orderId: 0 // Will be replaced with actual order ID
        });

        // Check product availability
        const product = await storage.getProduct(orderItem.productId);
        if (!product) {
          return res.status(404).json({ message: `Produto ID ${orderItem.productId} não encontrado` });
        }

        if (product.quantity < orderItem.quantity) {
          return res.status(400).json({ message: `Estoque insuficiente para o produto ${product.name}` });
        }

        orderItems.push(orderItem);
      }

      // Preparar dados do pedido
      const orderDataWithItems = {
        ...orderData,
        items: orderItems
      };

      // Create the order
      const newOrder = await storage.createOrder(orderDataWithItems);

      // Clear the user's cart
      await storage.clearCart(req.user?.id || 0);

      res.status(201).json(newOrder);
    } catch (error) {
      console.error("Error creating order:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Dados do pedido inválidos", errors: error.errors });
      } else {
        res.status(500).json({ message: "Erro ao criar pedido" });
      }
    }
  });

  app.put("/api/orders/:id/status", isAdmin, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { status } = req.body;

      if (!status || typeof status !== "string") {
        return res.status(400).json({ message: "Invalid status" });
      }

      const updatedOrder = await storage.updateOrderStatus(orderId, status);

      if (!updatedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.json(updatedOrder);
    } catch (error) {
      res.status(500).json({ message: "Error updating order status" });
    }
  });

  // Payment routes
  app.post("/api/payment/create-intent", isAuthenticated, async (req, res) => {
    try {
      const { amount } = req.body;

      if (!amount || typeof amount !== "number" || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      const paymentIntent = await storage.createPaymentIntent(amount);
      res.json(paymentIntent);
    } catch (error) {
      res.status(500).json({ message: "Error creating payment intent" });
    }
  });

  app.post("/api/payment/process", isAuthenticated, async (req, res) => {
    try {
      const { paymentId } = req.body;

      if (!paymentId || typeof paymentId !== "string") {
        return res.status(400).json({ message: "Invalid payment ID" });
      }

      const payment = await storage.processPayment(paymentId);
      res.json(payment);
    } catch (error) {
      res.status(500).json({ message: "Error processing payment" });
    }
  });

  // AbacatePay routes (DEVELOPMENT ONLY - Mock implementations)
  // Note: In production, these routes are handled by /api/payment/abacatepay/* files
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    // AbacatePay PIX payment creation (development version - no auth required)
    app.post("/api/payment/abacatepay/create", async (req, res) => {
      try {
        const { amount, orderId, customerInfo } = req.body;

        if (!amount || typeof amount !== "number" || amount <= 0) {
          return res.status(400).json({ message: "Invalid amount" });
        }

        if (!orderId) {
          return res.status(400).json({ message: "Order ID is required" });
        }

        // Para desenvolvimento, criar um pagamento PIX mock
        const mockPaymentData = {
          id: `pix_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          qrCode: generateMockQRCodeSVG(),
          qrCodeText: generateMockPixCode(),
          amount: amount,
          status: 'pending',
          expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes from now
        };

        console.log('Mock payment created:', mockPaymentData);
        res.json(mockPaymentData);
      } catch (error) {
        console.error("Error creating AbacatePay PIX payment:", error);
        res.status(500).json({ message: "Error creating PIX payment" });
      }
    });

    // AbacatePay Credit Card payment creation
    app.post("/api/payment/abacatepay/create-card", async (req, res) => {
      try {
        const { amount, orderId, customerInfo, cardDetails } = req.body;

        if (!amount || typeof amount !== "number" || amount <= 0) {
          return res.status(400).json({ message: "Invalid amount" });
        }

        if (!orderId) {
          return res.status(400).json({ message: "Order ID is required" });
        }

        if (!cardDetails || !cardDetails.number || !cardDetails.name || !cardDetails.expiry || !cardDetails.cvc) {
          return res.status(400).json({ message: "Card details are required" });
        }

        // Para desenvolvimento, criar um pagamento de cartão mock
        const mockPaymentData = {
          id: `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          amount: amount,
          status: 'paid', // Simular aprovação imediata para cartão
          transactionId: `txn_${Date.now()}`,
          cardLast4: cardDetails.number.slice(-4),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        };

        res.json(mockPaymentData);
      } catch (error) {
        console.error("Error creating AbacatePay card payment:", error);
        res.status(500).json({ message: "Error creating card payment" });
      }
    });

    // AbacatePay Boleto payment creation
    app.post("/api/payment/abacatepay/create-boleto", async (req, res) => {
      try {
        const { amount, orderId, customerInfo } = req.body;

        if (!amount || typeof amount !== "number" || amount <= 0) {
          return res.status(400).json({ message: "Invalid amount" });
        }

        if (!orderId) {
          return res.status(400).json({ message: "Order ID is required" });
        }

        if (!customerInfo || !customerInfo.name || !customerInfo.email || !customerInfo.document) {
          return res.status(400).json({ message: "Customer info with document is required for boleto" });
        }

        // Para desenvolvimento, criar um pagamento de boleto mock
        const mockPaymentData = {
          id: `boleto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          qrCode: `data:application/pdf;base64,${Buffer.from('Mock Boleto PDF').toString('base64')}`, // Mock PDF
          qrCodeText: `34191.79001 01043.510047 91020.150008 1 84770000010000`, // Linha digitável mock
          amount: amount,
          status: 'pending',
          expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
        };

        res.json(mockPaymentData);
      } catch (error) {
        console.error("Error creating AbacatePay boleto payment:", error);
        res.status(500).json({ message: "Error creating boleto payment" });
      }
    });
  } // End of development-only routes

  // Helper functions for mock payment
  function generateMockQRCodeSVG(): string {
    return `data:image/svg+xml;base64,${Buffer.from(`
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="white" stroke="#000" stroke-width="2"/>
        <rect x="20" y="20" width="160" height="160" fill="none" stroke="#000" stroke-width="1"/>
        <rect x="40" y="40" width="20" height="20" fill="#000"/>
        <rect x="80" y="40" width="20" height="20" fill="#000"/>
        <rect x="120" y="40" width="20" height="20" fill="#000"/>
        <rect x="160" y="40" width="20" height="20" fill="#000"/>
        <rect x="40" y="80" width="20" height="20" fill="#000"/>
        <rect x="120" y="80" width="20" height="20" fill="#000"/>
        <rect x="40" y="120" width="20" height="20" fill="#000"/>
        <rect x="80" y="120" width="20" height="20" fill="#000"/>
        <rect x="160" y="120" width="20" height="20" fill="#000"/>
        <rect x="40" y="160" width="20" height="20" fill="#000"/>
        <rect x="80" y="160" width="20" height="20" fill="#000"/>
        <rect x="120" y="160" width="20" height="20" fill="#000"/>
        <rect x="160" y="160" width="20" height="20" fill="#000"/>
        <text x="100" y="195" text-anchor="middle" font-family="Arial" font-size="8" fill="#666">
          QR Code PIX - Desenvolvimento
        </text>
      </svg>
    `).toString('base64')}`;
  }

  function generateMockPixCode(): string {
    return "00020126580014br.gov.bcb.pix013614d9d0b7-f8a4-4e8a-9b2c-1a3b4c5d6e7f8g5204000053039865802BR5925LOJA TESTE DESENVOLVIMENTO6009SAO PAULO62070503***6304A1B2";
  }

  // Verificar status do pagamento AbacatePay
  app.get("/api/payment/abacatepay/status/:paymentId", isAuthenticated, async (req, res) => {
    try {
      const { paymentId } = req.params;

      if (!paymentId) {
        return res.status(400).json({ message: "Payment ID is required" });
      }

      // Buscar status do pagamento
      const status = await storage.getAbacatePaymentStatus(paymentId);
      res.json({ status });
    } catch (error) {
      console.error("Error checking AbacatePay payment status:", error);
      res.status(500).json({ message: "Error checking payment status" });
    }
  });

  // Webhook do AbacatePay (DEVELOPMENT ONLY)
  // Note: In production, this route is handled by /api/webhook/abacatepay.ts
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    app.post("/api/webhook/abacatepay", async (req, res) => {
      try {
        const webhookSecret = req.query.webhookSecret;

        if (webhookSecret !== process.env.ABACATEPAY_WEBHOOK_SECRET) {
          console.error("Invalid webhook secret");
          return res.status(401).json({ error: "Invalid webhook secret" });
        }

        // Processa a notificação
        const event = req.body;
        console.log("Received AbacatePay webhook:", event);

        // Processar diferentes tipos de eventos
        if (event.event === "billing.paid") {
          await storage.handleAbacatePaymentPaid(event.data);
        } else if (event.event === "billing.failed") {
          await storage.handleAbacatePaymentFailed(event.data);
        }

        res.status(200).json({ received: true });
      } catch (error) {
        console.error("Error processing AbacatePay webhook:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });
  }

  // Consolidated freight calculation endpoint
  app.post("/api/freight/calculate", freightLimiter, validateRequest(validationSchemas.freight), async (req, res) => {
    try {
      const { postalCode, weight, orderTotal } = req.body;
      console.log("Recebida requisição de cálculo de frete:", { postalCode, weight, orderTotal });

      // Check cache first
      const { freightCache } = await import('./freight-cache');
      const cachedResult = freightCache.getCached(postalCode, weight);

      if (cachedResult) {
        // Apply free shipping to cached result if eligible
        if (orderTotal && typeof orderTotal === "number") {
          const { applyFreeShipping } = await import('./services/freight-service');
          cachedResult.options = applyFreeShipping(cachedResult.options, orderTotal);
        }
        return res.json(cachedResult);
      }

      // Calculate shipping options using optimized service
      console.log("Calculando opções de frete para CEP:", postalCode, "e peso:", weight);
      const { freightService } = await import('./services/freight-service');
      const freightResponse = await freightService.calculateShipping(postalCode, weight, orderTotal);
      console.log("Resposta do cálculo de frete:", freightResponse);

      // Cache the result (free shipping already applied by service)
      freightCache.setCached(postalCode, weight, freightResponse);

      res.json(freightResponse);
    } catch (error) {
      console.error("Erro ao calcular frete:", error);
      res.status(500).json({
        message: "Error calculating freight",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Frenet shipping info
  app.get("/api/freight/info", async (req, res) => {
    try {
      // Import the FrenetProvider
      const { FrenetProvider } = await import('./services/freight-service');

      // Create an instance of the provider
      const frenetProvider = new FrenetProvider();

      // Get shipping info
      const shippingInfo = await frenetProvider.getShippingInfo();

      if (!shippingInfo) {
        return res.status(500).json({ message: "Error fetching shipping info from Frenet" });
      }

      res.json(shippingInfo);
    } catch (error) {
      console.error("Error fetching shipping info:", error);
      res.status(500).json({ message: "Error fetching shipping info" });
    }
  });

  // Teste da API da Frenet
  app.post("/api/freight/test", async (req, res) => {
    try {
      const { postalCode } = req.body;

      if (!postalCode || typeof postalCode !== "string") {
        return res.status(400).json({ message: "CEP inválido" });
      }

      // Import the FrenetProvider
      const { FrenetProvider } = await import('./services/freight-service');

      // Create an instance of the provider
      const frenetProvider = new FrenetProvider();

      // Dados de teste
      const testData = {
        SellerCEP: "04757020",
        RecipientCEP: postalCode.replace(/\D/g, ''),
        ShipmentInvoiceValue: 320.685,
        ShippingServiceCode: null,
        ShippingItemArray: [
          {
            Height: 2,
            Length: 33,
            Quantity: 1,
            Weight: 1.18,
            Width: 47,
            SKU: "IDW_54626",
            Category: "Cosmetics"
          },
          {
            Height: 5,
            Length: 15,
            Quantity: 1,
            Weight: 0.5,
            Width: 29
          }
        ],
        RecipientCountry: "BR"
      };

      // Fazer a requisição para a API da Frenet
      const response = await axios.post("https://api.frenet.com.br/shipping/quote", testData, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'token': "13B9E436RD32DR455ERAC99R93357F8D6640"
        }
      });

      res.json(response.data);
    } catch (error) {
      console.error("Erro no teste da API da Frenet:", error);
      res.status(500).json({
        message: "Erro no teste da API da Frenet",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Legacy endpoint for backward compatibility - redirects to main freight calculation
  app.post("/api/freight/quote", freightLimiter, async (req, res) => {
    try {
      // Convert Frenet API format to our standard format
      let requestData = req.body;
      if (req.body.request) {
        requestData = req.body.request;
      }

      if (!requestData || !requestData.RecipientCEP || !requestData.ShippingItemArray) {
        return res.status(400).json({
          message: "Dados de requisição inválidos",
          ShippingSevicesArray: []
        });
      }

      // Calculate total weight from shipping items
      const totalWeight = requestData.ShippingItemArray.reduce((total: number, item: any) => {
        let weight = Number(item.Weight) || 0.5;
        // Convert to kg if weight seems to be in grams
        if (weight > 30) {
          weight = weight / 1000;
        }
        return total + weight;
      }, 0);

      // Use our consolidated freight calculation
      const freightRequest = {
        postalCode: requestData.RecipientCEP,
        weight: totalWeight,
        orderTotal: requestData.ShipmentInvoiceValue
      };

      // Call our main freight calculation endpoint internally
      const { freightCache } = await import('./freight-cache');
      const cachedResult = freightCache.getCached(freightRequest.postalCode, freightRequest.weight);

      let freightResponse;
      if (cachedResult) {
        freightResponse = cachedResult;
      } else {
        const { freightService } = await import('./services/freight-service');
        freightResponse = await freightService.calculateShipping(freightRequest.postalCode, freightRequest.weight);
        freightCache.setCached(freightRequest.postalCode, freightRequest.weight, freightResponse);
      }

      // Convert our response format to Frenet API format for backward compatibility
      const frenetResponse = {
        ShippingSevicesArray: freightResponse.options.map((option: any) => ({
          ServiceCode: option.name.replace(/\s+/g, '_').toUpperCase(),
          ServiceDescription: option.name,
          ShippingPrice: option.price,
          DeliveryTime: option.estimatedDays,
          Carrier: option.name.includes('PAC') ? 'Correios' : 'Correios',
          Error: false
        }))
      };

      res.json(frenetResponse);
    } catch (error) {
      console.error("Erro na cotação de frete:", error);
      res.status(500).json({
        message: "Erro na cotação de frete: " + (error instanceof Error ? error.message : String(error)),
        ShippingSevicesArray: []
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

      // Garantir que a resposta tenha o campo Success
      if (response.data.Success === undefined) {
        // Considerar como sucesso se tiver pelo menos cidade e estado
        const hasCityAndState = response.data.City && response.data.UF;
        response.data.Success = hasCityAndState ? true : false;
      }

      // Se não tiver sucesso, adicionar mensagem de erro
      if (!response.data.Success && !response.data.Msg) {
        response.data.Msg = "CEP não encontrado";
      }

      // Garantir que todos os campos necessários existam
      if (!response.data.UF) response.data.UF = '';
      if (!response.data.City) response.data.City = '';
      if (!response.data.District) response.data.District = '';
      if (!response.data.Street) response.data.Street = '';
      if (!response.data.CEP) response.data.CEP = formattedCEP;

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

  // Buscar endereço do usuário (primeiro na tabela addresses, depois na tabela users)
  app.get("/api/users/:userId/address", async (req, res) => {
    try {
      const { userId } = req.params;

      // Verificar se o usuário está autenticado
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      // Verificar se o usuário está tentando acessar seu próprio endereço
      if (req.user.id !== parseInt(userId)) {
        console.log(`Acesso negado: user.id=${req.user.id}, userId=${userId}, tipos: ${typeof req.user.id} e ${typeof userId}`);
        return res.status(403).json({ message: "Acesso negado" });
      }

      // Primeiro, tentar buscar o endereço na tabela addresses
      try {
        const userAddress = await storage.getUserAddress(userId);

        if (userAddress) {
          console.log("Endereço encontrado na tabela addresses:", userAddress);

          // Converter para o formato esperado pelo cliente
          const address = {
            id: userAddress.id,
            userId: userAddress.userId,
            postalCode: userAddress.postalCode || '',
            street: userAddress.street || '',
            number: userAddress.number || '',
            complement: userAddress.complement || '',
            district: userAddress.district || '',
            city: userAddress.city || '',
            state: userAddress.state || '',
            country: userAddress.country || 'Brasil'
          };

          return res.json(address);
        }
      } catch (addressError) {
        console.warn("Erro ao buscar endereço na tabela addresses:", addressError);
        // Continuar para buscar na tabela users
      }

      // Se não encontrou na tabela addresses, buscar no perfil do usuário
      const userProfile = await storage.getUserProfile(userId);

      if (!userProfile) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      console.log("Usando dados de endereço da tabela users:", userProfile);

      // Converter os dados do usuário para o formato de endereço
      const address = {
        id: userProfile.id,
        userId: userProfile.id,
        postalCode: userProfile.postal_code || '',
        street: userProfile.address || '',
        number: '', // Não temos esse campo na tabela users
        complement: '', // Não temos esse campo na tabela users
        district: '', // Não temos esse campo na tabela users
        city: userProfile.city || '',
        state: userProfile.state || '',
        country: userProfile.country || 'Brasil'
      };

      res.json(address);
    } catch (error) {
      console.error("Erro ao buscar endereço do usuário:", error);
      res.status(500).json({
        message: "Erro ao buscar endereço do usuário",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Salvar endereço do usuário (na tabela addresses e também atualizar na tabela users)
  app.post("/api/users/:userId/address", async (req, res) => {
    try {
      const { userId } = req.params;
      const addressData = req.body;

      // Verificar se o usuário está autenticado
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      // Verificar se o usuário está tentando acessar seu próprio endereço
      if (req.user.id !== parseInt(userId)) {
        console.log(`Acesso negado: user.id=${req.user.id}, userId=${userId}, tipos: ${typeof req.user.id} e ${typeof userId}`);
        return res.status(403).json({ message: "Acesso negado" });
      }

      console.log("Salvando endereço do usuário:", addressData);

      // Salvar na tabela addresses
      try {
        const savedAddress = await storage.saveUserAddress(userId, addressData);
        console.log("Endereço salvo na tabela addresses:", savedAddress);

        // Também atualizar o perfil do usuário na tabela users para manter compatibilidade
        const profileUpdate = {
          postal_code: addressData.postalCode,
          address: addressData.street,
          city: addressData.city,
          state: addressData.state,
          country: addressData.country || 'Brasil'
        };

        await storage.updateUserProfile(userId, profileUpdate);

        // Salvar no Supabase
        const { saveUserAddressToSupabase } = await import('./user-supabase');
        await saveUserAddressToSupabase(userId, addressData);

        // Retornar o endereço salvo
        return res.json(savedAddress);
      } catch (error) {
        console.error("Erro ao salvar endereço na tabela addresses:", error);

        // Se falhar, tentar salvar apenas na tabela users como fallback
        console.log("Tentando salvar apenas na tabela users como fallback");
      }

      // Converter para o formato do perfil do usuário
      const profileUpdate = {
        postal_code: addressData.postalCode,
        address: addressData.street,
        city: addressData.city,
        state: addressData.state,
        country: addressData.country || 'Brasil'
      };

      // Atualizar perfil do usuário no banco de dados
      const updatedProfile = await storage.updateUserProfile(userId, profileUpdate);

      // Salvar no Supabase
      const { saveUserAddressToSupabase } = await import('./user-supabase');
      await saveUserAddressToSupabase(userId, addressData);

      // Converter de volta para o formato de endereço para manter compatibilidade
      const savedAddress = {
        id: updatedProfile.id,
        userId: updatedProfile.id,
        postalCode: updatedProfile.postalCode || '',
        street: updatedProfile.address || '',
        number: addressData.number || '',
        complement: addressData.complement || '',
        district: addressData.district || '',
        city: updatedProfile.city || '',
        state: updatedProfile.state || '',
        country: updatedProfile.country || 'Brasil'
      };

      res.json(savedAddress);
    } catch (error) {
      console.error("Erro ao salvar endereço do usuário:", error);
      res.status(500).json({
        message: "Erro ao salvar endereço do usuário",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Obter perfil do usuário
  app.get("/api/users/:userId/profile", isAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;

      console.log("Profile get request:", {
        userId,
        user: req.user,
        isAuthenticated: req.isAuthenticated()
      });

      // Verificar se o usuário está tentando acessar seu próprio perfil
      if (req.user!.id !== parseInt(userId)) {
        console.log(`Acesso negado: user.id=${req.user!.id}, userId=${userId}, tipos: ${typeof req.user!.id} e ${typeof userId}`);
        return res.status(403).json({ message: "Acesso negado" });
      }

      // Buscar perfil do usuário no banco de dados
      const userProfile = await storage.getUserProfile(userId);

      // O método getUserProfile agora sempre retorna um objeto, mesmo que seja um objeto vazio
      // com valores padrão, então não precisamos verificar se é null
      console.log("Perfil do usuário recuperado:", userProfile);

      res.json(userProfile);
    } catch (error) {
      console.error("Erro ao buscar perfil do usuário:", error);
      res.status(500).json({
        message: "Erro ao buscar perfil do usuário",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Atualizar perfil do usuário
  app.put("/api/users/:userId/profile", isAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      const profileData = req.body;

      console.log("Profile update request:", {
        userId,
        profileData,
        user: req.user,
        isAuthenticated: req.isAuthenticated()
      });

      // Verificar se o usuário está tentando atualizar seu próprio perfil
      if (req.user!.id !== parseInt(userId)) {
        console.log(`Acesso negado: user.id=${req.user!.id}, userId=${userId}, tipos: ${typeof req.user!.id} e ${typeof userId}`);
        return res.status(403).json({ message: "Acesso negado" });
      }

      // Validar dados do perfil
      if (!profileData.name || !profileData.email) {
        return res.status(400).json({ message: "Nome e e-mail são obrigatórios" });
      }

      // Atualizar perfil do usuário no banco de dados
      const updatedProfile = await storage.updateUserProfile(userId, profileData);

      // Salvar no Supabase
      const { saveUserProfileToSupabase } = await import('./user-supabase');
      await saveUserProfileToSupabase(userId, profileData);

      res.json(updatedProfile);
    } catch (error) {
      console.error("Erro ao atualizar perfil do usuário:", error);
      res.status(500).json({
        message: "Erro ao atualizar perfil do usuário",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Alterar senha do usuário
  app.put("/api/users/:userId/password", async (req, res) => {
    try {
      const { userId } = req.params;
      const { currentPassword, newPassword } = req.body;

      // Verificar se o usuário está autenticado
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      // Verificar se o usuário está tentando alterar sua própria senha
      if (req.user.id !== parseInt(userId)) {
        console.log(`Acesso negado: user.id=${req.user.id}, userId=${userId}, tipos: ${typeof req.user.id} e ${typeof userId}`);
        return res.status(403).json({ message: "Acesso negado" });
      }

      // Validar dados
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Senha atual e nova senha são obrigatórias" });
      }

      // Verificar senha atual
      const isPasswordValid = await storage.validateUserPassword(userId, currentPassword);

      if (!isPasswordValid) {
        return res.status(400).json({ message: "Senha atual incorreta" });
      }

      // Alterar senha do usuário no banco de dados
      await storage.updateUserPassword(userId, newPassword);

      res.json({ message: "Senha alterada com sucesso" });
    } catch (error) {
      console.error("Erro ao alterar senha do usuário:", error);
      res.status(500).json({
        message: "Erro ao alterar senha do usuário",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Admin dashboard stats
  app.get("/api/admin/stats", isAdmin, async (req, res) => {
    try {
      console.log("Fetching admin stats for user:", req.user?.username);
      const stats = await storage.getStats();
      console.log("Admin stats fetched successfully:", stats);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Error fetching stats" });
    }
  });

  // Endpoint para upload de imagens
  app.post('/api/upload', isAdminOrDev, upload.array('images', 10), async (req, res) => {
    try {
      console.log('Upload request received:', {
        files: req.files?.length || 0,
        body: req.body,
        isAuthenticated: req.isAuthenticated(),
        user: req.user?.role
      });

      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({ message: 'Nenhum arquivo enviado' });
      }

      // Obtém a categoria do produto - padrão para 'categorias' se não especificado
      let categorySlug = 'categorias';
      if (req.body.categoryId) {
        const categoryId = parseInt(req.body.categoryId);
        const category = await storage.getCategory(categoryId);
        if (category) {
          categorySlug = category.slug;
        }
      }

      // Verifica se há uma subpasta especificada
      const subfolder = req.body.subfolder || '';

      console.log(`Uploading files to category: ${categorySlug}, subfolder: ${subfolder}`);

      // Se houver uma subpasta, certifique-se de que ela existe
      if (subfolder) {
        const folderPath = `${categorySlug}/${subfolder}`;
        console.log(`Creating nested folder structure: ${folderPath}`);
        await createNestedFoldersInBucket(folderPath);
      }

      // Faz upload de cada arquivo
      const uploadPromises = (req.files as Express.Multer.File[]).map(async (file) => {
        const url = await uploadFile(file.path, categorySlug, subfolder);

        // Remove o arquivo temporário
        try {
          fs.unlinkSync(file.path);
        } catch (unlinkError) {
          console.warn('Failed to remove temp file:', file.path);
        }

        return url;
      });

      // Aguarda todos os uploads terminarem
      const urls = await Promise.all(uploadPromises);

      // Filtra URLs nulas (falhas de upload)
      const validUrls = urls.filter(url => url !== null);

      console.log(`Upload completed: ${validUrls.length} files uploaded successfully`);

      return res.status(200).json({
        urls: validUrls,
        message: `${validUrls.length} imagens enviadas com sucesso`
      });
    } catch (error) {
      console.error('Erro no upload de imagens:', error);
      return res.status(500).json({
        message: 'Erro ao processar upload de imagens',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Endpoint para listar imagens do bucket do Supabase
  app.get('/api/storage/images', isAdminOrDev, async (req, res) => {
    try {
      const { folder, includeSubfolders } = req.query;
      console.log(`API: Listing images from folder: ${folder}, includeSubfolders: ${includeSubfolders}`);

      // Listar imagens do bucket usando a função importada no topo do arquivo
      const images = await listBucketImages(
        folder as string,
        includeSubfolders === 'true'
      );
      console.log(`API: Found ${images.length} images in folder ${folder}`);

      return res.status(200).json({
        images,
        message: `${images.length} imagens encontradas`
      });
    } catch (error) {
      console.error('Erro ao listar imagens do bucket:', error);
      return res.status(500).json({
        message: 'Erro ao listar imagens do bucket',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  // Endpoint para verificar a conexão com o Supabase
  app.get('/api/storage/check-connection', isAdminOrDev, async (req, res) => {
    try {
      const isConnected = await checkSupabaseConnection();

      return res.status(200).json({
        connected: isConnected,
        message: isConnected ? 'Conexão com Supabase estabelecida com sucesso' : 'Falha na conexão com Supabase'
      });
    } catch (error) {
      console.error('Erro ao verificar conexão com Supabase:', error);
      return res.status(500).json({
        connected: false,
        message: 'Erro ao verificar conexão com Supabase',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
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
        path as string,
        includeFullPath === 'true'
      );
      console.log(`API: Found ${folders.length} folders`);

      // Se não encontrou pastas, tenta inicializar o bucket
      if (folders.length === 0) {
        console.log('API: No folders found, initializing storage service');
        await initStorageService();

        // Tenta listar novamente
        folders = await listBucketFolders(path as string, includeFullPath === 'true');
        console.log(`API: After initialization, found ${folders.length} folders`);

        // Se ainda não encontrou pastas e estamos na raiz, cria uma pasta para cada categoria
        if (folders.length === 0 && !path) {
          console.log('API: Still no folders, creating category folders');
          const categories = await storage.getCategories();

          for (const category of categories) {
            try {
              await createFolderInBucket(category.slug);
              folders.push({
                name: category.slug,
                path: category.slug,
                hasSubfolders: false
              });
              console.log(`API: Created folder for category: ${category.slug}`);
            } catch (createError) {
              console.error(`API: Error creating folder for category ${category.slug}:`, createError);
            }
          }

          // Se ainda não tiver pastas, cria uma pasta padrão
          if (folders.length === 0) {
            try {
              await createFolderInBucket('default');
              folders.push({
                name: 'default',
                path: 'default',
                hasSubfolders: false
              });
              console.log('API: Created default folder');
            } catch (createError) {
              console.error('API: Error creating default folder:', createError);
            }
          }
        }
      }

      return res.status(200).json({
        folders,
        message: `${folders.length} pastas encontradas`
      });
    } catch (error) {
      console.error('Erro ao listar pastas do bucket:', error);
      return res.status(500).json({
        message: 'Erro ao listar pastas do bucket',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  // Obter pedidos do usuário
  app.get("/api/users/:userId/orders", async (req, res) => {
    try {
      const { userId } = req.params;

      // Verificar se o usuário está autenticado
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      // Verificar se o usuário está tentando acessar seus próprios pedidos
      if (req.user.id !== parseInt(userId)) {
        console.log(`Acesso negado: user.id=${req.user.id}, userId=${userId}, tipos: ${typeof req.user.id} e ${typeof userId}`);
        return res.status(403).json({ message: "Acesso negado" });
      }

      // Buscar pedidos do usuário
      const orders = await storage.getUserOrders(userId);

      res.json(orders);
    } catch (error) {
      console.error("Erro ao buscar pedidos do usuário:", error);
      res.status(500).json({
        message: "Erro ao buscar pedidos do usuário",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Rota duplicada removida - usar a rota principal em /api/orders/:id

  // Criar um novo pedido
  app.post("/api/orders", async (req, res) => {
    try {
      // Verificar se o usuário está autenticado
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      const userId = req.user.id;
      const orderData = req.body;

      // Validar dados do pedido
      if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
        return res.status(400).json({ message: "Itens do pedido inválidos" });
      }

      if (!orderData.shippingAddress) {
        return res.status(400).json({ message: "Endereço de entrega é obrigatório" });
      }

      if (!orderData.shippingMethod) {
        return res.status(400).json({ message: "Método de envio é obrigatório" });
      }

      if (!orderData.payment) {
        return res.status(400).json({ message: "Informações de pagamento são obrigatórias" });
      }

      // Criar pedido
      const order = await storage.createOrder({
        userId,
        items: orderData.items,
        shippingAddress: orderData.shippingAddress,
        shippingMethod: orderData.shippingMethod,
        payment: orderData.payment,
        subtotal: orderData.subtotal,
        shippingCost: orderData.shippingCost,
        total: orderData.total,
        status: "pending" // Status inicial do pedido
      });

      // Limpar carrinho do usuário após criar o pedido
      await storage.clearCart(userId);

      // Salvar no Supabase (implementação futura)
      // TODO: Implementar integração com Supabase

      res.status(201).json(order);
    } catch (error) {
      console.error("Erro ao criar pedido:", error);
      res.status(500).json({
        message: "Erro ao criar pedido",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Settings endpoints
  app.get("/api/settings/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const settings = await storage.getSettingsByCategory(category);
      res.json(settings);
    } catch (error) {
      console.error("Error getting settings:", error);
      res.status(500).json({ message: "Error getting settings" });
    }
  });

  app.get("/api/settings/:category/:key", async (req, res) => {
    try {
      const { key } = req.params;
      const value = await storage.getSetting(key);
      res.json({ key, value });
    } catch (error) {
      console.error("Error getting setting:", error);
      res.status(500).json({ message: "Error getting setting" });
    }
  });

  app.put("/api/settings/:category/:key", isAdmin, async (req, res) => {
    try {
      const { key, category } = req.params;
      const { value, description } = req.body;

      await storage.setSetting(key, value, description, category);
      res.json({ message: "Setting updated successfully" });
    } catch (error) {
      console.error("Error updating setting:", error);
      res.status(500).json({ message: "Error updating setting" });
    }
  });

  app.post("/api/settings", isAdmin, async (req, res) => {
    try {
      const { key, value, description, category } = req.body;

      await storage.setSetting(key, value, description, category);
      res.json({ message: "Setting created successfully" });
    } catch (error) {
      console.error("Error creating setting:", error);
      res.status(500).json({ message: "Error creating setting" });
    }
  });

  return httpServer;
}
