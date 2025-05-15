// API handler for category routes on Vercel
import express from 'express';
import cors from 'cors';
import { storage } from '../server/storage.js';

// Create Express app
const app = express();

// Enable CORS
app.use(cors({
  origin: true,
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Get all categories
app.get("/", async (req, res) => {
  try {
    console.log("Fetching categories...");
    const categories = await storage.getCategories();
    console.log(`Found ${categories.length} categories`);
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Error fetching categories" });
  }
});

// Get category by slug
app.get("/:slug", async (req, res) => {
  try {
    console.log("Fetching category by slug:", req.params.slug);
    const category = await storage.getCategoryBySlug(req.params.slug);
    
    if (!category) {
      console.log("Category not found:", req.params.slug);
      return res.status(404).json({ message: "Category not found" });
    }
    
    console.log("Category found:", category.name);
    res.json(category);
  } catch (error) {
    console.error("Error fetching category:", error);
    res.status(500).json({ message: "Error fetching category" });
  }
});

// Export the Express API
export default app;
