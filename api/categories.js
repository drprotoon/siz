// Serverless function for handling category requests
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

// Mock categories data para fallback
const mockCategories = [
  { id: 1, name: 'Perfumes Femininos', slug: 'perfumes-femininos' },
  { id: 2, name: 'Perfumes Masculinos', slug: 'perfumes-masculinos' },
  { id: 3, name: 'Skincare', slug: 'skincare' },
  { id: 4, name: 'Maquiagem', slug: 'maquiagem' }
];

// Handler function
export default async function handler(req, res) {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    console.log('OPTIONS request received for categories');
    return corsMiddleware(req, res, () => {
      res.status(200).end();
    });
  }

  // Handle GET request
  if (req.method === 'GET') {
    console.log('Categories request received');

    // Apply CORS middleware
    return corsMiddleware(req, res, async () => {
      try {
        // Verificar se o Supabase está configurado
        if (!supabase) {
          console.log('Supabase not configured, using mock categories');
          return res.status(200).json(mockCategories);
        }

        // Verificar se é uma solicitação para uma categoria específica por slug
        const slug = req.query.slug;
        if (slug) {
          const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('slug', slug)
            .single();

          if (error) {
            console.error('Error fetching category from Supabase:', error);
            return res.status(404).json({ message: 'Category not found' });
          }

          return res.status(200).json(data);
        }

        // Buscar todas as categorias
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('order', { ascending: true });

        if (error) {
          console.error('Error fetching categories from Supabase:', error);
          return res.status(500).json({ message: 'Error fetching categories' });
        }

        return res.status(200).json(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }
    });
  }

  // Handle other methods
  return res.status(405).json({ message: 'Method not allowed' });
}
