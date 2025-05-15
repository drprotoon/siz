// Serverless function for handling login requests
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';

// Configure CORS
const corsMiddleware = cors({
  origin: true, // Isso permite que o Vercel use o Origin da requisição
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
        const { username, email, password } = req.body || {};

        // Determinar qual campo usar para login (username ou email)
        const loginField = email || username;

        // Simple validation
        if (!loginField || !password) {
          console.log('Missing login credentials or password');
          return res.status(400).json({ message: 'Login credentials and password are required' });
        }

        // Verificar se o Supabase está configurado
        if (!supabase) {
          console.log('Supabase not configured, using mock login');
          // Fallback para login mock
          const user = {
            id: 1,
            username: loginField,
            email: loginField.includes('@') ? loginField : `${loginField}@example.com`,
            role: 'customer'
          };

          return res.status(200).json({
            message: 'Login successful (mock)',
            user
          });
        }

        // Determinar se o login é por email ou username
        const isEmail = loginField.includes('@');

        // Buscar usuário no banco de dados
        let query = supabase.from('users').select('*');

        if (isEmail) {
          query = query.eq('email', loginField);
        } else {
          query = query.eq('username', loginField);
        }

        const { data, error } = await query.single();

        if (error || !data) {
          console.log('User not found:', loginField);
          return res.status(401).json({ message: 'Incorrect username/email or password' });
        }

        // Verificar senha - primeiro tentar com bcrypt, se falhar usar comparação direta
        let isValidPassword = false;

        try {
          // Tentar usar bcrypt para comparar senhas
          isValidPassword = await bcrypt.compare(password, data.password);
        } catch (bcryptError) {
          console.log('Error using bcrypt, falling back to direct comparison:', bcryptError);
          // Fallback para comparação direta (não seguro, apenas para demonstração)
          isValidPassword = password === data.password;
        }

        if (!isValidPassword) {
          console.log('Invalid password for user:', loginField);
          return res.status(401).json({ message: 'Incorrect username/email or password' });
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
