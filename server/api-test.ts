import express from 'express';
import cors from 'cors';

// Create a simple API test endpoint
export function setupApiTest(app: express.Express) {
  // Add a simple health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      isVercel: process.env.VERCEL === '1' ? true : false
    });
  });

  // Add a test endpoint that accepts all HTTP methods
  app.all('/api/test', (req, res) => {
    res.json({
      message: 'API test endpoint is working',
      method: req.method,
      path: req.path,
      query: req.query,
      body: req.body,
      headers: req.headers,
      timestamp: new Date().toISOString()
    });
  });

  console.log('API test endpoints registered');
}
