// Funções de formatação e validação de CEP movidas para utils.ts

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