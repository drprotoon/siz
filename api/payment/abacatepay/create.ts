import { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { supabase } from '../../lib/supabase';

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
    const { amount, orderId, customerInfo } = req.body;

    // Validações
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Valor inválido' });
    }

    if (!orderId) {
      return res.status(400).json({ error: 'ID do pedido é obrigatório' });
    }

    // Configurações do AbacatePay
    const abacatePayApiUrl = process.env.ABACATEPAY_API_URL || 'https://api.abacatepay.com';
    const abacatePayApiKey = process.env.ABACATEPAY_API_KEY;

    if (!abacatePayApiKey) {
      console.error('ABACATEPAY_API_KEY not configured');
      return res.status(500).json({ error: 'Configuração de pagamento não encontrada' });
    }

    // Preparar dados para o AbacatePay
    const paymentData = {
      amount: Math.round(amount * 100), // AbacatePay espera valor em centavos
      currency: 'BRL',
      payment_method: 'pix',
      webhook_url: `${process.env.WEBHOOK_BASE_URL || 'https://siz-cosmetic-store-pro.vercel.app'}/api/webhook/abacatepay?webhookSecret=${process.env.ABACATEPAY_WEBHOOK_SECRET}`,
      metadata: {
        orderId: orderId.toString(),
        customerInfo: customerInfo || {}
      }
    };

    console.log('Creating AbacatePay payment:', { 
      amount: paymentData.amount, 
      orderId, 
      webhook_url: paymentData.webhook_url 
    });

    // Fazer requisição para o AbacatePay
    const response = await axios.post(`${abacatePayApiUrl}/v1/billing`, paymentData, {
      headers: {
        'Authorization': `Bearer ${abacatePayApiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 segundos de timeout
    });

    const abacatePayment = response.data;
    console.log('AbacatePay response:', abacatePayment);

    // Salvar informações do pagamento no Supabase
    try {
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          order_id: orderId,
          payment_method: 'pix',
          payment_provider: 'abacatepay',
          external_payment_id: abacatePayment.id,
          amount: amount,
          currency: 'BRL',
          status: 'pending',
          pix_qr_code: abacatePayment.pix_qr_code || null,
          pix_qr_code_text: abacatePayment.pix_qr_code_text || null,
          expires_at: abacatePayment.expires_at ? new Date(abacatePayment.expires_at) : null,
          customer_info: JSON.stringify(customerInfo || {}),
          metadata: JSON.stringify({ abacatePaymentData: abacatePayment })
        });

      if (paymentError) {
        console.error('Error saving payment to database:', paymentError);
        // Não falhar a requisição, apenas logar o erro
      }
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Não falhar a requisição, apenas logar o erro
    }

    // Retornar resposta formatada para o frontend
    const formattedResponse = {
      id: abacatePayment.id,
      qrCode: abacatePayment.pix_qr_code || '',
      qrCodeText: abacatePayment.pix_qr_code_text || '',
      amount: amount,
      status: 'pending',
      expiresAt: abacatePayment.expires_at || null
    };

    return res.status(200).json(formattedResponse);

  } catch (error) {
    console.error('AbacatePay create payment error:', error);
    
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.message || 'Erro na comunicação com o provedor de pagamento';
      return res.status(status).json({ 
        error: message,
        details: error.response?.data
      });
    }

    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
