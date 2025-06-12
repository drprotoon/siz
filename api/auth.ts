import { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client directly in this file to avoid module resolution issues
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

interface AuthenticatedRequest extends VercelRequest {
  user?: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}

// Helper function to get user from JWT token
async function getUserFromToken(req: AuthenticatedRequest): Promise<any> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const jwtSecret = process.env.JWT_SECRET;
  
  if (!jwtSecret) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as any;
    return { id: decoded.userId, username: decoded.username, email: decoded.email, role: decoded.role };
  } catch (error) {
    return null;
  }
}

export default async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  const { method } = req;

  // Add debug logging
  console.log('Auth handler called:', { method, url: req.url });
  console.log('Environment check:', {
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasJwtSecret: !!process.env.JWT_SECRET
  });

  // Handle login endpoint
  if (req.url?.includes('/login-jwt') || method === 'POST') {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      // Get user from Supabase
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Generate JWT token
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        return res.status(500).json({ message: 'JWT secret not configured' });
      }

      const token = jwt.sign(
        {
          userId: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        },
        jwtSecret,
        { expiresIn: '7d' }
      );

      return res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Handle me endpoint (GET)
  if (method === 'GET') {
    try {
      const user = await getUserFromToken(req);
      
      if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Get fresh user data from database
      const { data: userData, error } = await supabase
        .from('users')
        .select('id, username, email, role, created_at')
        .eq('id', user.id)
        .single();

      if (error || !userData) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.json({
        user: userData
      });
    } catch (error) {
      console.error('Me endpoint error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
