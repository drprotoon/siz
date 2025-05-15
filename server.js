// Minimal server for Vercel deployment
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Setup for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Find the static files directory
const publicDir = path.join(__dirname, 'dist', 'public');
console.log(`Serving static files from: ${publicDir}`);

// Serve static files
app.use(express.static(publicDir));

// Simple API endpoint for testing
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from Vercel!' });
});

// Handle client-side routing
app.get('*', (req, res) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ message: 'API endpoint not found' });
  }

  const indexPath = path.join(publicDir, 'index.html');

  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  } else {
    return res.status(404).send('Not found: index.html is missing');
  }
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
