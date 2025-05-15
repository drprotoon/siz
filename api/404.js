// API handler for 404 routes on Vercel
import express from 'express';
import cors from 'cors';

// Create Express app
const app = express();

// Enable CORS
app.use(cors({
  origin: true,
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// 404 handler
app.all('*', (req, res) => {
  console.log(`404 - Rota não encontrada: ${req.method} ${req.path}`);
  
  // Verificar se é uma rota de API
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'API endpoint not found',
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  }
  
  // Para rotas não-API, redirecionar para a página inicial
  res.redirect('/');
});

// Export the Express API
export default app;
