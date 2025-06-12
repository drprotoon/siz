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

// Middleware para autenticação JWT
async function authenticateToken(req: AuthenticatedRequest): Promise<boolean> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false;
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET not configured');
      return false;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
    
    // Buscar usuário no Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, email, role')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      console.error('User not found:', error);
      return false;
    }

    req.user = user;
    return true;
  } catch (error) {
    console.error('Authentication error:', error);
    return false;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const authReq = req as AuthenticatedRequest;
  
  // Verificar autenticação
  const isAuthenticated = await authenticateToken(authReq);
  if (!isAuthenticated) {
    return res.status(401).json({ error: 'Token de acesso requerido' });
  }

  // Check if this is a specific order request (has ID in URL)
  const isSpecificOrder = req.url?.match(/\/orders\/(\d+)/);
  const orderId = isSpecificOrder ? parseInt(isSpecificOrder[1]) : null;

  try {
    if (req.method === 'GET') {
      if (orderId) {
        // Buscar pedido específico com itens
        const { data: order, error } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (
              id,
              product_id,
              quantity,
              price,
              products (
                id,
                name,
                slug,
                images,
                description
              )
            )
          `)
          .eq('id', orderId)
          .single();

        if (error) {
          console.error('Error fetching order:', error);
          return res.status(404).json({ error: 'Pedido não encontrado' });
        }

        if (!order) {
          return res.status(404).json({ error: 'Pedido não encontrado' });
        }

        // Verificar se o usuário tem permissão para ver este pedido
        if (authReq.user?.role !== 'admin' && order.user_id !== authReq.user?.id) {
          return res.status(403).json({ error: 'Acesso negado' });
        }

        return res.status(200).json(order);
      } else {
        // Buscar todos os pedidos do usuário
        let query = supabase
          .from('orders')
          .select(`
            *,
            order_items (
              id,
              product_id,
              quantity,
              price,
              products (
                id,
                name,
                slug,
                images
              )
            )
          `);

        // Se não for admin, filtrar apenas pedidos do usuário
        if (authReq.user?.role !== 'admin') {
          query = query.eq('user_id', authReq.user?.id);
        }

        const { data: orders, error } = await query.order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching orders:', error);
          return res.status(500).json({ error: 'Erro ao buscar pedidos' });
        }

        return res.status(200).json(orders || []);
      }

    } else if (req.method === 'POST') {
      // Criar novo pedido
      const { items, payment, subtotal, shippingCost, total, shippingAddress, shippingCity, shippingState, shippingPostalCode, shippingCountry, shippingMethod } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Itens do pedido são obrigatórios' });
      }

      if (!payment || !payment.method) {
        return res.status(400).json({ error: 'Informações de pagamento são obrigatórias' });
      }

      // Criar pedido no Supabase
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: authReq.user?.id,
          status: 'pending',
          subtotal: subtotal || 0,
          shipping_cost: shippingCost || 0,
          total: total || 0,
          shipping_address: shippingAddress || '',
          shipping_city: shippingCity || '',
          shipping_state: shippingState || '',
          shipping_postal_code: shippingPostalCode || '',
          shipping_country: shippingCountry || 'Brasil',
          shipping_method: shippingMethod || '',
          payment_method: payment.method,
          payment_status: payment.status || 'pending',
          payment_transaction_id: payment.transactionId || null
        })
        .select()
        .single();

      if (orderError) {
        console.error('Error creating order:', orderError);
        return res.status(500).json({ error: 'Erro ao criar pedido' });
      }

      // Criar itens do pedido
      const orderItems = items.map((item: any) => ({
        order_id: order.id,
        product_id: item.productId,
        quantity: item.quantity,
        price: item.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Error creating order items:', itemsError);
        // Tentar remover o pedido criado
        await supabase.from('orders').delete().eq('id', order.id);
        return res.status(500).json({ error: 'Erro ao criar itens do pedido' });
      }

      return res.status(201).json(order);

    } else if (req.method === 'PUT' && orderId) {
      // Atualizar status do pedido (apenas admin)
      if (authReq.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado - apenas administradores' });
      }

      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ error: 'Status é obrigatório' });
      }

      const { data: updatedOrder, error } = await supabase
        .from('orders')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()
        .single();

      if (error) {
        console.error('Error updating order:', error);
        return res.status(500).json({ error: 'Erro ao atualizar pedido' });
      }

      return res.status(200).json(updatedOrder);

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Orders API error:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
