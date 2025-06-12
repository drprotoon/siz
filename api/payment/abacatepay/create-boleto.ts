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

    if (!customerInfo || !customerInfo.name || !customerInfo.email || !customerInfo.document) {
      return res.status(400).json({ error: 'Informações do cliente com CPF são obrigatórias para boleto' });
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
      payment_method: 'boleto',
      customer: {
        name: customerInfo.name,
        email: customerInfo.email,
        document: customerInfo.document.replace(/\D/g, ''), // Remove caracteres não numéricos
        phone: customerInfo.phone || ''
      },
      webhook_url: `${process.env.WEBHOOK_BASE_URL || 'https://siz-cosmetic-store-pro.vercel.app'}/api/webhook/abacatepay?webhookSecret=${process.env.ABACATEPAY_WEBHOOK_SECRET}`,
      metadata: {
        orderId: orderId.toString(),
        customerInfo: customerInfo
      }
    };

    console.log('Creating AbacatePay boleto payment:', { 
      amount: paymentData.amount, 
      orderId, 
      customerName: customerInfo.name
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
    console.log('AbacatePay boleto response:', abacatePayment);

    // Salvar informações do pagamento no Supabase
    try {
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          order_id: orderId,
          payment_method: 'boleto',
          payment_provider: 'abacatepay',
          external_payment_id: abacatePayment.id,
          amount: amount,
          currency: 'BRL',
          status: 'pending',
          boleto_url: abacatePayment.boleto_url || null,
          boleto_barcode: abacatePayment.boleto_barcode || null,
          expires_at: abacatePayment.expires_at ? new Date(abacatePayment.expires_at) : null,
          customer_info: JSON.stringify(customerInfo),
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
      amount: amount,
      status: 'pending',
      boletoUrl: abacatePayment.boleto_url || '',
      boletoBarcode: abacatePayment.boleto_barcode || '',
      expiresAt: abacatePayment.expires_at || null
    };

    return res.status(200).json(formattedResponse);

  } catch (error) {
    console.error('AbacatePay create boleto payment error:', error);
    
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
