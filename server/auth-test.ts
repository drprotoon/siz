/**
 * Authentication test endpoints
 * These endpoints help diagnose authentication issues
 */

import express from 'express';

export function setupAuthTest(app: express.Express) {
  // Add a simple auth status endpoint
  app.get('/api/auth/status', (req, res) => {
    // Return detailed information about the authentication state
    res.json({
      isAuthenticated: req.isAuthenticated(),
      user: req.user || null,
      session: {
        id: req.session?.id || null,
        cookie: {
          ...req.session?.cookie,
          // Convert dates to strings for JSON serialization
          expires: req.session?.cookie?.expires?.toISOString() || null,
        },
      },
      headers: {
        cookie: req.headers.cookie || null,
        origin: req.headers.origin || null,
        host: req.headers.host || null,
        referer: req.headers.referer || null,
      },
      env: {
        NODE_ENV: process.env.NODE_ENV || 'unknown',
        VERCEL: process.env.VERCEL || 'unknown',
      }
    });
  });

  // Add a test endpoint that requires authentication
  app.get('/api/auth/protected', (req, res) => {
    if (req.isAuthenticated()) {
      return res.json({
        message: 'You are authenticated',
        user: req.user
      });
    }
    
    res.status(401).json({
      message: 'You are not authenticated',
      sessionId: req.session?.id || null
    });
  });

  // Add a test endpoint that requires admin role
  app.get('/api/auth/admin-only', (req, res) => {
    if (req.isAuthenticated() && req.user.role === 'admin') {
      return res.json({
        message: 'You are authenticated as admin',
        user: req.user
      });
    }
    
    if (req.isAuthenticated()) {
      return res.status(403).json({
        message: 'You are authenticated but not an admin',
        user: req.user
      });
    }
    
    res.status(401).json({
      message: 'You are not authenticated',
      sessionId: req.session?.id || null
    });
  });

  console.log('Auth test endpoints registered');
}
