import { apiRequest } from "./queryClient";

interface FreightOption {
  name: string;
  price: number;
  estimatedDays: string;
}

interface FreightCalculationResponse {
  options: FreightOption[];
  postalCode: string;
}

/**
 * Calculate shipping options based on postal code and weight
 * 
 * @param postalCode - The destination postal code
 * @param weight - The weight of the product(s) in grams
 * @returns FreightCalculationResponse with available shipping options
 */
export async function calculateFreight(
  postalCode: string,
  weight: number
): Promise<FreightCalculationResponse> {
  try {
    const response = await apiRequest(
      "POST",
      "/api/freight/calculate",
      { postalCode, weight }
    );
    
    return await response.json();
  } catch (error) {
    console.error("Error calculating freight:", error);
    throw new Error("Failed to calculate shipping options. Please try again.");
  }
}

/**
 * Validate a postal code format
 * 
 * @param postalCode - The postal code to validate
 * @returns boolean indicating if the format is valid
 */
export function isValidPostalCode(postalCode: string): boolean {
  // This is a simple validation for Brazil postal codes
  // In a real app, you would use a more robust validation based on the country
  const brazilPattern = /^[0-9]{5}-?[0-9]{3}$/;
  return brazilPattern.test(postalCode);
}

/**
 * Format a postal code to the standard format
 * 
 * @param postalCode - The postal code to format
 * @returns formatted postal code
 */
export function formatPostalCode(postalCode: string): string {
  // Format Brazil postal code as 00000-000
  // Remove any non-digits first
  const digits = postalCode.replace(/\D/g, '');
  
  if (digits.length === 8) {
    return `${digits.substring(0, 5)}-${digits.substring(5)}`;
  }
  
  return postalCode;
}
