import { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { supabase } from './lib/supabase';

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
    const { amount, orderId, customerInfo, paymentMethod, cardDetails } = req.body;

    // Validações básicas
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Valor inválido' });
    }

    if (!orderId) {
      return res.status(400).json({ error: 'ID do pedido é obrigatório' });
    }

    if (!paymentMethod || !['pix', 'credit_card', 'boleto'].includes(paymentMethod)) {
      return res.status(400).json({ error: 'Método de pagamento inválido' });
    }

    // Validações específicas por método de pagamento
    if (paymentMethod === 'credit_card') {
      if (!cardDetails || !cardDetails.number || !cardDetails.name || !cardDetails.expiry || !cardDetails.cvc) {
        return res.status(400).json({ error: 'Dados do cartão são obrigatórios' });
      }
    }

    if (paymentMethod === 'boleto') {
      if (!customerInfo || !customerInfo.name || !customerInfo.email || !customerInfo.document) {
        return res.status(400).json({ error: 'Informações do cliente com CPF são obrigatórias para boleto' });
      }
    }

    // Configurações do AbacatePay
    const abacatePayApiUrl = process.env.ABACATEPAY_API_URL || 'https://api.abacatepay.com';
    const abacatePayApiKey = process.env.ABACATEPAY_API_KEY;

    if (!abacatePayApiKey) {
      console.error('ABACATEPAY_API_KEY not configured');
      return res.status(500).json({ error: 'Configuração de pagamento não encontrada' });
    }

    // Preparar dados base para o AbacatePay
    const basePaymentData = {
      amount: Math.round(amount * 100), // AbacatePay espera valor em centavos
      currency: 'BRL',
      payment_method: paymentMethod,
      webhook_url: `${process.env.WEBHOOK_BASE_URL || 'https://sizcosmeticos.vercel.app'}/api/webhook/abacatepay?webhookSecret=${process.env.ABACATEPAY_WEBHOOK_SECRET}`,
      metadata: {
        orderId: orderId.toString(),
        customerInfo: customerInfo || {}
      }
    };

    // Adicionar dados específicos por método de pagamento
    let paymentData = { ...basePaymentData };

    if (paymentMethod === 'credit_card') {
      paymentData.card = {
        number: cardDetails.number.replace(/\s/g, ''),
        holder_name: cardDetails.name,
        exp_month: cardDetails.expiry.split('/')[0],
        exp_year: cardDetails.expiry.split('/')[1],
        cvv: cardDetails.cvc
      };
    }

    if (paymentMethod === 'boleto') {
      paymentData.customer = {
        name: customerInfo.name,
        email: customerInfo.email,
        document: customerInfo.document.replace(/\D/g, ''), // Remove caracteres não numéricos
        phone: customerInfo.phone || ''
      };
    }

    console.log(`Creating AbacatePay ${paymentMethod} payment:`, { 
      amount: paymentData.amount, 
      orderId, 
      paymentMethod
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
    console.log(`AbacatePay ${paymentMethod} response:`, abacatePayment);

    // Preparar dados para salvar no banco
    const paymentRecord = {
      order_id: orderId,
      payment_method: paymentMethod,
      payment_provider: 'abacatepay',
      external_payment_id: abacatePayment.id,
      amount: amount,
      currency: 'BRL',
      status: abacatePayment.status || 'pending',
      customer_info: JSON.stringify(customerInfo || {}),
      metadata: JSON.stringify({ abacatePaymentData: abacatePayment })
    };

    // Adicionar campos específicos por método de pagamento
    if (paymentMethod === 'pix') {
      paymentRecord.pix_qr_code = abacatePayment.pix_qr_code || null;
      paymentRecord.pix_qr_code_text = abacatePayment.pix_qr_code_text || null;
      paymentRecord.expires_at = abacatePayment.expires_at ? new Date(abacatePayment.expires_at) : null;
    }

    if (paymentMethod === 'credit_card') {
      paymentRecord.card_last_four = cardDetails.number.slice(-4);
    }

    if (paymentMethod === 'boleto') {
      paymentRecord.boleto_url = abacatePayment.boleto_url || null;
      paymentRecord.boleto_barcode = abacatePayment.boleto_barcode || null;
      paymentRecord.expires_at = abacatePayment.expires_at ? new Date(abacatePayment.expires_at) : null;
    }

    // Salvar informações do pagamento no Supabase
    try {
      const { error: paymentError } = await supabase
        .from('payments')
        .insert(paymentRecord);

      if (paymentError) {
        console.error('Error saving payment to database:', paymentError);
        // Não falhar a requisição, apenas logar o erro
      }
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Não falhar a requisição, apenas logar o erro
    }

    // Preparar resposta formatada para o frontend
    let formattedResponse = {
      id: abacatePayment.id,
      amount: amount,
      status: abacatePayment.status || 'pending',
      paymentMethod: paymentMethod
    };

    // Adicionar campos específicos na resposta
    if (paymentMethod === 'pix') {
      formattedResponse.qrCode = abacatePayment.pix_qr_code || '';
      formattedResponse.qrCodeText = abacatePayment.pix_qr_code_text || '';
      formattedResponse.expiresAt = abacatePayment.expires_at || null;
    }

    if (paymentMethod === 'credit_card') {
      formattedResponse.cardLast4 = cardDetails.number.slice(-4);
      formattedResponse.transactionId = abacatePayment.transaction_id || abacatePayment.id;
    }

    if (paymentMethod === 'boleto') {
      formattedResponse.boletoUrl = abacatePayment.boleto_url || '';
      formattedResponse.boletoBarcode = abacatePayment.boleto_barcode || '';
      formattedResponse.expiresAt = abacatePayment.expires_at || null;
    }

    return res.status(200).json(formattedResponse);

  } catch (error) {
    console.error('AbacatePay payment error:', error);
    
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
