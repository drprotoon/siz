// Removed apiRequest import as we now use Supabase Edge Functions directly

/**
 * Interface para dados do cliente
 */
export interface CustomerInfo {
  name: string;
  email: string;
  document?: string;
  phone?: string;
}

/**
 * Interface para resposta do pagamento AbacatePay
 */
export interface AbacatePaymentResponse {
  id: string;
  qrCode: string;
  qrCodeText: string;
  amount: number;
  status: "pending" | "paid" | "failed" | "expired";
  expiresAt?: string;
}

/**
 * Interface para dados de criação do pagamento
 */
export interface CreateAbacatePaymentData {
  amount: number;
  orderId: number;
  customerInfo?: CustomerInfo;
  paymentMethod?: 'pix' | 'credit_card' | 'boleto';
  cardDetails?: {
    number: string;
    name: string;
    expiry: string;
    cvc: string;
  };
}

/**
 * Criar um pagamento via AbacatePay (PIX, Cartão ou Boleto)
 *
 * @param data - Dados do pagamento
 * @returns AbacatePaymentResponse
 */
export async function createAbacatePayment(data: CreateAbacatePaymentData): Promise<AbacatePaymentResponse> {
  try {
    console.log('Creating AbacatePay payment with data:', data);

    // Use Supabase Edge Function exclusively
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

    if (!supabaseUrl) {
      throw new Error('VITE_SUPABASE_URL not configured. Please configure Supabase environment variables.');
    }

    const endpoint = `${supabaseUrl}/functions/v1/payment`;
    console.log('Using Supabase Edge Function endpoint:', endpoint);

    // Fazer requisição para a Supabase Edge Function
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
    }

    const paymentResponse = await response.json();
    console.log('Payment response from Supabase Edge Function:', paymentResponse);

    return paymentResponse;
  } catch (error) {
    console.error("Error creating AbacatePay payment:", error);
    const paymentType = data.paymentMethod === 'credit_card' ? 'cartão' :
                       data.paymentMethod === 'boleto' ? 'boleto' : 'PIX';
    throw new Error(`Failed to create ${paymentType} payment. Please try again.`);
  }
}



/**
 * Verificar status do pagamento
 *
 * Note: Payment status is now tracked via webhooks and stored in the database.
 * This function is kept for compatibility but should be replaced with database queries.
 *
 * @param _paymentId - ID do pagamento (unused, kept for compatibility)
 * @returns Status do pagamento
 */
export async function checkPaymentStatus(_paymentId: string): Promise<{ status: string }> {
  try {
    // Payment status is now tracked via webhooks in the Supabase database
    // This function should be replaced with a direct database query or
    // a new Supabase Edge Function if real-time status checking is needed
    throw new Error("Payment status checking has been migrated to webhook-based updates. Check the payments table in the database for current status.");
  } catch (error) {
    console.error("Error checking payment status:", error);
    throw new Error("Payment status is now tracked via webhooks. Please check the order status instead.");
  }
}

/**
 * Gerar QR Code como imagem base64
 *
 * @param qrCodeText - Texto do QR Code PIX
 * @returns Promise<string> - Imagem base64 do QR Code
 */
export async function generateQRCodeImage(qrCodeText: string): Promise<string> {
  try {
    // Importar dinamicamente a biblioteca QRCode
    const QRCode = await import('qrcode');

    // Gerar QR Code como data URL
    const qrCodeDataURL = await QRCode.toDataURL(qrCodeText, {
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 256
    });

    return qrCodeDataURL;
  } catch (error) {
    console.error("Error generating QR code image:", error);

    // Fallback para SVG simples se a biblioteca falhar
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="white" stroke="#ccc"/>
        <text x="100" y="90" text-anchor="middle" font-family="Arial" font-size="12" fill="#666">
          QR Code PIX
        </text>
        <text x="100" y="110" text-anchor="middle" font-family="Arial" font-size="8" fill="#999">
          ${qrCodeText.substring(0, 20)}...
        </text>
        <text x="100" y="130" text-anchor="middle" font-family="Arial" font-size="8" fill="#999">
          Erro ao gerar QR Code
        </text>
      </svg>
    `)}`;
  }
}

/**
 * Copiar código PIX para a área de transferência
 *
 * @param pixCode - Código PIX para copiar
 */
export async function copyPixCode(pixCode: string): Promise<void> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(pixCode);
    } else {
      // Fallback para navegadores mais antigos
      const textArea = document.createElement("textarea");
      textArea.value = pixCode;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      textArea.remove();
    }
  } catch (error) {
    console.error("Error copying PIX code:", error);
    throw new Error("Failed to copy PIX code to clipboard");
  }
}

/**
 * Formatar valor monetário para exibição
 *
 * @param amount - Valor em reais
 * @returns String formatada
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(amount);
}

/**
 * Validar dados do cliente
 *
 * @param customerInfo - Dados do cliente
 * @returns boolean
 */
export function validateCustomerInfo(customerInfo: CustomerInfo): boolean {
  if (!customerInfo.name || customerInfo.name.trim().length < 2) {
    return false;
  }
  
  if (!customerInfo.email || !customerInfo.email.includes('@')) {
    return false;
  }
  
  return true;
}

/**
 * Calcular tempo restante para expiração
 *
 * @param expiresAt - Data de expiração
 * @returns Objeto com tempo restante
 */
export function calculateTimeRemaining(expiresAt: string): {
  minutes: number;
  seconds: number;
  expired: boolean;
} {
  const now = new Date().getTime();
  const expiration = new Date(expiresAt).getTime();
  const difference = expiration - now;

  if (difference <= 0) {
    return { minutes: 0, seconds: 0, expired: true };
  }

  const minutes = Math.floor(difference / (1000 * 60));
  const seconds = Math.floor((difference % (1000 * 60)) / 1000);

  return { minutes, seconds, expired: false };
}

/**
 * Criar pagamento com cartão de crédito via AbacatePay
 *
 * @param data - Dados do pagamento com cartão
 * @returns AbacatePaymentResponse
 */
export async function createCreditCardPayment(data: CreateAbacatePaymentData): Promise<AbacatePaymentResponse> {
  return createAbacatePayment({ ...data, paymentMethod: 'credit_card' });
}

/**
 * Criar pagamento com boleto via AbacatePay
 *
 * @param data - Dados do pagamento com boleto
 * @returns AbacatePaymentResponse
 */
export async function createBoletoPayment(data: CreateAbacatePaymentData): Promise<AbacatePaymentResponse> {
  return createAbacatePayment({ ...data, paymentMethod: 'boleto' });
}

/**
 * Criar pagamento PIX via AbacatePay
 *
 * @param data - Dados do pagamento PIX
 * @returns AbacatePaymentResponse
 */
export async function createPixPayment(data: CreateAbacatePaymentData): Promise<AbacatePaymentResponse> {
  return createAbacatePayment({ ...data, paymentMethod: 'pix' });
}
