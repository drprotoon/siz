import {
  User,
  InsertUser,
  Category,
  InsertCategory,
  Product,
  InsertProduct,
  Order,
  InsertOrder,
  OrderItem,
  InsertOrderItem,
  Review,
  InsertReview,
  CartItem,
  InsertCartItem,
  WishlistItem,
  InsertWishlistItem,
  ProductWithCategory,
  OrderWithItems,
  FreightOption,
  FreightCalculationResponse,
  PaymentIntent
} from "@shared/schema";
import { ensureImagesArray } from "./utils";
import { eq, and, desc, sql, ne } from "drizzle-orm";
import { db } from "./db";
import { users, categories, products, orders, orderItems, reviews, cartItems, wishlistItems, addresses } from "@shared/schema";
import bcrypt from "bcrypt";

export interface IStorage {
  // Users
  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;

  // Categories
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;

  // Products
  getProducts(options?: { categoryId?: number, featured?: boolean, visible?: boolean }): Promise<Product[]>;
  getProductsWithCategory(options?: { categoryId?: number, featured?: boolean, visible?: boolean }): Promise<ProductWithCategory[]>;
  getProduct(id: number): Promise<Product | undefined>;
  getProductBySlug(slug: string): Promise<Product | undefined>;
  getProductWithCategory(id: number): Promise<ProductWithCategory | undefined>;
  getProductWithCategoryBySlug(slug: string): Promise<ProductWithCategory | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  updateProductStock(id: number, quantityChange: number): Promise<Product | undefined>;

  // Orders
  getOrders(): Promise<Order[]>;
  getOrdersWithItems(): Promise<OrderWithItems[]>;
  getOrder(id: number): Promise<Order | undefined>;
  getOrderWithItems(id: number): Promise<OrderWithItems | undefined>;
  getUserOrders(userId: number): Promise<Order[]>;
  getUserOrdersWithItems(userId: number): Promise<OrderWithItems[]>;
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;

  // Reviews
  getProductReviews(productId: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  deleteReview(id: number): Promise<boolean>;

  // Cart
  getUserCart(userId: number): Promise<CartItem[]>;
  getUserCartWithProducts(userId: number): Promise<(CartItem & { product: Product })[]>;
  addToCart(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: number, quantity: number): Promise<CartItem | undefined>;
  removeFromCart(id: number): Promise<boolean>;
  clearCart(userId: number): Promise<boolean>;

  // Freight calculation
  calculateFreight(postalCode: string, weight: number): Promise<FreightCalculationResponse>;

  // Payment processing
  createPaymentIntent(amount: number): Promise<PaymentIntent>;
  processPayment(paymentId: string): Promise<PaymentIntent>;

  // Statistics for admin dashboard
  getStats(): Promise<{
    totalSales: number,
    totalOrders: number,
    newCustomers: number,
    lowStockProducts: number
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private products: Map<number, Product>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem[]>;
  private reviews: Map<number, Review>;
  private cartItems: Map<number, CartItem>;

  private userCurrentId: number;
  private categoryCurrentId: number;
  private productCurrentId: number;
  private orderCurrentId: number;
  private orderItemCurrentId: number;
  private reviewCurrentId: number;
  private cartItemCurrentId: number;

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.products = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.reviews = new Map();
    this.cartItems = new Map();

    this.userCurrentId = 1;
    this.categoryCurrentId = 1;
    this.productCurrentId = 1;
    this.orderCurrentId = 1;
    this.orderItemCurrentId = 1;
    this.reviewCurrentId = 1;
    this.cartItemCurrentId = 1;

    // Initialize with some data
    this.initializeData();
  }

  private initializeData() {
    // Create admin user
    this.createUser({
      username: "admin",
      password: "$2b$10$jBtI6O6SlxZR4lzCE3j3T.OVEXzp6kTctd.KNysCj5Uc3GWdV13vG", // "admin123"
      email: "admin@beautyessence.com",
      role: "admin"
    });

    // Create categories
    const skincare = this.createCategory({
      name: "Skincare",
      slug: "skincare",
      description: "Products to keep your skin healthy and glowing",
      imageUrl: "https://images.unsplash.com/photo-1570194065650-d99fb4cb7300"
    });

    const makeup = this.createCategory({
      name: "Makeup",
      slug: "makeup",
      description: "Cosmetics to enhance your natural beauty",
      imageUrl: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9"
    });

    const haircare = this.createCategory({
      name: "Haircare",
      slug: "haircare",
      description: "Products to keep your hair healthy and beautiful",
      imageUrl: "https://pixabay.com/get/g5ae87dd5119a8c4ac755124765852ad4db4dbfaeeac7458b3c2430be9eb639a536c26198fd7de142aea82305bbab4902f71988fdddfd242632ca7daa772e6fed_1280.jpg"
    });

    const fragrance = this.createCategory({
      name: "Fragrance",
      slug: "fragrance",
      description: "Scents that leave a lasting impression",
      imageUrl: "https://images.unsplash.com/photo-1600612253971-422e7f7faeb6"
    });

    // Create products
    // Skincare products
    this.createProduct({
      name: "Hydrating Face Cream",
      slug: "hydrating-face-cream",
      description: "Our Hydrating Face Cream is specially formulated to provide intense hydration for all skin types. This luxurious cream features a blend of natural ingredients that work together to nourish, moisturize, and revitalize your skin.",
      price: "129.90",
      compareAtPrice: "159.90",
      sku: "SKN-001",
      weight: "100",
      quantity: 48,
      categoryId: skincare.id,
      images: [
        "https://images.unsplash.com/photo-1571781926291-c477ebfd024b",
        "https://images.unsplash.com/photo-1556228720-195a672e8a03",
        "https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd",
        "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908"
      ],
      ingredients: "Aqua/Water, Glycerin, Cetearyl Alcohol, Caprylic/Capric Triglyceride, Helianthus Annuus (Sunflower) Seed Oil, Butyrospermum Parkii (Shea) Butter, Squalane, Sodium Hyaluronate, Panthenol, Tocopherol, Aloe Barbadensis Leaf Juice, Cucumis Sativus (Cucumber) Fruit Extract, Rosa Canina Fruit Extract, Camellia Sinensis Leaf Extract, Phenoxyethanol, Ethylhexylglycerin, Sodium Polyacrylate, Xanthan Gum, Citric Acid, Sodium Hydroxide, Parfum/Fragrance, Limonene, Linalool.",
      howToUse: "Apply a small amount to cleansed face and neck. Gently massage in upward circular motions until fully absorbed. Use morning and evening for best results.",
      visible: true,
      featured: true,
      bestSeller: true
    });

    this.createProduct({
      name: "Vitamin C Brightening Serum",
      slug: "vitamin-c-brightening-serum",
      description: "Our Vitamin C Serum helps brighten skin tone, reduce fine lines, and protect against environmental damage. It's formulated with a stable form of vitamin C for maximum effectiveness.",
      price: "159.90",
      sku: "SKN-002",
      weight: "30",
      quantity: 36,
      categoryId: skincare.id,
      images: [
        "https://images.unsplash.com/photo-1620916566398-39f1143ab7be"
      ],
      ingredients: "Aqua/Water, Ascorbic Acid (Vitamin C), Glycerin, Propylene Glycol, Tocopherol (Vitamin E), Ferulic Acid, Sodium Hyaluronate, Panthenol, Citrus Aurantium Dulcis (Orange) Oil, Citrus Limon (Lemon) Peel Oil, Phenoxyethanol, Ethylhexylglycerin.",
      howToUse: "Apply 3-4 drops to clean, dry skin in the morning before moisturizer and sunscreen. Allow to absorb fully before applying additional products.",
      visible: true,
      bestSeller: true
    });

    // Makeup products
    this.createProduct({
      name: "Long-wear Foundation",
      slug: "long-wear-foundation",
      description: "A lightweight foundation that provides medium to full coverage with a natural matte finish. Long-lasting formula stays put for up to 24 hours.",
      price: "179.90",
      sku: "MKP-001",
      weight: "30",
      quantity: 24,
      categoryId: makeup.id,
      images: [
        "https://images.unsplash.com/photo-1625772452859-1c03d5bf1137"
      ],
      ingredients: "Aqua/Water, Cyclopentasiloxane, Dimethicone, PEG-10 Dimethicone, Glycerin, Phenyl Trimethicone, Dimethicone/PEG-10/15 Crosspolymer, Sodium Chloride, Nylon-12, Cyclohexasiloxane, Zinc Oxide, Titanium Dioxide.",
      howToUse: "Apply to clean, moisturized skin using a foundation brush, beauty sponge, or fingertips. Build coverage as needed.",
      visible: true,
      newArrival: true
    });

    // Haircare products
    this.createProduct({
      name: "Nourishing Hair Treatment Oil",
      slug: "nourishing-hair-treatment-oil",
      description: "A luxurious hair oil that repairs damaged strands, tames frizz, and adds shine. Formulated with a blend of natural oils to nourish and protect.",
      price: "89.90",
      sku: "HCR-001",
      weight: "100",
      quantity: 8,
      categoryId: haircare.id,
      images: [
        "https://pixabay.com/get/g5717be376be686e916e9acf951b5e0fcf128fc9c74234fae2cf68c95b848aabd995fa77f40f372b3c729c66701e6410648e988a3faa833cbc1ed5eb5cfd1a17b_1280.jpg"
      ],
      ingredients: "Cocos Nucifera (Coconut) Oil, Argania Spinosa Kernel Oil, Olea Europaea (Olive) Fruit Oil, Simmondsia Chinensis (Jojoba) Seed Oil, Persea Gratissima (Avocado) Oil, Tocopherol, Parfum/Fragrance.",
      howToUse: "Apply a small amount to damp or dry hair, focusing on ends. Style as usual. Can also be used as an overnight treatment.",
      visible: true,
      bestSeller: true
    });

    // More products can be added as needed
  }

  // Users
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    return Array.from(this.categories.values()).find(
      (category) => category.slug === slug,
    );
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.categoryCurrentId++;
    const category: Category = { ...insertCategory, id };
    this.categories.set(id, category);
    return category;
  }

  async updateCategory(id: number, categoryData: Partial<InsertCategory>): Promise<Category | undefined> {
    const category = await this.getCategory(id);
    if (!category) return undefined;

    const updatedCategory = { ...category, ...categoryData };
    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<boolean> {
    return this.categories.delete(id);
  }

  // Products
  async getProducts(options?: { categoryId?: number, featured?: boolean, visible?: boolean }): Promise<Product[]> {
    let products = Array.from(this.products.values());

    if (options) {
      if (options.categoryId !== undefined) {
        products = products.filter(p => p.categoryId === options.categoryId);
      }
      if (options.featured !== undefined) {
        products = products.filter(p => p.featured === options.featured);
      }
      if (options.visible !== undefined) {
        products = products.filter(p => p.visible === options.visible);
      }
    }

    return products;
  }

  async getProductsWithCategory(options?: { categoryId?: number, featured?: boolean, visible?: boolean }): Promise<ProductWithCategory[]> {
    const products = await this.getProducts(options);
    return Promise.all(
      products.map(async (product) => {
        const category = await this.getCategory(product.categoryId);
        return {
          ...product,
          category: category!
        };
      })
    );
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    return Array.from(this.products.values()).find(
      (product) => product.slug === slug,
    );
  }

  async getProductWithCategory(id: number): Promise<ProductWithCategory | undefined> {
    const product = await this.getProduct(id);
    if (!product) return undefined;

    const category = await this.getCategory(product.categoryId);
    if (!category) return undefined;

    return {
      ...product,
      category
    };
  }

  async getProductWithCategoryBySlug(slug: string): Promise<ProductWithCategory | undefined> {
    const product = await this.getProductBySlug(slug);
    if (!product) return undefined;

    const category = await this.getCategory(product.categoryId);
    if (!category) return undefined;

    return {
      ...product,
      category
    };
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.productCurrentId++;
    const product: Product = {
      ...insertProduct,
      id,
      createdAt: new Date(),
      rating: "0",
      reviewCount: 0
    };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: number, productData: Partial<InsertProduct>): Promise<Product | undefined> {
    const product = await this.getProduct(id);
    if (!product) return undefined;

    const updatedProduct = { ...product, ...productData };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
  }

  async updateProductStock(id: number, quantityChange: number): Promise<Product | undefined> {
    const product = await this.getProduct(id);
    if (!product) return undefined;

    const newQuantity = Number(product.quantity) + quantityChange;
    if (newQuantity < 0) return undefined; // Cannot reduce below 0

    const updatedProduct = { ...product, quantity: newQuantity };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async getOrdersWithItems(): Promise<OrderWithItems[]> {
    const orders = await this.getOrders();
    return Promise.all(
      orders.map(async (order) => {
        const items = this.orderItems.get(order.id) || [];
        const user = await this.getUser(order.userId);
        return {
          ...order,
          items,
          user: {
            id: user!.id,
            username: user!.username,
            email: user!.email,
            fullName: user!.fullName
          }
        };
      })
    );
  }

  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrderWithItems(id: number): Promise<OrderWithItems | undefined> {
    const order = await this.getOrder(id);
    if (!order) return undefined;

    const items = this.orderItems.get(id) || [];
    const user = await this.getUser(order.userId);

    return {
      ...order,
      items,
      user: {
        id: user!.id,
        username: user!.username,
        email: user!.email,
        fullName: user!.fullName
      }
    };
  }

  async getUserOrders(userId: number): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(
      (order) => order.userId === userId,
    );
  }

  async getUserOrdersWithItems(userId: number): Promise<OrderWithItems[]> {
    const orders = await this.getUserOrders(userId);
    return Promise.all(
      orders.map(async (order) => {
        const items = this.orderItems.get(order.id) || [];
        const user = await this.getUser(userId);
        return {
          ...order,
          items,
          user: {
            id: user!.id,
            username: user!.username,
            email: user!.email,
            fullName: user!.fullName
          }
        };
      })
    );
  }

  async createOrder(insertOrder: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    const id = this.orderCurrentId++;
    const order: Order = { ...insertOrder, id, createdAt: new Date() };
    this.orders.set(id, order);

    // Add order items
    const orderItems: OrderItem[] = items.map(item => {
      const itemId = this.orderItemCurrentId++;
      return { ...item, id: itemId, orderId: id };
    });
    this.orderItems.set(id, orderItems);

    // Update product stock
    for (const item of items) {
      await this.updateProductStock(item.productId, -item.quantity);
    }

    return order;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const order = await this.getOrder(id);
    if (!order) return undefined;

    const updatedOrder = { ...order, status };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  // Reviews
  async getProductReviews(productId: number): Promise<Review[]> {
    return Array.from(this.reviews.values()).filter(
      (review) => review.productId === productId,
    );
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const id = this.reviewCurrentId++;
    const review: Review = { ...insertReview, id, createdAt: new Date() };
    this.reviews.set(id, review);

    // Update product rating
    const product = await this.getProduct(insertReview.productId);
    if (product) {
      const reviews = await this.getProductReviews(product.id);
      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      const newRating = (totalRating / reviews.length).toFixed(1);

      await this.updateProduct(product.id, {
        rating: newRating,
        reviewCount: reviews.length
      });
    }

    return review;
  }

  async deleteReview(id: number): Promise<boolean> {
    const review = this.reviews.get(id);
    if (!review) return false;

    const success = this.reviews.delete(id);

    // Update product rating
    if (success) {
      const product = await this.getProduct(review.productId);
      if (product) {
        const reviews = await this.getProductReviews(product.id);
        const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
        const newRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : "0";

        await this.updateProduct(product.id, {
          rating: newRating,
          reviewCount: reviews.length
        });
      }
    }

    return success;
  }

  // Cart
  async getUserCart(userId?: number, sessionId?: string): Promise<CartItem[]> {
    if (!userId && !sessionId) {
      return [];
    }

    return Array.from(this.cartItems.values()).filter((item) => {
      if (userId && item.userId === userId) {
        return true;
      }
      if (sessionId && item.sessionId === sessionId) {
        return true;
      }
      return false;
    });
  }

  async getUserCartWithProducts(userId?: number, sessionId?: string): Promise<(CartItem & { product: Product })[]> {
    const cartItems = await this.getUserCart(userId, sessionId);
    return Promise.all(
      cartItems.map(async (item) => {
        const product = await this.getProduct(item.productId);
        return {
          ...item,
          product: product!
        };
      })
    );
  }

  async addToCart(insertCartItem: InsertCartItem): Promise<CartItem> {
    // Check if the product already exists in the cart
    const existingCartItem = Array.from(this.cartItems.values()).find(
      (item) => {
        // Match by userId if available
        if (insertCartItem.userId && item.userId === insertCartItem.userId && item.productId === insertCartItem.productId) {
          return true;
        }
        // Match by sessionId if available
        if (insertCartItem.sessionId && item.sessionId === insertCartItem.sessionId && item.productId === insertCartItem.productId) {
          return true;
        }
        return false;
      }
    );

    if (existingCartItem) {
      // Update quantity
      return this.updateCartItem(existingCartItem.id, existingCartItem.quantity + insertCartItem.quantity) as Promise<CartItem>;
    }

    // Add new item
    const id = this.cartItemCurrentId++;
    const cartItem: CartItem = { ...insertCartItem, id, createdAt: new Date() };
    this.cartItems.set(id, cartItem);
    return cartItem;
  }

  async updateCartItem(id: number, quantity: number): Promise<CartItem | undefined> {
    const cartItem = this.cartItems.get(id);
    if (!cartItem) return undefined;

    const updatedCartItem = { ...cartItem, quantity };
    this.cartItems.set(id, updatedCartItem);
    return updatedCartItem;
  }

  async removeFromCart(id: number): Promise<boolean> {
    return this.cartItems.delete(id);
  }

  async clearCart(userId?: number, sessionId?: string): Promise<boolean> {
    const cartItems = await this.getUserCart(userId, sessionId);
    cartItems.forEach(item => this.cartItems.delete(item.id));
    return true;
  }

  // Freight calculation
  async calculateFreight(postalCode: string, weight: number): Promise<FreightCalculationResponse> {
    // Simulate API call to a shipping service
    // In a real implementation, this would call an external API

    // Mock freight calculation based on postal code and weight
    const basePrice = Math.round(weight * 0.5 * 100) / 100; // 0.5 per gram

    // Different options based on weight and distance
    const options: FreightOption[] = [
      {
        name: "Econômico",
        price: basePrice + 12.90,
        estimatedDays: "5-7 dias úteis"
      },
      {
        name: "Padrão",
        price: basePrice + 24.90,
        estimatedDays: "2-3 dias úteis"
      }
    ];

    // Add overnight option for smaller items
    if (weight < 500) {
      options.push({
        name: "Expresso",
        price: basePrice + 39.90,
        estimatedDays: "1 dia útil"
      });
    }

    // Simulate a short delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      options,
      postalCode
    };
  }

  // Payment processing
  async createPaymentIntent(amount: number): Promise<PaymentIntent> {
    // In a real implementation, this would call an external payment gateway API
    // For now, we'll create a mock payment intent
    return {
      id: `pi_${Math.random().toString(36).substring(2, 15)}`,
      status: "pending",
      amount
    };
  }

  async processPayment(paymentId: string): Promise<PaymentIntent> {
    // In a real implementation, this would call an external payment gateway API
    // For now, we'll simulate a successful payment
    return {
      id: paymentId,
      status: "completed",
      amount: 0 // We don't know the amount at this point without storing it
    };
  }

  // Statistics for admin dashboard
  async getStats(): Promise<{ totalSales: number; totalOrders: number; newCustomers: number; lowStockProducts: number; }> {
    const orders = await this.getOrders();
    const users = Array.from(this.users.values());
    const products = await this.getProducts();

    // Calculate total sales from completed orders
    const totalSales = orders
      .filter(order => order.status === "completed" || order.status === "delivered")
      .reduce((sum, order) => sum + Number(order.total), 0);

    // Count total orders
    const totalOrders = orders.length;

    // Count new customers in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newCustomers = users
      .filter(user => user.role === "customer" && new Date(user.createdAt) >= thirtyDaysAgo)
      .length;

    // Count low stock products (less than 10 items)
    const lowStockProducts = products
      .filter(product => product.quantity < 10)
      .length;

    return {
      totalSales,
      totalOrders,
      newCustomers,
      lowStockProducts
    };
  }
}

// Export the MemStorage for testing or fallback if needed
export const memStorage = new MemStorage();

import { db } from "./db";
import { eq, and, desc, asc, sql, like, isNull, or } from "drizzle-orm";
import { users, categories, products, orders, orderItems, reviews, cartItems } from "../shared/schema";

export class DatabaseStorage implements IStorage {
  // USERS
  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // CATEGORIES
  async getCategories(): Promise<Category[]> {
    return db.select().from(categories);
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.slug, slug));
    return category;
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories).values(insertCategory).returning();
    return category;
  }

  async updateCategory(id: number, categoryData: Partial<InsertCategory>): Promise<Category | undefined> {
    const [updatedCategory] = await db
      .update(categories)
      .set(categoryData)
      .where(eq(categories.id, id))
      .returning();
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<boolean> {
    await db.delete(categories).where(eq(categories.id, id));
    return true;
  }

  // PRODUCTS
  async getProducts(options?: { categoryId?: number, featured?: boolean, visible?: boolean }): Promise<Product[]> {
    let query = db.select().from(products);

    if (options) {
      const conditions = [];

      if (options.categoryId !== undefined) {
        conditions.push(eq(products.categoryId, options.categoryId));
      }

      if (options.featured !== undefined) {
        conditions.push(eq(products.featured, options.featured));
      }

      if (options.visible !== undefined) {
        conditions.push(eq(products.visible, options.visible));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }

    return query;
  }

  async getProductsWithCategory(options?: { categoryId?: number, featured?: boolean, visible?: boolean }): Promise<ProductWithCategory[]> {
    const productsData = await this.getProducts(options);
    const results: ProductWithCategory[] = [];

    for (const product of productsData) {
      const category = await this.getCategory(product.categoryId);
      if (category) {
        results.push({
          ...product,
          category
        });
      }
    }

    return results;
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.slug, slug));
    return product;
  }

  async getProductWithCategory(id: number): Promise<ProductWithCategory | undefined> {
    const product = await this.getProduct(id);
    if (!product) return undefined;

    const category = await this.getCategory(product.categoryId);
    if (!category) return undefined;

    return {
      ...product,
      category
    };
  }

  async getProductWithCategoryBySlug(slug: string): Promise<ProductWithCategory | undefined> {
    const product = await this.getProductBySlug(slug);
    if (!product) return undefined;

    const category = await this.getCategory(product.categoryId);
    if (!category) return undefined;

    return {
      ...product,
      category
    };
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(insertProduct).returning();
    return product;
  }

  async updateProduct(id: number, productData: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updatedProduct] = await db
      .update(products)
      .set(productData)
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    await db.delete(products).where(eq(products.id, id));
    return true;
  }

  async updateProductStock(id: number, quantityChange: number): Promise<Product | undefined> {
    const product = await this.getProduct(id);
    if (!product) return undefined;

    const newQuantity = product.quantity + quantityChange;
    if (newQuantity < 0) return undefined;

    return this.updateProduct(id, { quantity: newQuantity });
  }

  // ORDERS
  async getOrders(): Promise<Order[]> {
    return db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getOrdersWithItems(): Promise<OrderWithItems[]> {
    const ordersData = await this.getOrders();
    const results: OrderWithItems[] = [];

    for (const order of ordersData) {
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
      const user = await this.getUser(order.userId);

      if (user) {
        results.push({
          ...order,
          items,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            fullName: user.fullName || undefined
          }
        });
      }
    }

    return results;
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getOrderWithItems(id: number): Promise<OrderWithItems | undefined> {
    const order = await this.getOrder(id);
    if (!order) return undefined;

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
    const user = await this.getUser(order.userId);

    if (!user) return undefined;

    return {
      ...order,
      items,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName || undefined
      }
    };
  }

  async getUserOrders(userId: string | number): Promise<Order[]> {
    const userIdNum = typeof userId === 'string' ? parseInt(userId) : userId;
    return db.select().from(orders).where(eq(orders.userId, userIdNum)).orderBy(desc(orders.createdAt));
  }

  async getOrderById(orderId: string | number): Promise<any> {
    try {
      const orderIdNum = typeof orderId === 'string' ? parseInt(orderId) : orderId;

      // Buscar o pedido
      const order = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderIdNum))
        .limit(1);

      if (order.length === 0) {
        return null;
      }

      // Buscar os itens do pedido
      const items = await db
        .select({
          id: orderItems.id,
          productId: orderItems.productId,
          quantity: orderItems.quantity,
          price: orderItems.price,
          product: {
            id: products.id,
            name: products.name,
            price: products.price,
            images: products.images
          }
        })
        .from(orderItems)
        .leftJoin(products, eq(orderItems.productId, products.id))
        .where(eq(orderItems.orderId, orderIdNum));

      // Retornar o pedido com os itens
      return {
        ...order[0],
        items
      };
    } catch (error) {
      console.error('Error getting order by ID:', error);
      throw error;
    }
  }

  async getUserOrdersWithItems(userId: number): Promise<OrderWithItems[]> {
    const ordersData = await this.getUserOrders(userId);
    const results: OrderWithItems[] = [];

    for (const order of ordersData) {
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
      const user = await this.getUser(userId);

      if (user) {
        results.push({
          ...order,
          items,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            fullName: user.fullName || undefined
          }
        });
      }
    }

    return results;
  }

  async createOrder(orderData: any): Promise<any> {
    try {
      // Inserir o pedido
      const [newOrder] = await db
        .insert(orders)
        .values({
          userId: typeof orderData.userId === 'string' ? parseInt(orderData.userId) : orderData.userId,
          status: orderData.status || 'pending',
          shippingAddress: orderData.shippingAddress,
          shippingMethod: orderData.shippingMethod,
          payment: orderData.payment,
          subtotal: orderData.subtotal,
          shippingCost: orderData.shippingCost,
          total: orderData.total,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      // Inserir os itens do pedido
      const orderItemsData = orderData.items.map((item: any) => ({
        orderId: newOrder.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      const items = await db
        .insert(orderItems)
        .values(orderItemsData)
        .returning();

      // Atualizar estoque dos produtos
      for (const item of orderData.items) {
        await this.updateProductStock(item.productId, -item.quantity);
      }

      // Retornar o pedido com os itens
      return {
        ...newOrder,
        items
      };
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  // REVIEWS
  async getProductReviews(productId: number): Promise<Review[]> {
    return db.select().from(reviews).where(eq(reviews.productId, productId)).orderBy(desc(reviews.createdAt));
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const [review] = await db.insert(reviews).values(insertReview).returning();

    // Update product rating
    const productReviews = await this.getProductReviews(insertReview.productId);
    if (productReviews.length > 0) {
      const totalRating = productReviews.reduce((sum, review) => sum + review.rating, 0);
      const avgRating = (totalRating / productReviews.length).toFixed(1);

      await this.updateProduct(insertReview.productId, {
        rating: avgRating,
        reviewCount: productReviews.length
      } as any);
    }

    return review;
  }

  async deleteReview(id: number): Promise<boolean> {
    const [review] = await db.select().from(reviews).where(eq(reviews.id, id));
    if (!review) return false;

    await db.delete(reviews).where(eq(reviews.id, id));

    // Update product rating
    const productReviews = await this.getProductReviews(review.productId);
    if (productReviews.length > 0) {
      const totalRating = productReviews.reduce((sum, review) => sum + review.rating, 0);
      const avgRating = (totalRating / productReviews.length).toFixed(1);

      await this.updateProduct(review.productId, {
        rating: avgRating,
        reviewCount: productReviews.length
      } as any);
    } else {
      await this.updateProduct(review.productId, {
        rating: "0.0",
        reviewCount: 0
      } as any);
    }

    return true;
  }

  // CART
  async getUserCart(userId?: number, sessionId?: string): Promise<CartItem[]> {
    if (userId) {
      return db.select().from(cartItems).where(eq(cartItems.userId, userId));
    } else if (sessionId) {
      return db.select().from(cartItems).where(eq(cartItems.sessionId, sessionId));
    } else {
      return [];
    }
  }

  // WISHLIST
  async getUserWishlist(userId: number): Promise<WishlistItem[]> {
    return db.select().from(wishlistItems).where(eq(wishlistItems.userId, userId));
  }

  async getUserWishlistWithProducts(userId: number): Promise<(WishlistItem & { product: Product })[]> {
    const wishlistItemsData = await this.getUserWishlist(userId);
    const results: (WishlistItem & { product: Product })[] = [];

    for (const item of wishlistItemsData) {
      const product = await this.getProduct(item.productId);
      if (product) {
        results.push({
          ...item,
          product: {
            ...product,
            images: ensureImagesArray(product.images)
          }
        });
      }
    }

    return results;
  }

  async addToWishlist(insertWishlistItem: InsertWishlistItem): Promise<WishlistItem> {
    // Check if item already exists in wishlist
    const [existingItem] = await db
      .select()
      .from(wishlistItems)
      .where(
        and(
          eq(wishlistItems.userId, insertWishlistItem.userId),
          eq(wishlistItems.productId, insertWishlistItem.productId)
        )
      );

    if (existingItem) {
      // Item already exists, return it
      return existingItem;
    } else {
      // Add new item
      const [wishlistItem] = await db.insert(wishlistItems).values(insertWishlistItem).returning();
      return wishlistItem;
    }
  }

  async removeFromWishlist(id: number): Promise<boolean> {
    await db.delete(wishlistItems).where(eq(wishlistItems.id, id));
    return true;
  }

  async isProductInWishlist(userId: number, productId: number): Promise<boolean> {
    const [existingItem] = await db
      .select()
      .from(wishlistItems)
      .where(
        and(
          eq(wishlistItems.userId, userId),
          eq(wishlistItems.productId, productId)
        )
      );

    return !!existingItem;
  }

  async getUserCartWithProducts(userId?: number, sessionId?: string): Promise<(CartItem & { product: Product })[]> {
    const cartItemsData = await this.getUserCart(userId, sessionId);
    const results: (CartItem & { product: Product })[] = [];

    for (const item of cartItemsData) {
      const product = await this.getProduct(item.productId);
      if (product) {
        results.push({
          ...item,
          product: {
            ...product,
            images: ensureImagesArray(product.images)
          }
        });
      }
    }

    return results;
  }

  async addToCart(insertCartItem: InsertCartItem): Promise<CartItem> {
    // Check if item already exists in cart
    let existingItem: CartItem | undefined;

    if (insertCartItem.userId) {
      [existingItem] = await db
        .select()
        .from(cartItems)
        .where(
          and(
            eq(cartItems.userId, insertCartItem.userId),
            eq(cartItems.productId, insertCartItem.productId)
          )
        );
    } else if (insertCartItem.sessionId) {
      [existingItem] = await db
        .select()
        .from(cartItems)
        .where(
          and(
            eq(cartItems.sessionId, insertCartItem.sessionId),
            eq(cartItems.productId, insertCartItem.productId)
          )
        );
    }

    if (existingItem) {
      // Update quantity
      const [updatedItem] = await db
        .update(cartItems)
        .set({ quantity: existingItem.quantity + insertCartItem.quantity })
        .where(eq(cartItems.id, existingItem.id))
        .returning();
      return updatedItem;
    } else {
      // Add new item
      const [cartItem] = await db.insert(cartItems).values(insertCartItem).returning();
      return cartItem;
    }
  }

  async updateCartItem(id: number, quantity: number): Promise<CartItem | undefined> {
    if (quantity <= 0) {
      await db.delete(cartItems).where(eq(cartItems.id, id));
      return undefined;
    }

    const [updatedItem] = await db
      .update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, id))
      .returning();
    return updatedItem;
  }

  async removeFromCart(id: number): Promise<boolean> {
    await db.delete(cartItems).where(eq(cartItems.id, id));
    return true;
  }

  async clearCart(userId?: number, sessionId?: string): Promise<boolean> {
    if (userId) {
      await db.delete(cartItems).where(eq(cartItems.userId, userId));
    } else if (sessionId) {
      await db.delete(cartItems).where(eq(cartItems.sessionId, sessionId));
    }
    return true;
  }

  // FREIGHT CALCULATION
  async calculateFreight(postalCode: string, weight: number): Promise<FreightCalculationResponse> {
    // Import the shipping calculation function from our shipping module
    const { calculateShipping } = await import('./shipping');

    // Calculate shipping options based on weight and postal code
    return await calculateShipping(weight, postalCode);
  }

  // PAYMENT PROCESSING
  async createPaymentIntent(amount: number): Promise<PaymentIntent> {
    // Aqui vamos simular a criação de uma intenção de pagamento
    // Em um ambiente real, isso chamaria uma API externa como PerfectPay
    return {
      id: `pi_${Date.now()}`,
      status: "pending",
      amount
    };
  }

  async processPayment(paymentId: string): Promise<PaymentIntent> {
    // Aqui vamos simular o processamento de um pagamento
    // Em um ambiente real, isso chamaria uma API externa como PerfectPay
    return {
      id: paymentId,
      status: "completed",
      amount: 0 // Na API real, isso seria obtido do pagamento
    };
  }

  // ADMIN DASHBOARD STATS
  async getStats(): Promise<{ totalSales: number; totalOrders: number; newCustomers: number; lowStockProducts: number; }> {
    // Total de vendas
    const completedOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.status, "completed"));

    const totalSales = completedOrders.reduce((sum, order) => {
      return sum + parseFloat(order.total);
    }, 0);

    // Total de pedidos
    const totalOrders = await db
      .select({ count: sql`count(*)` })
      .from(orders);

    // Novos clientes (últimos 30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newCustomers = await db
      .select({ count: sql`count(*)` })
      .from(users)
      .where(sql`${users.createdAt} >= ${thirtyDaysAgo}`);

    // Produtos com estoque baixo (menos de 10 unidades)
    const lowStockProducts = await db
      .select({ count: sql`count(*)` })
      .from(products)
      .where(sql`${products.quantity} < 10`);

    return {
      totalSales,
      totalOrders: Number(totalOrders[0]?.count || 0),
      newCustomers: Number(newCustomers[0]?.count || 0),
      lowStockProducts: Number(lowStockProducts[0]?.count || 0)
    };
  }

  // Métodos para gerenciar endereços de usuários

  async getUserAddress(userId: string) {
    try {
      // Buscar endereço do usuário no banco de dados
      const userAddresses = await db
        .select()
        .from(addresses)
        .where(eq(addresses.userId, parseInt(userId)));

      return userAddresses[0] || null;
    } catch (error) {
      console.error('Error getting user address:', error);
      throw error;
    }
  }

  async saveUserAddress(userId: string, addressData: any) {
    try {
      // Verificar se o usuário já tem um endereço
      const existingAddress = await this.getUserAddress(userId);

      if (existingAddress) {
        // Atualizar endereço existente
        const updatedAddress = await db
          .update(addresses)
          .set({
            postalCode: addressData.postalCode,
            street: addressData.street,
            number: addressData.number || '',
            complement: addressData.complement || '',
            district: addressData.district,
            city: addressData.city,
            state: addressData.state,
            country: addressData.country || 'Brasil',
            updatedAt: new Date()
          })
          .where(eq(addresses.id, existingAddress.id))
          .returning();

        return updatedAddress[0];
      } else {
        // Criar novo endereço
        const newAddress = await db
          .insert(addresses)
          .values({
            userId: parseInt(userId),
            postalCode: addressData.postalCode,
            street: addressData.street,
            number: addressData.number || '',
            complement: addressData.complement || '',
            district: addressData.district,
            city: addressData.city,
            state: addressData.state,
            country: addressData.country || 'Brasil',
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning();

        return newAddress[0];
      }
    } catch (error) {
      console.error('Error saving user address:', error);
      throw error;
    }
  }

  // Métodos para gerenciar o perfil do usuário

  async getUserProfile(userId: string) {
    try {
      const user = await db
        .select({
          id: users.id,
          username: users.username,
          name: users.name,
          email: users.email,
          phone: users.phone,
          cpf: users.cpf,
          birthdate: users.birthdate,
          role: users.role,
          // Campos de endereço
          address: users.address,
          address_number: users.addressNumber,
          address_complement: users.addressComplement,
          district: users.district,
          city: users.city,
          state: users.state,
          postal_code: users.postalCode,
          country: users.country,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt
        })
        .from(users)
        .where(eq(users.id, parseInt(userId)))
        .limit(1);

      // Se não encontrou o usuário, retornar um objeto vazio com os campos necessários
      if (!user[0]) {
        console.log(`Usuário não encontrado: ${userId}`);
        return {
          id: parseInt(userId),
          username: '',
          name: '',
          email: '',
          phone: '',
          cpf: '',
          birthdate: null,
          role: 'customer',
          address: '',
          address_number: '',
          address_complement: '',
          district: '',
          city: '',
          state: '',
          postal_code: '',
          country: 'Brasil',
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }

      return user[0];
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  async updateUserProfile(userId: string, profileData: any) {
    try {
      // Verificar se o e-mail já está em uso por outro usuário
      if (profileData.email) {
        const existingUser = await db
          .select()
          .from(users)
          .where(and(
            eq(users.email, profileData.email),
            ne(users.id, parseInt(userId))
          ));

        if (existingUser.length > 0) {
          throw new Error('Este e-mail já está em uso por outro usuário');
        }
      }

      // Preparar os dados para atualização
      const updateData: any = {
        // Dados pessoais
        email: profileData.email,
        phone: profileData.phone || null,
        cpf: profileData.cpf || null,
        birthdate: profileData.birthdate ? new Date(profileData.birthdate) : null,
      };

      // Adicionar nome se fornecido
      if (profileData.name) {
        updateData.name = profileData.name;
      } else if (profileData.fullName) {
        updateData.fullName = profileData.fullName;
      }

      // Adicionar campos de endereço se fornecidos
      if (profileData.address) updateData.address = profileData.address;
      if (profileData.address_number) updateData.addressNumber = profileData.address_number;
      if (profileData.address_complement) updateData.addressComplement = profileData.address_complement;
      if (profileData.district) updateData.district = profileData.district;
      if (profileData.city) updateData.city = profileData.city;
      if (profileData.state) updateData.state = profileData.state;
      if (profileData.postal_code) updateData.postalCode = profileData.postal_code;
      if (profileData.country) updateData.country = profileData.country;

      // Atualizar perfil do usuário
      const updatedUser = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, parseInt(userId)))
        .returning();

      console.log('Perfil do usuário atualizado com sucesso:', updatedUser[0]);
      return updatedUser[0];
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  async validateUserPassword(userId: string, password: string) {
    try {
      const user = await db
        .select({
          password: users.password
        })
        .from(users)
        .where(eq(users.id, parseInt(userId)))
        .limit(1);

      if (!user[0]) {
        return false;
      }

      // Verificar senha usando bcrypt
      const isValid = await bcrypt.compare(password, user[0].password);
      return isValid;
    } catch (error) {
      console.error('Error validating user password:', error);
      throw error;
    }
  }

  async updateUserPassword(userId: string, newPassword: string) {
    try {
      // Hash da nova senha
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Atualizar senha do usuário
      await db
        .update(users)
        .set({
          password: hashedPassword,
          updatedAt: new Date()
        })
        .where(eq(users.id, parseInt(userId)));

      return true;
    } catch (error) {
      console.error('Error updating user password:', error);
      throw error;
    }
  }
}

// Use DatabaseStorage instead of MemStorage
export const storage = new DatabaseStorage();
