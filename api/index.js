// This file is the entry point for Vercel serverless functions
// It will be automatically detected by Vercel

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

// Simple API endpoint for testing
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from Vercel API!' });
});

// Serve static files
const serveStatic = () => {
  // Find the static files directory
  const possiblePaths = [
    path.resolve(rootDir, 'dist', 'public'),
    path.resolve(rootDir, 'public')
  ];

  const distPath = possiblePaths.find(p => fs.existsSync(p)) || path.resolve(rootDir, 'dist', 'public');

  console.log(`Serving static files from: ${distPath}`);

  // Serve static files
  app.use(express.static(distPath));

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

// Export for Vercel
export default app;
