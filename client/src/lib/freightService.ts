/**
 * Validate a postal code format
 * 
 * @param postalCode - The postal code to validate
 * @returns boolean indicating if the format is valid
 */
export function isValidPostalCode(postalCode: string): boolean {
  // Format without mask: 8 digits
  if (/^\d{8}$/.test(postalCode)) {
    return true;
  }
  
  // Format with mask: 5 digits + hyphen + 3 digits
  if (/^\d{5}-\d{3}$/.test(postalCode)) {
    return true;
  }
  
  return false;
}

/**
 * Format a postal code to the standard format (00000-000)
 * 
 * @param postalCode - The postal code to format
 * @returns formatted postal code
 */
export function formatPostalCode(postalCode: string): string {
  // Remove any non-digits
  const digits = postalCode.replace(/\D/g, '');
  
  if (digits.length <= 5) {
    return digits;
  }
  
  // Insert hyphen after the first 5 digits
  return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
}

/**
 * Calculate shipping options based on postal code and weight
 * 
 * @param postalCode - The destination postal code
 * @param weight - The weight of the product(s) in grams
 * @returns FreightCalculationResponse with available shipping options
 */
export async function calculateFreight(postalCode: string, weight: number) {
  const response = await fetch('/api/freight/calculate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ postalCode, weight }),
  });
  
  if (!response.ok) {
    throw new Error('Falha ao calcular o frete');
  }
  
  return response.json();
}