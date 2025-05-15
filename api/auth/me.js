// Serverless function for checking authentication status
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

// Configure CORS
const corsMiddleware = cors({
  origin: true, // Isso permite que o Vercel use o Origin da requisição
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
});

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

// Cliente do Supabase
const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// Handler function
export default async function handler(req, res) {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    console.log('OPTIONS request received for auth check');
    return corsMiddleware(req, res, () => {
      res.status(200).end();
    });
  }

  // Handle GET request
  if (req.method === 'GET') {
    console.log('Auth check request received');

    // Apply CORS middleware
    return corsMiddleware(req, res, async () => {
      try {
        // Para simplificar, vamos usar um mock de autenticação
        // Em uma implementação real, você verificaria o token JWT ou cookie de sessão

        // Verificar se o Supabase está configurado
        if (!supabase) {
          console.log('Supabase not configured, using mock authentication');
          // Retornar um usuário mock para demonstração
          return res.status(200).json({
            user: {
              id: 1,
              username: 'demo_user',
              email: 'demo@example.com',
              role: 'customer'
            }
          });
        }

        // Verificar se há um token de autenticação
        const authHeader = req.headers.authorization;
        let userId = null;

        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.substring(7); // Remove 'Bearer ' do início

          // Tentar extrair o ID do usuário do token
          try {
            userId = parseInt(token);
          } catch (e) {
            console.log('Invalid token format');
          }
        }

        // Se não temos um ID de usuário válido, retornar um usuário mock
        if (!userId) {
          console.log('No valid user ID, returning mock user');
          return res.status(200).json({
            user: {
              id: 1,
              username: 'demo_user',
              email: 'demo@example.com',
              role: 'customer'
            }
          });
        }

        // Tentar buscar o usuário no Supabase
        try {
          const { data, error } = await supabase
            .from('users')
            .select('id, username, email, role')
            .eq('id', userId)
            .single();

          if (error || !data) {
            console.log('User not found, returning mock user');
            return res.status(200).json({
              user: {
                id: 1,
                username: 'demo_user',
                email: 'demo@example.com',
                role: 'customer'
              }
            });
          }

          console.log('User is authenticated:', data.username);
          return res.status(200).json({ user: data });
        } catch (tokenError) {
          console.error('Error verifying token:', tokenError);
          return res.status(401).json({ message: 'Invalid token' });
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }
    });
  }

  // Handle other methods
  return res.status(405).json({ message: 'Method not allowed' });
}
