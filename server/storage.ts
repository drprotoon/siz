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
// import { convertToTyped, convertArrayToTyped } from "./types-fix"; // Removido
import { users, categories, products, orders, orderItems, reviews, cartItems, wishlistItems, addresses } from "@shared/schema";
import bcrypt from "bcrypt";
import axios from "axios";

// Define Setting types locally to avoid import issues
type Setting = {
  id: number;
  key: string;
  value: string | null;
  description: string | null;
  category: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

type InsertSetting = {
  key: string;
  value?: string;
  description?: string;
  category?: string;
};

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
  getProducts(options?: { categoryId?: number, featured?: boolean, visible?: boolean, bestSeller?: boolean, newArrival?: boolean }): Promise<Product[]>;
  getProductsWithCategory(options?: { categoryId?: number, featured?: boolean, visible?: boolean, bestSeller?: boolean, newArrival?: boolean }): Promise<ProductWithCategory[]>;
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

  // AbacatePay integration
  createAbacatePayment(data: {
    amount: number;
    orderId: number;
    customerInfo?: any;
    userId: number;
  }): Promise<any>;
  getAbacatePaymentStatus(paymentId: string): Promise<string>;
  handleAbacatePaymentPaid(data: any): Promise<void>;
  handleAbacatePaymentFailed(data: any): Promise<void>;

  // Statistics for admin dashboard
  getStats(): Promise<{
    totalSales: number,
    totalOrders: number,
    newCustomers: number,
    lowStockProducts: number
  }>;

  // Settings
  getSetting(key: string): Promise<string | null>;
  setSetting(key: string, value: string, description?: string, category?: string): Promise<void>;
  getSettingsByCategory(category: string): Promise<{ key: string; value: string; description?: string }[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private products: Map<number, Product>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem[]>;
  private reviews: Map<number, Review>;
  private cartItems: Map<number, CartItem>;
  private settings: Map<string, Setting>;

  private userCurrentId: number;
  private categoryCurrentId: number;
  private productCurrentId: number;
  private orderCurrentId: number;
  private orderItemCurrentId: number;
  private reviewCurrentId: number;
  private cartItemCurrentId: number;
  private settingCurrentId: number;

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.products = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.reviews = new Map();
    this.cartItems = new Map();
    this.settings = new Map();

    this.userCurrentId = 1;
    this.categoryCurrentId = 1;
    this.productCurrentId = 1;
    this.orderCurrentId = 1;
    this.orderItemCurrentId = 1;
    this.reviewCurrentId = 1;
    this.cartItemCurrentId = 1;
    this.settingCurrentId = 1;

    // Initialize with some data
    this.initializeData().catch(err => {
      console.error("Error initializing data:", err);
    });

    // Initialize default settings
    this.initializeSettings();
  }

  private initializeSettings(): void {
    // Default Frenet settings
    const defaultSettings: Setting[] = [
      {
        id: this.settingCurrentId++,
        key: 'frenet_api_token',
        value: '13B9E436RD32DR455ERAC99R93357F8D6640',
        description: 'Token da API da Frenet',
        category: 'frenet',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.settingCurrentId++,
        key: 'frenet_seller_cep',
        value: '74591990',
        description: 'CEP de origem para cálculo de frete',
        category: 'frenet',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.settingCurrentId++,
        key: 'frenet_enabled',
        value: 'true',
        description: 'Habilitar integração com Frenet',
        category: 'frenet',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.settingCurrentId++,
        key: 'store_phone',
        value: '',
        description: 'Telefone da loja',
        category: 'general',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.settingCurrentId++,
        key: 'abacatepay_api_key',
        value: '',
        description: 'Chave da API do AbacatePay',
        category: 'pix',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.settingCurrentId++,
        key: 'abacatepay_api_url',
        value: 'https://api.abacatepay.com',
        description: 'URL da API do AbacatePay',
        category: 'pix',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.settingCurrentId++,
        key: 'abacatepay_webhook_secret',
        value: '',
        description: 'Chave secreta para validar webhooks',
        category: 'pix',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.settingCurrentId++,
        key: 'webhook_base_url',
        value: '',
        description: 'URL base para webhooks',
        category: 'pix',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.settingCurrentId++,
        key: 'pix_enabled',
        value: 'true',
        description: 'Habilitar pagamentos PIX',
        category: 'pix',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.settingCurrentId++,
        key: 'free_shipping_threshold',
        value: '150',
        description: 'Valor mínimo para frete grátis (em reais)',
        category: 'shipping',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    defaultSettings.forEach(setting => {
      this.settings.set(setting.key, setting);
    });
  }

  private async initializeData() {
    // Create admin user
    await this.createUser({
      username: "admin",
      password: "$2b$10$jBtI6O6SlxZR4lzCE3j3T.OVEXzp6kTctd.KNysCj5Uc3GWdV13vG", // "admin123"
      email: "admin@beautyessence.com",
      role: "admin"
    });

    // Create categories
    const skincare = await this.createCategory({
      name: "Skincare",
      slug: "skincare",
      description: "Products to keep your skin healthy and glowing",
      imageUrl: "https://images.unsplash.com/photo-1570194065650-d99fb4cb7300"
    });

    const makeup = await this.createCategory({
      name: "Makeup",
      slug: "makeup",
      description: "Cosmetics to enhance your natural beauty",
      imageUrl: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9"
    });

    const haircare = await this.createCategory({
      name: "Haircare",
      slug: "haircare",
      description: "Products to keep your hair healthy and beautiful",
      imageUrl: "https://pixabay.com/get/g5ae87dd5119a8c4ac755124765852ad4db4dbfaeeac7458b3c2430be9eb639a536c26198fd7de142aea82305bbab4902f71988fdddfd242632ca7daa772e6fed_1280.jpg"
    });

    // Fragrance category (not used in products)
    await this.createCategory({
      name: "Fragrance",
      slug: "fragrance",
      description: "Scents that leave a lasting impression",
      imageUrl: "https://images.unsplash.com/photo-1600612253971-422e7f7faeb6"
    });

    // Create products
    // Skincare products
    await this.createProduct({
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

    await this.createProduct({
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
    await this.createProduct({
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
    await this.createProduct({
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
    const user: User = {
      id,
      createdAt: new Date(),
      username: insertUser.username,
      password: insertUser.password,
      email: insertUser.email,
      name: insertUser.name || null,
      fullName: insertUser.fullName || null,
      address: insertUser.address || null,
      addressNumber: insertUser.addressNumber || null,
      addressComplement: insertUser.addressComplement || null,
      district: insertUser.district || null,
      city: insertUser.city || null,
      state: insertUser.state || null,
      postalCode: insertUser.postalCode || null,
      country: insertUser.country || null,
      phone: insertUser.phone || null,
      cpf: insertUser.cpf || null,
      birthdate: insertUser.birthdate || null,
      role: insertUser.role || "customer",
      updatedAt: insertUser.updatedAt || new Date()
    };
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
    const category: Category = {
      id,
      name: insertCategory.name,
      slug: insertCategory.slug,
      description: insertCategory.description || null,
      imageUrl: insertCategory.imageUrl || null,
      parentId: insertCategory.parentId || null,
      order: insertCategory.order || null
    };
    this.categories.set(id, category);
    return category as any;
  }

  async updateCategory(id: number, categoryData: Partial<InsertCategory>): Promise<Category | undefined> {
    const category = await this.getCategory(id);
    if (!category) return undefined;

    const updatedCategory = { ...category, ...categoryData };
    this.categories.set(id, updatedCategory);
    return updatedCategory as any;
  }

  async deleteCategory(id: number): Promise<boolean> {
    return this.categories.delete(id);
  }

  // Products
  async getProducts(options?: { categoryId?: number, featured?: boolean, visible?: boolean, bestSeller?: boolean, newArrival?: boolean }): Promise<Product[]> {
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
      if (options.bestSeller !== undefined) {
        products = products.filter(p => p.bestSeller === options.bestSeller);
      }
      if (options.newArrival !== undefined) {
        products = products.filter(p => p.newArrival === options.newArrival);
      }
    }

    return products;
  }

  async getProductsWithCategory(options?: { categoryId?: number, featured?: boolean, visible?: boolean, bestSeller?: boolean, newArrival?: boolean }): Promise<ProductWithCategory[]> {
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
      id,
      name: insertProduct.name,
      slug: insertProduct.slug,
      description: insertProduct.description || null,
      createdAt: new Date(),
      price: insertProduct.price,
      compareAtPrice: insertProduct.compareAtPrice || null,
      sku: insertProduct.sku,
      weight: insertProduct.weight,
      quantity: insertProduct.quantity || 0,
      categoryId: insertProduct.categoryId,
      images: insertProduct.images || null,
      ingredients: insertProduct.ingredients || null,
      howToUse: insertProduct.howToUse || null,
      visible: insertProduct.visible || false,
      featured: insertProduct.featured || false,
      newArrival: insertProduct.newArrival || false,
      bestSeller: insertProduct.bestSeller || false,
      rating: "0",
      reviewCount: 0
    };
    this.products.set(id, product);
    return product as any;
  }

  async updateProduct(id: number, productData: Partial<InsertProduct>): Promise<Product | undefined> {
    const product = await this.getProduct(id);
    if (!product) return undefined;

    const updatedProduct = { ...product, ...productData };
    this.products.set(id, updatedProduct);
    return updatedProduct as any;
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
    return updatedProduct as any;
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
            fullName: user!.fullName || undefined
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
        fullName: user!.fullName || undefined
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
            fullName: user!.fullName || undefined
          }
        };
      })
    );
  }

  async createOrder(insertOrder: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    const id = this.orderCurrentId++;
    const order: Order = {
      id,
      createdAt: new Date(),
      userId: insertOrder.userId,
      status: insertOrder.status || "pending",
      total: insertOrder.total,
      shippingAddress: insertOrder.shippingAddress,
      shippingCity: insertOrder.shippingCity,
      shippingState: insertOrder.shippingState,
      shippingPostalCode: insertOrder.shippingPostalCode,
      shippingCountry: insertOrder.shippingCountry,
      shippingMethod: insertOrder.shippingMethod || null,
      shippingCost: insertOrder.shippingCost || null,
      paymentMethod: insertOrder.paymentMethod || null,
      paymentId: insertOrder.paymentId || null
    };
    this.orders.set(id, order);

    // Add order items
    const orderItems: any[] = items.map(item => {
      const itemId = this.orderItemCurrentId++;
      return { ...item, id: itemId, orderId: id };
    });
    this.orderItems.set(id, orderItems);

    // Update product stock
    for (const item of items) {
      await this.updateProductStock(item.productId, -item.quantity);
    }

    return order as any;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const order = await this.getOrder(id);
    if (!order) return undefined;

    const updatedOrder = { ...order, status };
    this.orders.set(id, updatedOrder);
    return updatedOrder as any;
  }

  // Reviews
  async getProductReviews(productId: number): Promise<Review[]> {
    return Array.from(this.reviews.values()).filter(
      (review) => review.productId === productId,
    );
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const id = this.reviewCurrentId++;
    const review: Review = {
      id,
      createdAt: new Date(),
      rating: insertReview.rating,
      userId: insertReview.userId,
      productId: insertReview.productId,
      title: insertReview.title || null,
      comment: insertReview.comment || null
    };
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
          rating: sql`${newRating}`,
          reviewCount: reviews.length
        } as any);
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
    const cartItem: CartItem = {
      id,
      createdAt: new Date(),
      quantity: insertCartItem.quantity,
      productId: insertCartItem.productId,
      userId: insertCartItem.userId || null,
      sessionId: insertCartItem.sessionId || null
    };
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

  // Freight calculation - delegated to shipping service
  async calculateFreight(postalCode: string, weight: number): Promise<FreightCalculationResponse> {
    // Import the shipping calculation function from our shipping module
    const { calculateShipping } = await import('./shipping');

    // Calculate shipping options based on weight and postal code
    return await calculateShipping(weight, postalCode);
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

  // AbacatePay integration (stub methods for MemStorage)
  async createAbacatePayment(data: {
    amount: number;
    orderId: number;
    customerInfo?: any;
    userId: number;
  }): Promise<any> {
    // Simulate AbacatePay response for testing
    const mockPaymentId = `pix_${Date.now()}`;
    const mockPixCode = "00020126580014br.gov.bcb.pix013614d9d0b7-f8a4-4e8a-9b2c-1a3b4c5d6e7f8g5204000053039865802BR5925LOJA TESTE ABACATEPAY6009SAO PAULO62070503***6304A1B2";

    return {
      id: mockPaymentId,
      qrCode: `data:image/svg+xml;base64,${btoa('<svg>Mock QR Code</svg>')}`,
      qrCodeText: mockPixCode,
      amount: data.amount,
      status: 'pending',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes
    };
  }

  async getAbacatePaymentStatus(paymentId: string): Promise<string> {
    // Simulate payment status check
    return 'pending';
  }

  async handleAbacatePaymentPaid(data: any): Promise<void> {
    // Simulate payment confirmation
    console.log('Mock payment confirmation:', data);
  }

  async handleAbacatePaymentFailed(data: any): Promise<void> {
    // Simulate payment failure
    console.log('Mock payment failure:', data);
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
      .filter(user => user.role === "customer" && user.createdAt && new Date(user.createdAt) >= thirtyDaysAgo)
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

  // Settings methods
  async getSetting(key: string): Promise<string | null> {
    const setting = this.settings.get(key);
    return setting?.value || null;
  }

  async setSetting(key: string, value: string, description?: string, category?: string): Promise<void> {
    const existingSetting = this.settings.get(key);

    if (existingSetting) {
      // Update existing setting
      const updatedSetting: Setting = {
        ...existingSetting,
        value,
        description: description || existingSetting.description,
        category: category || existingSetting.category,
        updatedAt: new Date()
      };
      this.settings.set(key, updatedSetting);
    } else {
      // Create new setting
      const newSetting: Setting = {
        id: this.settingCurrentId++,
        key,
        value,
        description: description || null,
        category: category || 'general',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.settings.set(key, newSetting);
    }
  }

  async getSettingsByCategory(category: string): Promise<{ key: string; value: string; description?: string }[]> {
    const results: { key: string; value: string; description?: string }[] = [];

    for (const setting of this.settings.values()) {
      if (setting.category === category) {
        results.push({
          key: setting.key,
          value: setting.value || '',
          description: setting.description || undefined
        });
      }
    }

    return results;
  }
}

// Export the MemStorage for testing or fallback if needed
export const memStorage = new MemStorage();

export class DatabaseStorage implements IStorage {
  // USERS
  async getUsers(): Promise<User[]> {
    return await db.select().from(users) as User[];
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user as User;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user as User;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user as User;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning() as User[];
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser as User;
  }

  // CATEGORIES
  async getCategories(): Promise<Category[]> {
    const result = await db.select().from(categories);
    return result as Category[];
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category as any;
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.slug, slug));
    return category as any;
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories).values(insertCategory).returning() as any[];
    return category as any;
  }

  async updateCategory(id: number, categoryData: Partial<InsertCategory>): Promise<Category | undefined> {
    const [updatedCategory] = await db
      .update(categories)
      .set(categoryData)
      .where(eq(categories.id, id))
      .returning();
    return updatedCategory as any;
  }

  async deleteCategory(id: number): Promise<boolean> {
    await db.delete(categories).where(eq(categories.id, id));
    return true;
  }

  // PRODUCTS
  async getProducts(options?: { categoryId?: number, featured?: boolean, visible?: boolean, bestSeller?: boolean, newArrival?: boolean }): Promise<Product[]> {
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

      if (options.bestSeller !== undefined) {
        conditions.push(eq(products.bestSeller, options.bestSeller));
      }

      if (options.newArrival !== undefined) {
        conditions.push(eq(products.newArrival, options.newArrival));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }
    }

    return query as any;
  }

  async getProductsWithCategory(options?: { categoryId?: number, featured?: boolean, visible?: boolean, bestSeller?: boolean, newArrival?: boolean }): Promise<ProductWithCategory[]> {
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
    return product as any;
  }

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.slug, slug));
    return product as any;
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
    const [product] = await db.insert(products).values(insertProduct).returning() as any[];
    return product as any;
  }

  async updateProduct(id: number, productData: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updatedProduct] = await db
      .update(products)
      .set(productData)
      .where(eq(products.id, id))
      .returning();
    return updatedProduct as any;
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
    return db.select().from(orders).orderBy(desc(orders.createdAt)) as any;
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
    return order as any;
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
    return db.select().from(orders).where(eq(orders.userId, userIdNum)).orderBy(desc(orders.createdAt)) as any;
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
      const [newOrder] = (await db
        .insert(orders)
        .values({
          userId: typeof orderData.userId === 'string' ? parseInt(orderData.userId) : orderData.userId,
          status: orderData.status || 'pending',
          shippingAddress: orderData.shippingAddress,
          shippingCity: orderData.shippingCity || '',
          shippingState: orderData.shippingState || '',
          shippingPostalCode: orderData.shippingPostalCode || '',
          shippingCountry: orderData.shippingCountry || 'Brasil',
          shippingMethod: orderData.shippingMethod,
          paymentMethod: orderData.payment,
          shippingCost: orderData.shippingCost,
          total: orderData.total,
          paymentId: null
        })
        .returning()) as any[];

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
    return updatedOrder as any;
  }

  // REVIEWS
  async getProductReviews(productId: number): Promise<Review[]> {
    return db.select().from(reviews).where(eq(reviews.productId, productId)).orderBy(desc(reviews.createdAt)) as any;
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const [review] = (await db.insert(reviews).values(insertReview).returning()) as any[];

    // Update product rating
    const productReviews = await this.getProductReviews(insertReview.productId);
    if (productReviews.length > 0) {
      const totalRating = productReviews.reduce((sum, review) => sum + review.rating, 0);
      const avgRating = (totalRating / productReviews.length).toFixed(1);

      await this.updateProduct(insertReview.productId, {
        rating: avgRating,
        reviewCount: productReviews.length
      });
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
      });
    } else {
      await this.updateProduct(review.productId, {
        rating: "0.0",
        reviewCount: 0
      });
    }

    return true;
  }

  // CART
  async getUserCart(userId?: number, sessionId?: string): Promise<CartItem[]> {
    if (userId) {
      return db.select().from(cartItems).where(eq(cartItems.userId, userId)) as any;
    } else if (sessionId) {
      return db.select().from(cartItems).where(eq(cartItems.sessionId, sessionId)) as any;
    } else {
      return [];
    }
  }

  // WISHLIST
  async getUserWishlist(userId: number): Promise<WishlistItem[]> {
    return db.select().from(wishlistItems).where(eq(wishlistItems.userId, userId)) as any;
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
      return existingItem as any;
    } else {
      // Add new item
      const [wishlistItem] = (await db.insert(wishlistItems).values(insertWishlistItem).returning()) as any[];
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
      [existingItem] = (await db
        .select()
        .from(cartItems)
        .where(
          and(
            eq(cartItems.userId, insertCartItem.userId),
            eq(cartItems.productId, insertCartItem.productId)
          )
        )) as any;
    } else if (insertCartItem.sessionId) {
      [existingItem] = (await db
        .select()
        .from(cartItems)
        .where(
          and(
            eq(cartItems.sessionId, insertCartItem.sessionId),
            eq(cartItems.productId, insertCartItem.productId)
          )
        )) as any;
    }

    if (existingItem) {
      // Update quantity
      const [updatedItem] = await db
        .update(cartItems)
        .set({ quantity: existingItem.quantity + insertCartItem.quantity })
        .where(eq(cartItems.id, existingItem.id))
        .returning();
      return updatedItem as any;
    } else {
      // Add new item
      const [cartItem] = await db.insert(cartItems).values(insertCartItem).returning() as any[];
      return cartItem as any;
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
    return updatedItem as any;
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

  // ABACATEPAY INTEGRATION
  async createAbacatePayment(data: {
    amount: number;
    orderId: number;
    customerInfo?: any;
    userId: number;
  }): Promise<any> {
    try {
      const abacatePayApiUrl = process.env.ABACATEPAY_API_URL || 'https://api.abacatepay.com';
      const abacatePayApiKey = process.env.ABACATEPAY_API_KEY;

      if (!abacatePayApiKey) {
        throw new Error('AbacatePay API key not configured');
      }

      // Preparar dados para o AbacatePay
      const paymentData = {
        amount: data.amount * 100, // AbacatePay espera valor em centavos
        currency: 'BRL',
        payment_method: 'pix',
        webhook_url: `${process.env.WEBHOOK_BASE_URL || 'https://siz-cosmetic-store-pro.vercel.app'}/api/webhook/abacatepay?webhookSecret=${process.env.ABACATEPAY_WEBHOOK_SECRET}`,
        metadata: {
          orderId: data.orderId,
          userId: data.userId,
          customerInfo: data.customerInfo
        }
      };

      // Fazer requisição para o AbacatePay
      const response = await axios.post(`${abacatePayApiUrl}/v1/billing`, paymentData, {
        headers: {
          'Authorization': `Bearer ${abacatePayApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const abacatePayment = response.data;

      // Salvar informações do pagamento na tabela payments usando SQL direto
      await db.execute(sql`
        INSERT INTO payments (
          order_id, user_id, payment_method, payment_provider,
          external_payment_id, amount, currency, status,
          pix_qr_code, pix_qr_code_text, expires_at,
          customer_info, metadata, created_at, updated_at
        ) VALUES (
          ${data.orderId}, ${data.userId}, 'pix', 'abacatepay',
          ${abacatePayment.id}, ${data.amount}, 'BRL', 'pending',
          ${abacatePayment.pix_qr_code || null}, ${abacatePayment.pix_qr_code_text || null},
          ${abacatePayment.expires_at ? new Date(abacatePayment.expires_at) : null},
          ${JSON.stringify(data.customerInfo || {})},
          ${JSON.stringify({ abacatePaymentData: abacatePayment })},
          NOW(), NOW()
        )
      `);

      return {
        id: abacatePayment.id,
        qrCode: abacatePayment.pix_qr_code,
        qrCodeText: abacatePayment.pix_qr_code_text,
        amount: data.amount,
        status: 'pending',
        expiresAt: abacatePayment.expires_at
      };

    } catch (error) {
      console.error('Error creating AbacatePay payment:', error);
      throw new Error('Failed to create payment with AbacatePay');
    }
  }

  async getAbacatePaymentStatus(paymentId: string): Promise<string> {
    try {
      // Buscar informações do pagamento na tabela payments usando SQL direto
      const result = await db.execute(sql`
        SELECT status FROM payments
        WHERE external_payment_id = ${paymentId}
        LIMIT 1
      `);

      if (!result.rows || result.rows.length === 0) {
        return 'not_found';
      }

      return (result.rows[0] as any).status || 'pending';

    } catch (error) {
      console.error('Error getting AbacatePay payment status:', error);
      return 'error';
    }
  }

  async handleAbacatePaymentPaid(data: any): Promise<void> {
    try {
      const pixQrCode = data.pixQrCode;
      const paymentData = data.payment;

      if (!pixQrCode || !pixQrCode.id) {
        console.error('Invalid payment data received from AbacatePay');
        return;
      }

      // Buscar informações do pagamento na tabela payments usando SQL direto
      const paymentResult = await db.execute(sql`
        SELECT id, order_id FROM payments
        WHERE external_payment_id = ${pixQrCode.id}
        LIMIT 1
      `);

      if (!paymentResult.rows || paymentResult.rows.length === 0) {
        console.error('Payment not found in database:', pixQrCode.id);
        return;
      }

      const paymentRecord = paymentResult.rows[0] as any;
      const orderId = paymentRecord.order_id;

      // Atualizar status do pedido para "paid"
      await this.updateOrderStatus(orderId, 'paid');

      // Atualizar informações do pagamento usando SQL direto
      await db.execute(sql`
        UPDATE payments
        SET status = 'paid',
            paid_at = NOW(),
            webhook_data = ${JSON.stringify(data)},
            updated_at = NOW()
        WHERE id = ${paymentRecord.id}
      `);

      console.log(`Payment confirmed for order ${orderId}`);

    } catch (error) {
      console.error('Error handling AbacatePay payment confirmation:', error);
    }
  }

  async handleAbacatePaymentFailed(data: any): Promise<void> {
    try {
      // Implementar lógica para pagamento falhado
      console.log('Payment failed:', data);

      const paymentId = data.payment?.id || data.id;

      if (!paymentId) {
        console.error('No payment ID found in failure data');
        return;
      }

      // Buscar e atualizar informações do pagamento usando SQL direto
      const paymentResult = await db.execute(sql`
        SELECT id, order_id FROM payments
        WHERE external_payment_id = ${paymentId}
        LIMIT 1
      `);

      if (paymentResult.rows && paymentResult.rows.length > 0) {
        const paymentRecord = paymentResult.rows[0] as any;

        // Atualizar status do pedido para "failed"
        await this.updateOrderStatus(paymentRecord.order_id, 'failed');

        // Atualizar informações do pagamento usando SQL direto
        await db.execute(sql`
          UPDATE payments
          SET status = 'failed',
              failed_at = NOW(),
              failure_reason = ${data.reason || 'Payment failed'},
              webhook_data = ${JSON.stringify(data)},
              updated_at = NOW()
          WHERE id = ${paymentRecord.id}
        `);
      }

    } catch (error) {
      console.error('Error handling AbacatePay payment failure:', error);
    }
  }

  // ADMIN DASHBOARD STATS
  async getStats(): Promise<{ totalSales: number; totalOrders: number; newCustomers: number; lowStockProducts: number; }> {
    // Total de vendas
    const completedOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.status, "completed"));

    const totalSales = completedOrders.reduce((sum: number, order: any) => {
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

        return newAddress[0] as any;
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

  // Settings methods
  async getSetting(key: string): Promise<string | null> {
    try {
      const result = await db.execute(sql`
        SELECT value FROM settings
        WHERE key = ${key}
        LIMIT 1
      `);

      return (result.rows?.[0] as any)?.value || null;
    } catch (error) {
      console.error('Error getting setting:', error);
      throw error;
    }
  }

  async setSetting(key: string, value: string, description?: string, category?: string): Promise<void> {
    try {
      const existingResult = await db.execute(sql`
        SELECT id, description, category FROM settings
        WHERE key = ${key}
        LIMIT 1
      `);

      if (existingResult.rows && existingResult.rows.length > 0) {
        const existing = existingResult.rows[0] as any;
        // Update existing setting
        await db.execute(sql`
          UPDATE settings
          SET value = ${value},
              description = ${description || existing.description},
              category = ${category || existing.category},
              updated_at = NOW()
          WHERE key = ${key}
        `);
      } else {
        // Insert new setting
        await db.execute(sql`
          INSERT INTO settings (key, value, description, category, created_at, updated_at)
          VALUES (${key}, ${value}, ${description || null}, ${category || 'general'}, NOW(), NOW())
        `);
      }
    } catch (error) {
      console.error('Error setting configuration:', error);
      throw error;
    }
  }

  async getSettingsByCategory(category: string): Promise<{ key: string; value: string; description?: string }[]> {
    try {
      const result = await db.execute(sql`
        SELECT key, value, description FROM settings
        WHERE category = ${category}
      `);

      return (result.rows || []).map((row: any) => ({
        key: row.key,
        value: row.value || '',
        description: row.description || undefined
      }));
    } catch (error) {
      console.error('Error getting settings by category:', error);
      throw error;
    }
  }
}

// Use DatabaseStorage instead of MemStorage
export const storage = new DatabaseStorage();
