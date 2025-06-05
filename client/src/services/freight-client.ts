/**
 * CLIENTE UNIFICADO DE FRETE PARA FRONTEND
 * 
 * Este arquivo consolida todas as chamadas de frete do frontend,
 * eliminando duplicações entre freightService.ts e frenetService.ts
 * 
 * ANTES: 2 arquivos diferentes com lógicas duplicadas
 * DEPOIS: 1 cliente centralizado com interface consistente
 */

// ===== TIPOS =====

export interface FreightOption {
  name: string;
  price: number;
  estimatedDays: string;
}

export interface FreightCalculationResponse {
  options: FreightOption[];
  postalCode: string;
}

export interface FreightCalculationRequest {
  postalCode: string;
  weight: number;
  orderTotal?: number;
}

// ===== UTILITÁRIOS =====

/**
 * Formata CEP para exibição (00000-000)
 */
export function formatPostalCodeDisplay(postalCode: string): string {
  const cleaned = postalCode.replace(/\D/g, '');
  if (cleaned.length === 8) {
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
  }
  return postalCode;
}

/**
 * Valida CEP brasileiro
 */
export function validatePostalCode(postalCode: string): boolean {
  const cleaned = postalCode.replace(/\D/g, '');
  return cleaned.length === 8 && /^\d{8}$/.test(cleaned);
}

/**
 * Formata preço para exibição
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(price);
}

// ===== CLIENTE PRINCIPAL =====

/**
 * Cliente unificado para cálculo de frete
 * CONSOLIDAÇÃO: Substitui freightService.ts e frenetService.ts
 */
export class FreightClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  /**
   * Calcula opções de frete
   * OTIMIZAÇÃO: Interface única que substitui múltiplas funções
   */
  async calculateFreight(request: FreightCalculationRequest): Promise<FreightCalculationResponse> {
    // Validar entrada
    if (!validatePostalCode(request.postalCode)) {
      throw new Error('CEP inválido. Digite um CEP válido com 8 dígitos.');
    }

    if (request.weight <= 0) {
      throw new Error('Peso deve ser maior que zero.');
    }

    try {
      const response = await fetch(`${this.baseUrl}/freight/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postalCode: request.postalCode.replace(/\D/g, ''),
          weight: request.weight,
          orderTotal: request.orderTotal
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Validar resposta
      if (!data.options || !Array.isArray(data.options)) {
        throw new Error('Resposta inválida do servidor');
      }

      return data;
    } catch (error) {
      console.error('Erro ao calcular frete:', error);
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('Não foi possível calcular o frete. Tente novamente mais tarde.');
    }
  }

  /**
   * Calcula frete para múltiplos produtos (carrinho)
   * OTIMIZAÇÃO: Função específica para carrinho
   */
  async calculateCartFreight(
    postalCode: string, 
    cartItems: Array<{ weight: number; quantity: number; price: number }>
  ): Promise<FreightCalculationResponse> {
    // Calcular peso total e valor total
    const totalWeight = cartItems.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
    const totalValue = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return this.calculateFreight({
      postalCode,
      weight: totalWeight,
      orderTotal: totalValue
    });
  }

  /**
   * Busca informações de endereço por CEP
   * FUNCIONALIDADE ADICIONAL: Integração com ViaCEP
   */
  async getAddressByPostalCode(postalCode: string): Promise<any> {
    if (!validatePostalCode(postalCode)) {
      throw new Error('CEP inválido');
    }

    const cleanedCep = postalCode.replace(/\D/g, '');

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar endereço');
      }

      const data = await response.json();
      
      if (data.erro) {
        throw new Error('CEP não encontrado');
      }

      return {
        postalCode: data.cep,
        street: data.logradouro,
        neighborhood: data.bairro,
        city: data.localidade,
        state: data.uf,
        complement: data.complemento
      };
    } catch (error) {
      console.error('Erro ao buscar endereço:', error);
      throw new Error('Não foi possível buscar o endereço. Verifique o CEP e tente novamente.');
    }
  }
}

// ===== INSTÂNCIA SINGLETON =====

export const freightClient = new FreightClient();

// ===== HOOKS PARA REACT =====

/**
 * Hook para cálculo de frete com estado
 * OTIMIZAÇÃO: Hook reutilizável para componentes React
 */
export function useFreightCalculation() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FreightCalculationResponse | null>(null);

  const calculateFreight = async (request: FreightCalculationRequest) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await freightClient.calculateFreight(request);
      setResult(response);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
    setIsLoading(false);
  };

  return {
    calculateFreight,
    isLoading,
    error,
    result,
    reset
  };
}

// ===== EXPORTAÇÕES PARA COMPATIBILIDADE =====

/**
 * Função de compatibilidade com código existente
 * MIGRAÇÃO: Permite migração gradual do código existente
 */
export async function calculateFreight(postalCode: string, weight: number): Promise<FreightCalculationResponse> {
  return freightClient.calculateFreight({ postalCode, weight });
}

// Importação React para o hook
import { useState } from 'react';
