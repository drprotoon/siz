import { apiRequest } from "./queryClient";

/**
 * Interface for payment methods
 */
export interface PaymentMethod {
  id: string;
  name: string;
  type: "credit_card" | "boleto" | "pix";
  icon?: string;
}

/**
 * Interface for payment intent
 */
export interface PaymentIntent {
  id: string;
  status: "pending" | "completed" | "failed";
  amount: number;
}

/**
 * Available payment methods
 */
export const paymentMethods: PaymentMethod[] = [
  {
    id: "credit_card",
    name: "Cartão de Crédito/Débito",
    type: "credit_card",
    icon: "credit-card"
  },
  {
    id: "boleto",
    name: "Boleto Bancário",
    type: "boleto",
    icon: "file-text"
  },
  {
    id: "pix",
    name: "PIX (AbacatePay)",
    type: "pix",
    icon: "qr-code"
  }
];

/**
 * Create a payment intent
 *
 * @param amount - The amount to charge
 * @returns PaymentIntent
 */
export async function createPaymentIntent(amount: number): Promise<PaymentIntent> {
  try {
    const response = await apiRequest(
      "POST",
      "/api/payment/create-intent",
      { amount }
    );

    return await response.json();
  } catch (error) {
    console.error("Error creating payment intent:", error);
    throw new Error("Failed to initialize payment. Please try again.");
  }
}

/**
 * Process a payment with payment ID
 *
 * @param paymentId - The payment intent ID
 * @returns PaymentIntent with updated status
 */
export async function processPaymentIntent(paymentId: string): Promise<PaymentIntent> {
  try {
    const response = await apiRequest(
      "POST",
      "/api/payment/process",
      { paymentId }
    );

    return await response.json();
  } catch (error) {
    console.error("Error processing payment:", error);
    throw new Error("Payment processing failed. Please try again.");
  }
}

/**
 * Payment request interface
 */
export interface PaymentRequest {
  amount: number;
  method: string;
  currency: string;
  cardDetails?: {
    number?: string;
    name?: string;
    expiry?: string;
    cvc?: string;
  };
}

/**
 * Payment response interface
 */
export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  message?: string;
  error?: string;
}

/**
 * Simulate a payment process (for demo purposes)
 *
 * @param request - The payment request
 * @returns An object indicating success or failure
 */
export async function processPayment(request: PaymentRequest): Promise<PaymentResponse> {
  // This is a simulated payment process for demo purposes
  // In a real application, this would integrate with a payment gateway

  return new Promise((resolve) => {
    // Simulate API delay
    setTimeout(() => {
      // Generate a random transaction ID
      const transactionId = Math.random().toString(36).substring(2, 15) +
                            Math.random().toString(36).substring(2, 15);

      // Simulate successful payment 90% of the time
      const isSuccessful = Math.random() < 0.9;

      if (isSuccessful) {
        resolve({
          success: true,
          transactionId,
          message: "Pagamento processado com sucesso"
        });
      } else {
        resolve({
          success: false,
          error: "Falha no processamento do pagamento. Por favor, tente novamente."
        });
      }
    }, 1500);
  });
}

/**
 * Validate credit card details
 * This is a simple validation function for demonstration purposes
 */
export function validateCreditCard(cardDetails: {
  number: string;
  name: string;
  expiry: string;
  cvc: string;
}): { valid: boolean; error?: string } {
  // Validate card number (simple Luhn algorithm check)
  if (!cardDetails.number || !isValidCardNumber(cardDetails.number)) {
    return { valid: false, error: "Número de cartão inválido" };
  }

  // Validate name
  if (!cardDetails.name || cardDetails.name.trim().length < 3) {
    return { valid: false, error: "Nome do titular inválido" };
  }

  // Validate expiry (format MM/YY)
  if (!cardDetails.expiry || !isValidExpiry(cardDetails.expiry)) {
    return { valid: false, error: "Data de validade inválida" };
  }

  // Validate CVC (3-4 digits)
  if (!cardDetails.cvc || !/^\d{3,4}$/.test(cardDetails.cvc)) {
    return { valid: false, error: "Código de segurança inválido" };
  }

  return { valid: true };
}

/**
 * Check if a credit card number is valid using the Luhn algorithm
 */
function isValidCardNumber(number: string): boolean {
  // Remove spaces and non-digit characters
  const digits = number.replace(/\D/g, '');

  // Check if the number has a valid length
  if (digits.length < 13 || digits.length > 19) {
    return false;
  }

  // Luhn algorithm
  let sum = 0;
  let shouldDouble = false;

  // Loop through digits in reverse order
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i));

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

/**
 * Check if an expiry date is valid and not expired
 */
function isValidExpiry(expiry: string): boolean {
  // Check format (MM/YY)
  if (!/^\d{2}\/\d{2}$/.test(expiry)) {
    return false;
  }

  const [monthStr, yearStr] = expiry.split('/');
  const month = parseInt(monthStr);
  const year = parseInt('20' + yearStr); // Convert to 4-digit year

  // Check if month is valid
  if (month < 1 || month > 12) {
    return false;
  }

  // Get current date
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // getMonth() returns 0-11
  const currentYear = now.getFullYear();

  // Check if the card is not expired
  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return false;
  }

  return true;
}

/**
 * Format a credit card number with spaces
 */
export function formatCardNumber(number: string): string {
  const digits = number.replace(/\D/g, '');
  const groups = [];

  for (let i = 0; i < digits.length; i += 4) {
    groups.push(digits.substring(i, i + 4));
  }

  return groups.join(' ');
}

/**
 * Format an expiry date (MM/YY)
 */
export function formatExpiry(expiry: string): string {
  const digits = expiry.replace(/\D/g, '');

  if (digits.length <= 2) {
    return digits;
  }

  return `${digits.substring(0, 2)}/${digits.substring(2, 4)}`;
}
