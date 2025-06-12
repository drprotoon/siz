import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHash } from 'https://deno.land/std@0.168.0/node/crypto.ts'

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

    // Only handle POST requests for webhooks
    if (method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get webhook secret from environment
    const webhookSecret = Deno.env.get('ABACATEPAY_WEBHOOK_SECRET')
    
    if (!webhookSecret) {
      console.error('ABACATEPAY_WEBHOOK_SECRET not configured')
      return new Response(
        JSON.stringify({ error: 'Webhook secret not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get the raw body for signature verification
    const rawBody = await req.text()
    let webhookData

    try {
      webhookData = JSON.parse(rawBody)
    } catch (error) {
      console.error('Invalid JSON in webhook body:', error)
      return new Response(
        JSON.stringify({ error: 'Invalid JSON' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify webhook signature (if AbacatePay provides one)
    const signature = req.headers.get('x-abacatepay-signature')
    if (signature) {
      const expectedSignature = createHash('sha256')
        .update(rawBody + webhookSecret)
        .digest('hex')
      
      if (signature !== expectedSignature) {
        console.error('Invalid webhook signature')
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    console.log('Received AbacatePay webhook:', webhookData)

    // Process different webhook events
    const eventType = webhookData.event || webhookData.type
    
    if (eventType === 'billing.paid') {
      await handlePaymentPaid(supabaseClient, webhookData)
    } else if (eventType === 'billing.failed') {
      await handlePaymentFailed(supabaseClient, webhookData)
    } else if (eventType === 'billing.expired') {
      await handlePaymentExpired(supabaseClient, webhookData)
    } else {
      console.log('Unhandled webhook event type:', eventType)
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook processed successfully' }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Webhook processing error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function handlePaymentPaid(supabaseClient: any, data: any) {
  try {
    console.log('Processing payment paid event:', data)

    const pixQrCode = data.pixQrCode || data.payment
    const paymentData = data.payment || data

    if (!pixQrCode || !pixQrCode.id) {
      console.error('Invalid payment data received from AbacatePay')
      return
    }

    // Buscar informações do pagamento na tabela payments
    const { data: payment, error: paymentError } = await supabaseClient
      .from('payments')
      .select('id, order_id')
      .eq('external_payment_id', pixQrCode.id)
      .single()

    if (paymentError || !payment) {
      console.error('Payment not found in database:', pixQrCode.id, paymentError)
      return
    }

    // Atualizar status do pagamento
    const { error: updatePaymentError } = await supabaseClient
      .from('payments')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        webhook_data: JSON.stringify(data),
        updated_at: new Date().toISOString()
      })
      .eq('id', payment.id)

    if (updatePaymentError) {
      console.error('Error updating payment status:', updatePaymentError)
      return
    }

    // Atualizar status do pedido
    const { error: updateOrderError } = await supabaseClient
      .from('orders')
      .update({
        status: 'paid',
        payment_id: pixQrCode.id
      })
      .eq('id', payment.order_id)

    if (updateOrderError) {
      console.error('Error updating order status:', updateOrderError)
      return
    }

    console.log(`Payment ${pixQrCode.id} marked as paid successfully`)

  } catch (error) {
    console.error('Error handling payment paid event:', error)
  }
}

async function handlePaymentFailed(supabaseClient: any, data: any) {
  try {
    console.log('Processing payment failed event:', data)

    const paymentData = data.payment || data
    if (!paymentData || !paymentData.id) {
      console.error('Invalid payment data received from AbacatePay')
      return
    }

    // Buscar informações do pagamento na tabela payments
    const { data: payment, error: paymentError } = await supabaseClient
      .from('payments')
      .select('id, order_id')
      .eq('external_payment_id', paymentData.id)
      .single()

    if (paymentError || !payment) {
      console.error('Payment not found in database:', paymentData.id, paymentError)
      return
    }

    // Atualizar status do pagamento
    const { error: updatePaymentError } = await supabaseClient
      .from('payments')
      .update({
        status: 'failed',
        failed_at: new Date().toISOString(),
        failure_reason: data.reason || 'Payment failed',
        webhook_data: JSON.stringify(data),
        updated_at: new Date().toISOString()
      })
      .eq('id', payment.id)

    if (updatePaymentError) {
      console.error('Error updating payment status:', updatePaymentError)
      return
    }

    // Atualizar status do pedido
    const { error: updateOrderError } = await supabaseClient
      .from('orders')
      .update({
        status: 'payment_failed'
      })
      .eq('id', payment.order_id)

    if (updateOrderError) {
      console.error('Error updating order status:', updateOrderError)
      return
    }

    console.log(`Payment ${paymentData.id} marked as failed successfully`)

  } catch (error) {
    console.error('Error handling payment failed event:', error)
  }
}

async function handlePaymentExpired(supabaseClient: any, data: any) {
  try {
    console.log('Processing payment expired event:', data)

    const paymentData = data.payment || data
    if (!paymentData || !paymentData.id) {
      console.error('Invalid payment data received from AbacatePay')
      return
    }

    // Buscar informações do pagamento na tabela payments
    const { data: payment, error: paymentError } = await supabaseClient
      .from('payments')
      .select('id, order_id')
      .eq('external_payment_id', paymentData.id)
      .single()

    if (paymentError || !payment) {
      console.error('Payment not found in database:', paymentData.id, paymentError)
      return
    }

    // Atualizar status do pagamento
    const { error: updatePaymentError } = await supabaseClient
      .from('payments')
      .update({
        status: 'expired',
        webhook_data: JSON.stringify(data),
        updated_at: new Date().toISOString()
      })
      .eq('id', payment.id)

    if (updatePaymentError) {
      console.error('Error updating payment status:', updatePaymentError)
      return
    }

    // Atualizar status do pedido
    const { error: updateOrderError } = await supabaseClient
      .from('orders')
      .update({
        status: 'payment_expired'
      })
      .eq('id', payment.order_id)

    if (updateOrderError) {
      console.error('Error updating order status:', updateOrderError)
      return
    }

    console.log(`Payment ${paymentData.id} marked as expired successfully`)

  } catch (error) {
    console.error('Error handling payment expired event:', error)
  }
}
