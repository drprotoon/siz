// API handler for Vercel serverless functions
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Create Express app
const app = express();

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Import routes dynamically
const registerRoutes = async () => {
  try {
    // Dynamic import for the routes
    const { registerRoutes } = await import('../dist/index.js');
    return registerRoutes(app);
  } catch (error) {
    console.error('Error importing routes:', error);
    // Fallback API endpoint if routes can't be imported
    app.get('/api/hello', (req, res) => {
      res.json({ message: 'Hello from Vercel API!', error: error.message });
    });
  }
};

// Serve static files
const serveStatic = () => {
  // Find the static files directory
  const possiblePaths = [
    path.resolve(rootDir, 'dist', 'public'),
    path.resolve(rootDir, 'public')
  ];

  const distPath = possiblePaths.find(p => fs.existsSync(p)) || path.resolve(rootDir, 'dist', 'public');

  console.log(`Serving static files from: ${distPath}`);

  // Serve static files with cache control
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

  // Handle client-side routing
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
};

// Initialize the server
const initServer = async () => {
  try {
    // Register API routes
    await registerRoutes();

    // Serve static files and handle client-side routing
    serveStatic();

    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error('Server error:', err);
      res.status(500).json({ message: 'Internal Server Error' });
    });

    // Start server if not in Vercel environment
    if (process.env.VERCEL !== '1') {
      const port = process.env.PORT || 5000;
      app.listen(port, () => {
        console.log(`Server running on port ${port}`);
      });
    }
  } catch (error) {
    console.error('Failed to initialize server:', error);
  }
};

// Initialize the server
initServer();

// Export for Vercel
export default app;
