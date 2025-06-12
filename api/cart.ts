import { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client directly
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
    return { id: decoded.userId };
  } catch (error) {
    return null;
  }
}

export default async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  try {
    const user = await getUserFromToken(req);

    if (req.method === 'GET') {
      // Get cart items
      if (user?.id) {
        // Authenticated user - get cart from database
        const { data: cartItems, error } = await supabase
          .from('cart_items')
          .select(`
            id,
            quantity,
            created_at,
            products (
              id,
              name,
              slug,
              price,
              sale_price,
              images,
              stock_quantity
            )
          `)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching cart:', error);
          return res.status(500).json({ message: 'Error fetching cart' });
        }

        // Transform the data to match expected format
        const transformedCart = cartItems?.map(item => ({
          id: item.id,
          quantity: item.quantity,
          product: {
            ...item.products,
            images: Array.isArray((item.products as any).images) ? (item.products as any).images :
                   (item.products as any).images ? [(item.products as any).images] : []
          }
        })) || [];

        return res.json(transformedCart);
      } else {
        // Non-authenticated user - return empty cart
        // In a real app, you might use session storage or cookies
        return res.json([]);
      }
    }

    if (req.method === 'POST') {
      // Add item to cart
      if (!user?.id) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { productId, quantity = 1 } = req.body;

      if (!productId) {
        return res.status(400).json({ message: 'Product ID is required' });
      }

      // Check if product exists
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, stock_quantity')
        .eq('id', productId)
        .single();

      if (productError || !product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      // Check if item already exists in cart
      const { data: existingItem, error: existingError } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .single();

      if (existingItem) {
        // Update existing item
        const newQuantity = existingItem.quantity + quantity;
        const { data: updatedItem, error: updateError } = await supabase
          .from('cart_items')
          .update({ quantity: newQuantity })
          .eq('id', existingItem.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating cart item:', updateError);
          return res.status(500).json({ message: 'Error updating cart' });
        }

        return res.json(updatedItem);
      } else {
        // Create new item
        const { data: newItem, error: insertError } = await supabase
          .from('cart_items')
          .insert({
            user_id: user.id,
            product_id: productId,
            quantity: quantity
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error adding to cart:', insertError);
          return res.status(500).json({ message: 'Error adding to cart' });
        }

        return res.json(newItem);
      }
    }

    if (req.method === 'DELETE') {
      // Clear cart
      if (!user?.id) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('Error clearing cart:', error);
        return res.status(500).json({ message: 'Error clearing cart' });
      }

      return res.json({ message: 'Cart cleared successfully' });
    }

    return res.status(405).json({ message: 'Method not allowed' });

  } catch (error) {
    console.error('Error in /api/cart:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
