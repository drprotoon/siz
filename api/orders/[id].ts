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
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
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

  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: 'ID do pedido inválido' });
  }

  const orderId = parseInt(id);

  if (isNaN(orderId)) {
    return res.status(400).json({ error: 'ID do pedido deve ser um número' });
  }

  try {
    if (req.method === 'GET') {
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

    } else if (req.method === 'PUT') {
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
    console.error('Order API error:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
