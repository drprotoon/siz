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
    name: "Credit/Debit Card",
    type: "credit_card",
    icon: "credit-card"
  },
  {
    id: "boleto",
    name: "Boleto",
    type: "boleto",
    icon: "file-text"
  },
  {
    id: "pix",
    name: "Pix",
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
 * Simulate a payment process (for demo purposes)
 * 
 * @param amount - The amount to charge
 * @returns An object indicating success or failure
 */
export async function processPayment(amount: number): Promise<{success: boolean, message?: string}> {
  // This is a simulated payment process for demo purposes
  // In a real application, this would integrate with a payment gateway
  
  return new Promise((resolve) => {
    // Simulate API delay
    setTimeout(() => {
      // Simulate successful payment 90% of the time
      const isSuccessful = Math.random() < 0.9;
      
      if (isSuccessful) {
        resolve({
          success: true
        });
      } else {
        resolve({
          success: false,
          message: "Payment processing failed. Please try again."
        });
      }
    }, 1500);
  });
}
