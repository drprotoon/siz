// API handler for Vercel serverless functions
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Setup for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Create Express app
const app = express();

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Import and register routes
async function setupServer() {
  try {
    // Import the registerRoutes function
    const { registerRoutes } = await import('../dist/routes.js');

    // Register API routes
    await registerRoutes(app);

    // Serve static files
    const distPath = path.join(rootDir, 'dist', 'public');
    if (fs.existsSync(distPath)) {
      console.log(`Serving static files from: ${distPath}`);
      app.use(express.static(distPath, {
        maxAge: '1d',
        etag: true
      }));

      // Serve assets with longer cache time
      const assetsDir = path.join(distPath, 'assets');
      if (fs.existsSync(assetsDir)) {
        app.use('/assets', express.static(assetsDir, {
          maxAge: '7d',
          etag: true
        }));
      }
    } else {
      console.warn(`Static files directory not found: ${distPath}`);
    }

    // Handle client-side routing (must be after API routes)
    app.get('*', (req, res) => {
      // Skip API routes
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ message: 'API endpoint not found' });
      }

      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        return res.sendFile(indexPath);
      } else {
        return res.status(404).send('Not found: index.html is missing');
      }
    });

    // Error handling middleware
    app.use((err, _req, res, _next) => {
      console.error('Server error:', err);
      res.status(500).json({ message: 'Internal Server Error' });
    });

    return app;
  } catch (error) {
    console.error('Failed to setup server:', error);
    throw error;
  }
}

// Setup the server
setupServer();

// Export for Vercel
export default app;
