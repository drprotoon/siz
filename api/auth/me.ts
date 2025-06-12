import { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { supabase } from '../lib/supabase';

interface AuthenticatedRequest extends VercelRequest {
  user?: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}

export default async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Check for JWT token in Authorization header
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Verify JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET not configured');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, jwtSecret) as any;
    } catch (error) {
      console.error('JWT verification failed:', error);
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Get user from Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, email, full_name, phone, cpf, role, created_at')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      console.error('User not found:', error);
      return res.status(404).json({ message: 'User not found' });
    }

    // Return user data
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      cpf: user.cpf,
      role: user.role,
      created_at: user.created_at
    });

  } catch (error) {
    console.error('Error in /api/auth/me:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
