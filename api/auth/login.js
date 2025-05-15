// Serverless function for handling login requests
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';

// Configure CORS
const corsMiddleware = cors({
  origin: '*',
  methods: ['POST', 'OPTIONS'],
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
    console.log('OPTIONS request received for login');
    return corsMiddleware(req, res, () => {
      res.status(200).end();
    });
  }

  // Handle POST request
  if (req.method === 'POST') {
    console.log('Login request received');

    // Apply CORS middleware
    return corsMiddleware(req, res, async () => {
      try {
        // Extract credentials
        const { username, password } = req.body || {};

        // Simple validation
        if (!username || !password) {
          console.log('Missing username or password');
          return res.status(400).json({ message: 'Username and password are required' });
        }

        // Verificar se o Supabase está configurado
        if (!supabase) {
          console.log('Supabase not configured, using mock login');
          // Fallback para login mock
          const user = {
            id: 1,
            username,
            role: 'customer'
          };

          return res.status(200).json({
            message: 'Login successful (mock)',
            user
          });
        }

        // Buscar usuário no banco de dados
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('username', username)
          .single();

        if (error || !data) {
          console.log('User not found:', username);
          return res.status(401).json({ message: 'Incorrect username or password' });
        }

        // Verificar senha
        const isValidPassword = await bcrypt.compare(password, data.password);
        if (!isValidPassword) {
          console.log('Invalid password for user:', username);
          return res.status(401).json({ message: 'Incorrect username or password' });
        }

        // Remover senha do objeto de usuário
        const { password: _, ...userWithoutPassword } = data;

        console.log('Login successful for user:', username);
        return res.status(200).json({
          message: 'Login successful',
          user: userWithoutPassword
        });
      } catch (error) {
        console.error('Error processing login:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }
    });
  }

  // Handle other methods
  return res.status(405).json({ message: 'Method not allowed' });
}
