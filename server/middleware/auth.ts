import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { storage } from '../storage';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        email: string;
        role: string;
      };
    }
  }
}

/**
 * JWT token verification middleware
 */
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Token de acesso requerido',
        code: 'MISSING_TOKEN'
      });
    }

    const token = authHeader.replace('Bearer ', '');

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET not configured');
      return res.status(500).json({
        error: 'Configuração do servidor inválida',
        code: 'SERVER_CONFIG_ERROR'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;

      // Try to get user from cache first
      const { userCache } = await import('../user-cache');
      let user = userCache.getCached(decoded.userId);

      if (!user) {
        // Get user from database if not in cache
        const dbUser = await storage.getUser(decoded.userId);

        if (!dbUser) {
          return res.status(401).json({
            error: 'Usuário não encontrado',
            code: 'USER_NOT_FOUND'
          });
        }

        user = {
          id: dbUser.id,
          username: dbUser.username,
          email: dbUser.email,
          role: dbUser.role
        };

        // Cache the user data
        userCache.setCached(decoded.userId, user);
      }

      // Add user info to request object
      req.user = user;

      next();
    } catch (jwtError) {
      if (jwtError instanceof jwt.TokenExpiredError) {
        return res.status(401).json({
          error: 'Token expirado',
          code: 'TOKEN_EXPIRED'
        });
      }

      if (jwtError instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({
          error: 'Token inválido',
          code: 'INVALID_TOKEN'
        });
      }

      throw jwtError;
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Role-based authorization middleware
 */
export const requireRole = (requiredRole: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Usuário não autenticado',
        code: 'NOT_AUTHENTICATED'
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Acesso negado - permissões insuficientes',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: allowedRoles,
        current: userRole
      });
    }

    next();
  };
};

/**
 * Admin role requirement middleware
 */
export const requireAdmin = requireRole('admin');

/**
 * Customer or admin role requirement middleware
 */
export const requireCustomerOrAdmin = requireRole(['customer', 'admin']);

/**
 * Optional authentication middleware - doesn't fail if no token provided
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without user info
      return next();
    }

    const token = authHeader.replace('Bearer ', '');

    if (!process.env.JWT_SECRET) {
      // Configuration error, but don't fail the request
      console.error('JWT_SECRET not configured');
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
      const user = await storage.getUser(decoded.userId);

      if (user) {
        req.user = {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        };
      }
    } catch (jwtError) {
      // Token invalid or expired, but don't fail the request
      console.log('Optional auth failed:', jwtError.message);
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    // Don't fail the request, just continue without user info
    next();
  }
};

/**
 * Session-based authentication middleware (for backward compatibility)
 */
export const requireSession = (req: Request, res: Response, next: NextFunction) => {
  if (req.session && (req.session as any).userId) {
    // Session exists, continue
    next();
  } else {
    res.status(401).json({
      error: 'Sessão requerida',
      code: 'SESSION_REQUIRED'
    });
  }
};

/**
 * Middleware to check if user owns the resource or is admin
 */
export const requireOwnershipOrAdmin = (userIdParam: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Usuário não autenticado',
        code: 'NOT_AUTHENTICATED'
      });
    }

    const resourceUserId = parseInt(req.params[userIdParam]);
    const currentUserId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (isAdmin || currentUserId === resourceUserId) {
      next();
    } else {
      res.status(403).json({
        error: 'Acesso negado - você só pode acessar seus próprios recursos',
        code: 'RESOURCE_ACCESS_DENIED'
      });
    }
  };
};

/**
 * Generate JWT token for user
 */
export const generateToken = (user: { id: number; username: string; email: string; role: string }): string => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET not configured');
  }

  return jwt.sign(
    {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '7d', // Token expires in 7 days
      issuer: 'cosmetic-store-pro',
      audience: 'cosmetic-store-users'
    }
  );
};

/**
 * Verify and decode JWT token without middleware
 */
export const verifyToken = (token: string): any => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET not configured');
  }

  return jwt.verify(token, process.env.JWT_SECRET);
};

/**
 * Security headers middleware
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Prevent XSS attacks
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // HTTPS redirect in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // Enhanced Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.frenet.com.br https://*.supabase.co wss://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "media-src 'self'"
  ].join('; ');

  res.setHeader('Content-Security-Policy', csp);

  // CORS headers for API routes
  if (req.path.startsWith('/api')) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://siz-cosmetic-store-pro.vercel.app',
      process.env.FRONTEND_URL
    ].filter(Boolean);

    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  }

  next();
};

/**
 * CSRF protection middleware
 */
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  // Skip CSRF for GET requests and API endpoints that don't modify data
  if (req.method === 'GET' || req.path.includes('/api/auth/me') || req.path.includes('/api/health')) {
    return next();
  }

  // Skip CSRF in development
  if (process.env.NODE_ENV === 'development') {
    return next();
  }

  const token = req.headers['x-csrf-token'] || req.body._csrf;
  const sessionToken = (req.session as any)?.csrfToken;

  if (!token || !sessionToken || token !== sessionToken) {
    return res.status(403).json({
      error: 'Token CSRF inválido',
      code: 'INVALID_CSRF_TOKEN'
    });
  }

  next();
};

/**
 * Generate CSRF token for session
 */
export const generateCSRFToken = (req: Request): string => {
  const token = Math.random().toString(36).substring(2, 15) +
                Math.random().toString(36).substring(2, 15);

  if (req.session) {
    (req.session as any).csrfToken = token;
  }

  return token;
};
