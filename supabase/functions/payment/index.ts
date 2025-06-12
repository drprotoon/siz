import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { method } = req
    const url = new URL(req.url)

    // Only handle POST requests for payment creation
    if (method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const body = await req.json()
    const { amount, orderId, customerInfo, paymentMethod, cardDetails } = body

    // Validações básicas
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Valor inválido' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'ID do pedido é obrigatório' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!paymentMethod || !['pix', 'credit_card', 'boleto'].includes(paymentMethod)) {
      return new Response(
        JSON.stringify({ error: 'Método de pagamento inválido' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validações específicas por método de pagamento
    if (paymentMethod === 'credit_card') {
      if (!cardDetails || !cardDetails.number || !cardDetails.name || !cardDetails.expiry || !cardDetails.cvc) {
        return new Response(
          JSON.stringify({ error: 'Dados do cartão são obrigatórios' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // Configurações do AbacatePay
    const abacatePayApiKey = Deno.env.get('ABACATEPAY_API_KEY')
    const abacatePayApiUrl = Deno.env.get('ABACATEPAY_API_URL') || 'https://api.abacatepay.com'
    const webhookBaseUrl = Deno.env.get('WEBHOOK_BASE_URL') || 'https://sizcosmeticos.vercel.app'
    const webhookSecret = Deno.env.get('ABACATEPAY_WEBHOOK_SECRET')

    if (!abacatePayApiKey) {
      return new Response(
        JSON.stringify({ error: 'AbacatePay API key não configurada' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Preparar dados base para o AbacatePay
    const basePaymentData = {
      amount: Math.round(amount * 100), // AbacatePay espera valor em centavos
      currency: 'BRL',
      payment_method: paymentMethod,
      webhook_url: `${webhookBaseUrl}/functions/v1/webhook-abacatepay`,
      metadata: {
        orderId: orderId.toString(),
        customerInfo: customerInfo || {}
      }
    }

    // Adicionar dados específicos por método de pagamento
    let paymentData = { ...basePaymentData }

    if (paymentMethod === 'credit_card') {
      paymentData.card = {
        number: cardDetails.number.replace(/\s/g, ''),
        holder_name: cardDetails.name,
        exp_month: cardDetails.expiry.split('/')[0],
        exp_year: cardDetails.expiry.split('/')[1],
        cvv: cardDetails.cvc
      }
    }

    if (paymentMethod === 'boleto') {
      paymentData.customer = {
        name: customerInfo.name,
        email: customerInfo.email,
        document: customerInfo.document.replace(/\D/g, ''), // Remove caracteres não numéricos
        phone: customerInfo.phone || ''
      }
    }

    console.log(`Creating AbacatePay ${paymentMethod} payment:`, { 
      amount: paymentData.amount, 
      orderId, 
      paymentMethod
    })

    // Fazer requisição para o AbacatePay
    const abacateResponse = await fetch(`${abacatePayApiUrl}/v1/billing`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${abacatePayApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentData)
    })

    if (!abacateResponse.ok) {
      const errorText = await abacateResponse.text()
      console.error('AbacatePay API error:', errorText)
      return new Response(
        JSON.stringify({ error: 'Erro ao processar pagamento' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const abacatePayment = await abacateResponse.json()
    console.log(`AbacatePay ${paymentMethod} response:`, abacatePayment)

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
    }

    // Adicionar campos específicos para PIX
    if (paymentMethod === 'pix' && abacatePayment.pixQrCode) {
      paymentRecord.pix_qr_code = abacatePayment.pixQrCode.qrCode
      paymentRecord.pix_qr_code_text = abacatePayment.pixQrCode.qrCodeText
      paymentRecord.expires_at = abacatePayment.pixQrCode.expiresAt
    }

    // Salvar no banco de dados
    const { data: savedPayment, error: dbError } = await supabaseClient
      .from('payments')
      .insert(paymentRecord)
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return new Response(
        JSON.stringify({ error: 'Erro ao salvar pagamento no banco de dados' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Preparar resposta baseada no método de pagamento
    let responseData = {
      id: abacatePayment.id,
      status: abacatePayment.status,
      amount: amount,
      paymentMethod: paymentMethod,
      databaseId: savedPayment.id
    }

    if (paymentMethod === 'pix' && abacatePayment.pixQrCode) {
      responseData = {
        ...responseData,
        qrCode: abacatePayment.pixQrCode.qrCode,
        qrCodeText: abacatePayment.pixQrCode.qrCodeText,
        expiresAt: abacatePayment.pixQrCode.expiresAt
      }
    }

    if (paymentMethod === 'boleto' && abacatePayment.boleto) {
      responseData = {
        ...responseData,
        boletoUrl: abacatePayment.boleto.url,
        boletoBarcode: abacatePayment.boleto.barcode,
        expiresAt: abacatePayment.boleto.expiresAt
      }
    }

    return new Response(
      JSON.stringify(responseData),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Payment processing error:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
