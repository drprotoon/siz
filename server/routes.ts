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
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import MemoryStore from "memorystore";
import { ensureImagesArray, prepareImagesForStorage } from "./utils";
import multer from 'multer';
import axios from 'axios';
import {
  initStorageService,
  uploadFile,
  listBucketImages,
  listBucketFolders,
  createFolderInBucket,
  createNestedFoldersInBucket
} from './storage-service';
import { checkSupabaseConnection } from './supabase';
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

  passport.deserializeUser(async (id: number, done) => {
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
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  const isAdmin = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated() && req.user.role === "admin") {
      return next();
    }
    console.log("Access denied: User is not authenticated as admin");
    res.status(403).json({ message: "Forbidden" });
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
  app.post("/api/auth/login", (req, res, next) => {
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

  // Get all users (admin only)
  app.get("/api/users", isAdmin, async (req, res) => {
    try {
      const users = await storage.getUsers();
      // Remove passwords from response
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Error fetching users" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
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

      // Remove password from response
      const { password, ...userWithoutPassword } = newUser;

      res.status(201).json({
        message: "User registered successfully",
        user: userWithoutPassword
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid user data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error registering user" });
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
  app.get("/api/products", async (req, res) => {
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
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid cart data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error adding to cart" });
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

  // Wishlist routes
  app.get("/api/wishlist", isAuthenticated, async (req, res) => {
    try {
      const wishlistItems = await storage.getUserWishlistWithProducts(req.user?.id || 0);
      res.json(wishlistItems);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar lista de desejos" });
    }
  });

  app.post("/api/wishlist", isAuthenticated, async (req, res) => {
    try {
      const wishlistItemData = insertWishlistItemSchema.parse({
        ...req.body,
        userId: req.user?.id || 0
      });

      // Check if product exists
      const product = await storage.getProduct(wishlistItemData.productId);
      if (!product) {
        return res.status(404).json({ message: "Produto não encontrado" });
      }

      const wishlistItem = await storage.addToWishlist(wishlistItemData);
      res.status(201).json(wishlistItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      } else {
        res.status(500).json({ message: "Erro ao adicionar à lista de desejos" });
      }
    }
  });

  app.delete("/api/wishlist/:id", isAuthenticated, async (req, res) => {
    try {
      const wishlistItemId = parseInt(req.params.id);

      // Get the wishlist item to verify ownership
      const wishlistItems = await storage.getUserWishlist(req.user?.id || 0);
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

  app.get("/api/wishlist/check/:productId", isAuthenticated, async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const isInWishlist = await storage.isProductInWishlist(req.user?.id || 0, productId);
      res.json({ isInWishlist });
    } catch (error) {
      res.status(500).json({ message: "Erro ao verificar produto na lista de desejos" });
    }
  });

  // Freight calculation route - removido para evitar duplicação

  // Order routes
  app.get("/api/orders", isAuthenticated, async (req, res) => {
    try {
      let orders;

      if (req.user?.role === "admin") {
        orders = await storage.getOrdersWithItems();
      } else {
        orders = await storage.getUserOrdersWithItems(req.user?.id || 0);
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
      if (req.user?.role !== "admin" && order.userId !== req.user?.id) {
        return res.status(403).json({ message: "Forbidden" });
      }

      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Error fetching order" });
    }
  });

  app.post("/api/orders", isAuthenticated, async (req, res) => {
    try {
      const { order, items } = req.body;

      const orderData = insertOrderSchema.parse({
        ...order,
        userId: req.user?.id || 0
      });

      // Validate items
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Order must have at least one item" });
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
          return res.status(404).json({ message: `Product ID ${orderItem.productId} not found` });
        }

        if (product.quantity < orderItem.quantity) {
          return res.status(400).json({ message: `Not enough stock available for product ${product.name}` });
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
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid order data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error creating order" });
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

      // Apply free shipping if eligible
      if (orderTotal && typeof orderTotal === "number") {
        const { applyFreeShipping } = await import('./shipping');
        freightResponse.options = applyFreeShipping(freightResponse.options, orderTotal);
        console.log("Frete grátis aplicado:", freightResponse.options);
      }

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
      // Import the FrenetShippingProvider
      const { FrenetShippingProvider } = await import('./shipping');

      // Create an instance of the provider
      const frenetProvider = new FrenetShippingProvider();

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

      // Import the FrenetShippingProvider
      const { FrenetShippingProvider } = await import('./shipping');

      // Create an instance of the provider
      const frenetProvider = new FrenetShippingProvider();

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

  // Endpoint para cotação de frete usando a API da Frenet
  app.post("/api/freight/quote", async (req, res) => {
    try {
      // Verificar se a requisição veio diretamente ou dentro de um objeto 'request'
      let requestData = req.body;
      if (req.body.request) {
        requestData = req.body.request;
      }

      console.log("Recebida requisição de cotação de frete:", JSON.stringify(requestData));

      if (!requestData || !requestData.RecipientCEP || !requestData.ShippingItemArray) {
        console.log("Dados de requisição inválidos:", requestData);
        return res.status(400).json({
          message: "Dados de requisição inválidos",
          ShippingSevicesArray: []
        });
      }

      // Validar CEP do destinatário
      const recipientCEP = requestData.RecipientCEP.replace(/\D/g, '');
      if (recipientCEP.length !== 8) {
        console.log("CEP do destinatário inválido:", requestData.RecipientCEP);
        return res.status(400).json({
          message: "CEP do destinatário inválido",
          ShippingSevicesArray: []
        });
      }

      // Validar CEP do remetente
      const sellerCEP = requestData.SellerCEP.replace(/\D/g, '');
      if (sellerCEP.length !== 8) {
        console.log("CEP do remetente inválido:", requestData.SellerCEP);
        return res.status(400).json({
          message: "CEP do remetente inválido",
          ShippingSevicesArray: []
        });
      }

      // Verificar e converter os pesos para números
      if (requestData.ShippingItemArray && Array.isArray(requestData.ShippingItemArray)) {
        requestData.ShippingItemArray = requestData.ShippingItemArray.map((item: any) => {
          // Converter o peso para número
          if (item.Weight !== undefined) {
            if (typeof item.Weight === 'string') {
              item.Weight = parseFloat(item.Weight.replace(/[^\d.-]/g, ''));
            } else {
              item.Weight = Number(item.Weight);
            }

            // Garantir que o peso seja um número válido
            if (isNaN(item.Weight) || item.Weight <= 0) {
              item.Weight = 0.5; // valor padrão se inválido
            }

            // Converter para kg se o peso for muito alto (provavelmente está em gramas)
            if (item.Weight > 30) {
              item.Weight = item.Weight / 1000;
            }
          }

          // Converter outras dimensões para números
          if (item.Height !== undefined) item.Height = Number(item.Height) || 10;
          if (item.Length !== undefined) item.Length = Number(item.Length) || 15;
          if (item.Width !== undefined) item.Width = Number(item.Width) || 15;

          return item;
        });
      }

      console.log("Enviando requisição para a API da Frenet com dados convertidos:", JSON.stringify(requestData));

      // Fazer a requisição para a API da Frenet
      const response = await axios.post("https://api.frenet.com.br/shipping/quote", requestData, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'token': "13B9E436RD32DR455ERAC99R93357F8D6640"
        }
      });

      console.log("Resposta da API da Frenet:", JSON.stringify(response.data));

      // Verificar se a resposta contém os dados esperados
      if (!response.data) {
        console.log("Resposta vazia da API da Frenet");
        return res.status(500).json({
          message: "Resposta vazia da API da Frenet",
          ShippingSevicesArray: []
        });
      }

      // Retornar a resposta original da API da Frenet
      res.json(response.data);
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
  app.get("/api/users/:userId/profile", async (req, res) => {
    try {
      const { userId } = req.params;

      // Verificar se o usuário está autenticado
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      // Verificar se o usuário está tentando acessar seu próprio perfil
      if (req.user.id !== parseInt(userId)) {
        console.log(`Acesso negado: user.id=${req.user.id}, userId=${userId}, tipos: ${typeof req.user.id} e ${typeof userId}`);
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
  app.put("/api/users/:userId/profile", async (req, res) => {
    try {
      const { userId } = req.params;
      const profileData = req.body;

      // Verificar se o usuário está autenticado
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      // Verificar se o usuário está tentando atualizar seu próprio perfil
      if (req.user.id !== parseInt(userId)) {
        console.log(`Acesso negado: user.id=${req.user.id}, userId=${userId}, tipos: ${typeof req.user.id} e ${typeof userId}`);
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
        fs.unlinkSync(file.path);

        return url;
      });

      // Aguarda todos os uploads terminarem
      const urls = await Promise.all(uploadPromises);

      // Filtra URLs nulas (falhas de upload)
      const validUrls = urls.filter(url => url !== null);

      return res.status(200).json({
        urls: validUrls,
        message: `${validUrls.length} imagens enviadas com sucesso`
      });
    } catch (error) {
      console.error('Erro no upload de imagens:', error);
      return res.status(500).json({ message: 'Erro ao processar upload de imagens' });
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

  // Obter detalhes de um pedido específico
  app.get("/api/orders/:orderId", async (req, res) => {
    try {
      const { orderId } = req.params;

      // Verificar se o usuário está autenticado
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      // Buscar detalhes do pedido
      const order = await storage.getOrderById(orderId);

      if (!order) {
        return res.status(404).json({ message: "Pedido não encontrado" });
      }

      // Verificar se o pedido pertence ao usuário autenticado
      if (order.userId !== req.user.id) {
        console.log(`Acesso negado: order.userId=${order.userId}, user.id=${req.user.id}, tipos: ${typeof order.userId} e ${typeof req.user.id}`);
        return res.status(403).json({ message: "Acesso negado" });
      }

      res.json(order);
    } catch (error) {
      console.error("Erro ao buscar detalhes do pedido:", error);
      res.status(500).json({
        message: "Erro ao buscar detalhes do pedido",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

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

  return httpServer;
}
