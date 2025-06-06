import { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { getUserById } from '../lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verificar se há token JWT no header Authorization
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    // Se não há token no header, verificar cookies
    if (!token && req.headers.cookie) {
      const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);

      token = cookies.authToken || cookies.token;
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Verificar e decodificar o token JWT
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    
    try {
      const decoded = jwt.verify(token, jwtSecret) as any;
      
      if (!decoded.userId) {
        return res.status(401).json({ message: 'Invalid token' });
      }

      // Buscar dados atualizados do usuário no Supabase
      const user = await getUserById(decoded.userId);

      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // Retornar dados do usuário no formato esperado pelo frontend
      const userResponse = {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.full_name || user.username,
        role: user.role,
        timestamp: new Date().getTime()
      };

      return res.status(200).json({ user: userResponse });

    } catch (jwtError) {
      console.error('JWT verification error:', jwtError);
      return res.status(401).json({ message: 'Invalid token' });
    }

  } catch (error) {
    console.error('Error in auth/me endpoint:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
