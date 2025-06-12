import { VercelRequest, VercelResponse } from '@vercel/node';
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verificar webhook secret
    const webhookSecret = req.query.webhookSecret;
    
    if (!process.env.ABACATEPAY_WEBHOOK_SECRET) {
      console.error('ABACATEPAY_WEBHOOK_SECRET not configured');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    if (webhookSecret !== process.env.ABACATEPAY_WEBHOOK_SECRET) {
      console.error('Invalid webhook secret received:', webhookSecret);
      return res.status(401).json({ error: 'Invalid webhook secret' });
    }

    const event = req.body;
    console.log('Received AbacatePay webhook:', JSON.stringify(event, null, 2));

    // Processar diferentes tipos de eventos
    if (event.event === 'billing.paid') {
      await handlePaymentPaid(event.data);
    } else if (event.event === 'billing.failed') {
      await handlePaymentFailed(event.data);
    } else if (event.event === 'billing.expired') {
      await handlePaymentExpired(event.data);
    } else {
      console.log('Unhandled webhook event:', event.event);
    }

    return res.status(200).json({ message: 'Webhook processed successfully' });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({ 
      error: 'Webhook processing failed',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

async function handlePaymentPaid(data: any) {
  try {
    console.log('Processing payment paid event:', data);

    const pixQrCode = data.pixQrCode || data.payment;
    const paymentData = data.payment || data;

    if (!pixQrCode || !pixQrCode.id) {
      console.error('Invalid payment data received from AbacatePay');
      return;
    }

    // Buscar informações do pagamento na tabela payments
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('id, order_id')
      .eq('external_payment_id', pixQrCode.id)
      .single();

    if (paymentError || !payment) {
      console.error('Payment not found in database:', pixQrCode.id, paymentError);
      return;
    }

    // Atualizar status do pagamento
    const { error: updatePaymentError } = await supabase
      .from('payments')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', payment.id);

    if (updatePaymentError) {
      console.error('Error updating payment status:', updatePaymentError);
      return;
    }

    // Atualizar status do pedido
    const { error: updateOrderError } = await supabase
      .from('orders')
      .update({
        status: 'paid',
        payment_status: 'paid',
        updated_at: new Date().toISOString()
      })
      .eq('id', payment.order_id);

    if (updateOrderError) {
      console.error('Error updating order status:', updateOrderError);
      return;
    }

    console.log(`Payment confirmed successfully for order ${payment.order_id}`);

  } catch (error) {
    console.error('Error handling payment paid:', error);
  }
}

async function handlePaymentFailed(data: any) {
  try {
    console.log('Processing payment failed event:', data);

    const paymentId = data.payment?.id || data.id;

    if (!paymentId) {
      console.error('No payment ID found in failure data');
      return;
    }

    // Buscar informações do pagamento na tabela payments
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('id, order_id')
      .eq('external_payment_id', paymentId)
      .single();

    if (paymentError || !payment) {
      console.error('Payment not found in database:', paymentId, paymentError);
      return;
    }

    // Atualizar status do pagamento
    const { error: updatePaymentError } = await supabase
      .from('payments')
      .update({
        status: 'failed',
        failure_reason: data.payment?.reason || 'Payment failed',
        updated_at: new Date().toISOString()
      })
      .eq('id', payment.id);

    if (updatePaymentError) {
      console.error('Error updating payment status:', updatePaymentError);
      return;
    }

    // Atualizar status do pedido
    const { error: updateOrderError } = await supabase
      .from('orders')
      .update({
        status: 'payment_failed',
        payment_status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('id', payment.order_id);

    if (updateOrderError) {
      console.error('Error updating order status:', updateOrderError);
      return;
    }

    console.log(`Payment failed for order ${payment.order_id}`);

  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}

async function handlePaymentExpired(data: any) {
  try {
    console.log('Processing payment expired event:', data);

    const paymentId = data.payment?.id || data.id;

    if (!paymentId) {
      console.error('No payment ID found in expired data');
      return;
    }

    // Buscar informações do pagamento na tabela payments
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('id, order_id')
      .eq('external_payment_id', paymentId)
      .single();

    if (paymentError || !payment) {
      console.error('Payment not found in database:', paymentId, paymentError);
      return;
    }

    // Atualizar status do pagamento
    const { error: updatePaymentError } = await supabase
      .from('payments')
      .update({
        status: 'expired',
        updated_at: new Date().toISOString()
      })
      .eq('id', payment.id);

    if (updatePaymentError) {
      console.error('Error updating payment status:', updatePaymentError);
      return;
    }

    // Atualizar status do pedido
    const { error: updateOrderError } = await supabase
      .from('orders')
      .update({
        status: 'payment_expired',
        payment_status: 'expired',
        updated_at: new Date().toISOString()
      })
      .eq('id', payment.order_id);

    if (updateOrderError) {
      console.error('Error updating order status:', updateOrderError);
      return;
    }

    console.log(`Payment expired for order ${payment.order_id}`);

  } catch (error) {
    console.error('Error handling payment expired:', error);
  }
}
