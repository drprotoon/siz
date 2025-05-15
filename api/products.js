// API handler for product routes on Vercel
import express from 'express';
import cors from 'cors';
import { storage } from '../server/storage.js';
import { ensureImagesArray } from '../server/utils.js';

// Create Express app
const app = express();

// Enable CORS
app.use(cors({
  origin: true,
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Get all products
app.get("/", async (req, res) => {
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

    // Only show visible products
    options.visible = true;

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
app.get("/:slug", async (req, res) => {
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

    // Check if product is visible
    if (!product.visible) {
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

// Get product reviews
app.get("/:id/reviews", async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const reviews = await storage.getProductReviews(productId);
    res.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ message: "Error fetching reviews" });
  }
});

// Export the Express API
export default app;
