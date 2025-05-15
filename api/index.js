// Simplified API handler for Vercel serverless functions
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();

// Middleware for parsing JSON
app.use(express.json());

// Simple API endpoint for testing
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from Vercel API!' });
});

// Basic route for testing
app.get('/', (req, res) => {
  res.send('SIZ Cosméticos API is running!');
});

// Catch-all route
app.get('*', (req, res) => {
  res.status(404).json({ message: 'Not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ message: 'Internal Server Error' });
});

// Export for Vercel
export default app;
