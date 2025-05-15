// Serverless function for handling product requests
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

// Mock products data para fallback
const mockProducts = [
  {
    id: 1,
    name: 'Perfume Feminino',
    slug: 'perfume-feminino',
    description: 'Um perfume delicado com notas florais',
    price: 129.90,
    compareAtPrice: 149.90,
    images: ['https://placehold.co/400x400?text=Perfume'],
    categoryId: 1,
    category: { id: 1, name: 'Perfumes Femininos', slug: 'perfumes-femininos' },
    featured: true,
    visible: true
  },
  {
    id: 2,
    name: 'Perfume Masculino',
    slug: 'perfume-masculino',
    description: 'Um perfume marcante com notas amadeiradas',
    price: 139.90,
    compareAtPrice: 159.90,
    images: ['https://placehold.co/400x400?text=Perfume'],
    categoryId: 2,
    category: { id: 2, name: 'Perfumes Masculinos', slug: 'perfumes-masculinos' },
    featured: true,
    visible: true
  }
];

// Função para garantir que images seja um array
function ensureImagesArray(images) {
  if (!images) return [];
  if (Array.isArray(images)) return images;

  try {
    // Tenta converter de string JSON para array
    const parsed = JSON.parse(images);
    return Array.isArray(parsed) ? parsed : [images];
  } catch (e) {
    // Se não for um JSON válido, retorna como um item único em um array
    return [images];
  }
}

// Handler function
export default async function handler(req, res) {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    console.log('OPTIONS request received for products');
    return corsMiddleware(req, res, () => {
      res.status(200).end();
    });
  }

  // Handle GET request
  if (req.method === 'GET') {
    console.log('Products request received');

    // Apply CORS middleware
    return corsMiddleware(req, res, async () => {
      try {
        // Verificar se o Supabase está configurado
        if (!supabase) {
          console.log('Supabase not configured, using mock products');
          return res.status(200).json(mockProducts);
        }

        // Extrair parâmetros de consulta
        const { category, featured } = req.query;

        // Construir a consulta base
        let query = supabase
          .from('products')
          .select(`
            *,
            category:categories(id, name, slug)
          `)
          .eq('visible', true);

        // Filtrar por categoria se especificado
        if (category) {
          // Primeiro, buscar o ID da categoria pelo slug
          const { data: categoryData } = await supabase
            .from('categories')
            .select('id')
            .eq('slug', category)
            .single();

          if (categoryData) {
            query = query.eq('categoryId', categoryData.id);
          }
        }

        // Filtrar por featured se especificado
        if (featured === 'true') {
          query = query.eq('featured', true);
        }

        // Executar a consulta
        const { data, error } = await query;

        if (error) {
          console.error('Error fetching products from Supabase:', error);
          return res.status(500).json({ message: 'Error fetching products' });
        }

        // Processar os resultados para garantir que images seja um array
        const processedProducts = data.map(product => ({
          ...product,
          images: ensureImagesArray(product.images)
        }));

        return res.status(200).json(processedProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }
    });
  }

  // Handle other methods
  return res.status(405).json({ message: 'Method not allowed' });
}
