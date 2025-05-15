import { FreightCalculationResponse, FreightOption } from "@shared/schema";
import { calculateShippingWithCorreios, getFallbackShippingOptions } from "./correios";
import axios from "axios";
import { FrenetShippingService } from "../client/src/lib/frenetService";

/**
 * Interface para provedores de cálculo de frete
 */
export interface ShippingProvider {
  calculateShipping(postalCode: string, weight: number): Promise<FreightOption[]>;
  getName(): string;
}

/**
 * Provedor de frete dos Correios
 */
export class CorreiosShippingProvider implements ShippingProvider {
  async calculateShipping(postalCode: string, weight: number): Promise<FreightOption[]> {
    try {
      const response = await calculateShippingWithCorreios(postalCode, weight);
      return response.options;
    } catch (error) {
      console.error(`Erro ao calcular frete com ${this.getName()}:`, error);
      return [];
    }
  }

  getName(): string {
    return "Correios";
  }
}

/**
 * Provedor de frete Jadlog
 * Implementação simulada - em um ambiente real, isso chamaria a API da Jadlog
 */
export class JadlogShippingProvider implements ShippingProvider {
  async calculateShipping(postalCode: string, weight: number): Promise<FreightOption[]> {
    // Simulação de cálculo de frete da Jadlog
    const basePrice = Math.round(weight * 0.04 * 100) / 100; // R$ 0,04 por grama

    return [
      {
        name: "Jadlog .package",
        price: basePrice + 18.90,
        estimatedDays: "3-5 dias úteis"
      },
      {
        name: "Jadlog .com",
        price: basePrice + 29.90,
        estimatedDays: "1-2 dias úteis"
      }
    ];
  }

  getName(): string {
    return "Jadlog";
  }
}

/**
 * Provedor de frete Total Express
 * Implementação simulada - em um ambiente real, isso chamaria a API da Total Express
 */
export class TotalExpressShippingProvider implements ShippingProvider {
  async calculateShipping(postalCode: string, weight: number): Promise<FreightOption[]> {
    // Simulação de cálculo de frete da Total Express
    const basePrice = Math.round(weight * 0.045 * 100) / 100; // R$ 0,045 por grama

    return [
      {
        name: "Total Express Econômico",
        price: basePrice + 20.90,
        estimatedDays: "4-6 dias úteis"
      },
      {
        name: "Total Express Rápido",
        price: basePrice + 32.90,
        estimatedDays: "2-3 dias úteis"
      }
    ];
  }

  getName(): string {
    return "Total Express";
  }
}

/**
 * Provedor de frete Frenet
 * Implementação real que chama a API da Frenet
 */
export class FrenetShippingProvider implements ShippingProvider {
  private apiToken: string;
  private apiUrl: string;
  private sellerCEP: string;

  constructor(apiToken: string = "13B9E436RD32DR455ERAC99R93357F8D6640",
              apiUrl: string = "https://api.frenet.com.br",
              sellerCEP: string = "74591-990") {
    this.apiToken = apiToken;
    this.apiUrl = apiUrl;
    this.sellerCEP = sellerCEP;
  }

  async calculateShipping(postalCode: string, weight: number): Promise<FreightOption[]> {
    try {
      // Formatar o CEP (remover caracteres não numéricos)
      const formattedPostalCode = postalCode.replace(/\D/g, '');

      // Validar CEP
      if (formattedPostalCode.length !== 8) {
        throw new Error('CEP inválido');
      }

      // Calcular peso total em kg (converter de gramas para kg)
      const weightInKg = weight / 1000;

      // Calcular dimensões baseadas no peso
      // Estas são estimativas - em um ambiente real, você teria as dimensões reais dos produtos
      const height = Math.max(2, Math.ceil(weightInKg * 2));
      const length = Math.max(15, Math.ceil(weightInKg * 10));
      const width = Math.max(10, Math.ceil(weightInKg * 8));

      // Preparar os dados para a requisição conforme o exemplo fornecido
      const requestData = {
        SellerCEP: this.sellerCEP,
        RecipientCEP: formattedPostalCode,
        ShipmentInvoiceValue: 100, // Valor padrão para cálculo
        ShippingServiceCode: null,
        ShippingItemArray: [
          {
            Height: height,
            Length: length,
            Width: width,
            Weight: weightInKg,
            Quantity: 1,
            SKU: "PROD_" + Math.floor(Math.random() * 10000),
            Category: "Cosmetics"
          }
        ],
        RecipientCountry: "BR"
      };

      console.log("Enviando requisição para Frenet:", JSON.stringify(requestData));

      // Fazer a requisição para a API da Frenet
      const response = await axios.post(`${this.apiUrl}/shipping/quote`, requestData, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'token': this.apiToken
        }
      });

      console.log("Resposta da Frenet:", JSON.stringify(response.data));

      // Verificar se a resposta é válida
      if (!response.data || !response.data.ShippingSevicesArray) {
        throw new Error('Resposta inválida da API da Frenet');
      }

      // Filtrar serviços válidos (sem erro e com preço)
      const validServices = response.data.ShippingSevicesArray.filter(
        (service: FrenetShippingService) => !service.Error && service.ShippingPrice > 0
      );

      // Converter para o formato FreightOption
      return validServices.map((service: FrenetShippingService) => ({
        name: `${service.Carrier} - ${service.ServiceDescription}`,
        price: service.ShippingPrice,
        estimatedDays: `${service.DeliveryTime} dias úteis`
      }));
    } catch (error) {
      console.error(`Erro ao calcular frete com ${this.getName()}:`, error);
      return [];
    }
  }

  async getShippingInfo(): Promise<any> {
    try {
      const response = await axios.get(`${this.apiUrl}/shipping/info`, {
        headers: {
          'Accept': 'application/json',
          'token': this.apiToken
        }
      });

      return response.data;
    } catch (error) {
      console.error(`Erro ao obter informações de frete com ${this.getName()}:`, error);
      return null;
    }
  }

  getName(): string {
    return "Frenet";
  }
}

/**
 * Gerenciador de provedores de frete
 */
export class ShippingManager {
  private providers: ShippingProvider[] = [];

  constructor() {
    // Adicionar provedores padrão
    this.addProvider(new CorreiosShippingProvider());
    this.addProvider(new JadlogShippingProvider());
    this.addProvider(new TotalExpressShippingProvider());
    this.addProvider(new FrenetShippingProvider());
  }

  addProvider(provider: ShippingProvider): void {
    this.providers.push(provider);
  }

  async calculateAllOptions(postalCode: string, weight: number): Promise<FreightOption[]> {
    const allOptions: FreightOption[] = [];

    // Calcular opções de todos os provedores em paralelo
    const providerPromises = this.providers.map(async (provider) => {
      try {
        const options = await provider.calculateShipping(postalCode, weight);
        // Adicionar o nome do provedor às opções
        return options.map(option => ({
          ...option,
          name: `${provider.getName()} - ${option.name}`
        }));
      } catch (error) {
        console.error(`Erro ao calcular frete com ${provider.getName()}:`, error);
        return [];
      }
    });

    // Aguardar todas as promessas e combinar os resultados
    const results = await Promise.all(providerPromises);
    results.forEach(options => allOptions.push(...options));

    // Ordenar por preço
    return allOptions.sort((a, b) => a.price - b.price);
  }
}

// Instância global do gerenciador de frete
const shippingManager = new ShippingManager();

/**
 * Calculate shipping options based on total weight and destination postal code
 *
 * @param totalWeight - Total weight of the order in grams
 * @param postalCode - Destination postal code
 * @returns Available shipping options with prices
 */
export async function calculateShipping(totalWeight: number, postalCode: string): Promise<FreightCalculationResponse> {
  // Validate inputs
  if (totalWeight <= 0) {
    throw new Error("Total weight must be greater than zero");
  }

  if (!postalCode || postalCode.length < 5) {
    throw new Error("Invalid postal code");
  }

  // Format postal code (remove non-numeric characters)
  const formattedPostalCode = postalCode.replace(/\D/g, "");

  try {
    // Calcular opções de frete de todos os provedores
    const options = await shippingManager.calculateAllOptions(formattedPostalCode, totalWeight);

    if (options.length === 0) {
      // Se nenhuma opção for retornada, usar valores de fallback
      return {
        options: getFallbackShippingOptions(totalWeight),
        postalCode: formattedPostalCode
      };
    }

    return {
      options,
      postalCode: formattedPostalCode
    };
  } catch (error) {
    console.error("Erro ao calcular frete:", error);

    // Em caso de falha, usar valores de fallback
    const options = getFallbackShippingOptions(totalWeight);

    return {
      options,
      postalCode: formattedPostalCode
    };
  }
}

/**
 * Calculate free shipping eligibility
 *
 * @param orderTotal - Total order value
 * @returns Whether the order is eligible for free shipping
 */
export function isEligibleForFreeShipping(orderTotal: number): boolean {
  // Orders over R$200 are eligible for free standard shipping
  return orderTotal >= 200;
}

/**
 * Apply free shipping to shipping options if eligible
 *
 * @param shippingOptions - Available shipping options
 * @param orderTotal - Total order value
 * @returns Updated shipping options with free shipping applied if eligible
 */
export function applyFreeShipping(shippingOptions: FreightOption[], orderTotal: number): FreightOption[] {
  if (isEligibleForFreeShipping(orderTotal)) {
    return shippingOptions.map(option => {
      if (option.name === "Entrega Padrão") {
        return { ...option, price: 0, name: "Entrega Padrão (Grátis)" };
      }
      return option;
    });
  }

  return shippingOptions;
}
