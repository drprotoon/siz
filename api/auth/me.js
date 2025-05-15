// Serverless function for checking authentication status
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

// Configure CORS
const corsMiddleware = cors({
  origin: '*',
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
        // Verificar se há um token de autenticação
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          console.log('No authentication token provided');
          return res.status(401).json({ message: 'Not authenticated' });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' do início

        // Verificar se o Supabase está configurado
        if (!supabase) {
          console.log('Supabase not configured, using mock authentication');
          // Fallback para autenticação mock
          // Para fins de demonstração, considerar qualquer token como válido
          if (token) {
            return res.status(200).json({
              user: {
                id: 1,
                username: 'demo_user',
                role: 'customer'
              }
            });
          }
          return res.status(401).json({ message: 'Not authenticated' });
        }

        // Verificar o token com o Supabase
        // Nota: Em uma implementação real, você usaria o JWT do Supabase Auth
        // Aqui estamos simulando uma verificação de token
        try {
          // Buscar usuário pelo ID (simulando que o token contém o ID do usuário)
          const userId = parseInt(token);
          if (isNaN(userId)) {
            return res.status(401).json({ message: 'Invalid token' });
          }

          const { data, error } = await supabase
            .from('users')
            .select('id, username, email, role')
            .eq('id', userId)
            .single();

          if (error || !data) {
            console.log('User not found for token');
            return res.status(401).json({ message: 'Not authenticated' });
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
