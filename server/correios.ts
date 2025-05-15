import axios from 'axios';
import { FreightOption, FreightCalculationResponse } from '@shared/schema';
import { XMLParser } from 'fast-xml-parser';

// Códigos de serviço dos Correios
const CORREIOS_SERVICES = {
  PAC: '04510', // PAC
  SEDEX: '04014', // SEDEX
  SEDEX_10: '04790', // SEDEX 10
};

// Informações da empresa (fictícias para o exemplo)
const COMPANY_INFO = {
  CEP_ORIGEM: '01310100', // CEP de origem (São Paulo)
  EMPRESA_CODIGO: '', // Código da empresa (vazio para uso sem contrato)
  EMPRESA_SENHA: '', // Senha da empresa (vazio para uso sem contrato)
};

// Dimensões mínimas da embalagem
const MIN_PACKAGE_DIMENSIONS = {
  comprimento: 16, // cm
  largura: 11, // cm
  altura: 2, // cm
};

// Mapeamento de serviços para nomes amigáveis
const SERVICE_NAMES = {
  [CORREIOS_SERVICES.PAC]: 'PAC',
  [CORREIOS_SERVICES.SEDEX]: 'SEDEX',
  [CORREIOS_SERVICES.SEDEX_10]: 'SEDEX 10',
};

// Mapeamento de serviços para estimativas de dias
const SERVICE_DAYS = {
  [CORREIOS_SERVICES.PAC]: '4-9 dias úteis',
  [CORREIOS_SERVICES.SEDEX]: '1-3 dias úteis',
  [CORREIOS_SERVICES.SEDEX_10]: '1 dia útil (até 10h)',
};

/**
 * Calcula as dimensões da embalagem com base no peso
 * Esta é uma estimativa simples - em um sistema real, você teria dimensões reais dos produtos
 */
function calculatePackageDimensions(weightInGrams: number) {
  // Estimativa simples baseada no peso
  // Em um sistema real, você teria as dimensões reais dos produtos
  const weight = weightInGrams / 1000; // Converter para kg

  let dimensions = { ...MIN_PACKAGE_DIMENSIONS };

  if (weight > 0.5) {
    dimensions.altura = Math.max(dimensions.altura, Math.ceil(weight * 2));
  }

  if (weight > 2) {
    dimensions.largura = Math.max(dimensions.largura, Math.ceil(weight * 3));
    dimensions.comprimento = Math.max(dimensions.comprimento, Math.ceil(weight * 4));
  }

  return dimensions;
}

/**
 * Consulta a API dos Correios para calcular o frete
 */
export async function calculateCorreiosShipping(
  destinationCEP: string,
  weightInGrams: number
): Promise<FreightOption[]> {
  try {
    // Formatar o CEP (remover caracteres não numéricos)
    const formattedCEP = destinationCEP.replace(/\D/g, '');

    // Validar CEP
    if (formattedCEP.length !== 8) {
      throw new Error('CEP inválido');
    }

    // Calcular dimensões da embalagem
    const dimensions = calculatePackageDimensions(weightInGrams);

    // Converter peso para kg (Correios usa kg)
    const weightInKg = Math.max(0.1, weightInGrams / 1000);

    // Serviços a consultar
    const services = [
      CORREIOS_SERVICES.PAC,
      CORREIOS_SERVICES.SEDEX
    ];

    // Adicionar SEDEX 10 apenas para pacotes leves
    if (weightInKg <= 10) {
      services.push(CORREIOS_SERVICES.SEDEX_10);
    }

    // Consultar cada serviço
    const freightOptions: FreightOption[] = [];

    for (const service of services) {
      try {
        const response = await axios.post(
          'http://ws.correios.com.br/calculador/CalcPrecoPrazo.asmx/CalcPrecoPrazo',
          new URLSearchParams({
            nCdEmpresa: COMPANY_INFO.EMPRESA_CODIGO,
            sDsSenha: COMPANY_INFO.EMPRESA_SENHA,
            nCdServico: service,
            sCepOrigem: COMPANY_INFO.CEP_ORIGEM,
            sCepDestino: formattedCEP,
            nVlPeso: weightInKg.toString(),
            nCdFormato: '1', // 1 = caixa/pacote
            nVlComprimento: dimensions.comprimento.toString(),
            nVlAltura: dimensions.altura.toString(),
            nVlLargura: dimensions.largura.toString(),
            nVlDiametro: '0',
            sCdMaoPropria: 'N',
            nVlValorDeclarado: '0',
            sCdAvisoRecebimento: 'N',
          }),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          }
        );

        // Parsear resposta XML
        const parser = new XMLParser();
        const result = parser.parse(response.data);

        const serviceResult = result.cResultado.Servicos.cServico;

        // Verificar se o serviço está disponível
        if (serviceResult.Erro === '0') {
          // Converter valor de string para número
          const price = parseFloat(
            serviceResult.Valor.replace('.', '').replace(',', '.')
          );

          freightOptions.push({
            name: SERVICE_NAMES[service] || `Serviço ${service}`,
            price,
            estimatedDays: SERVICE_DAYS[service] || `${serviceResult.PrazoEntrega} dias úteis`,
          });
        }
      } catch (error) {
        console.error(`Erro ao consultar serviço ${service}:`, error);
        // Continuar para o próximo serviço em caso de erro
      }
    }

    // Se nenhuma opção for retornada, usar valores de fallback
    if (freightOptions.length === 0) {
      return getFallbackShippingOptions(weightInGrams);
    }

    // Ordenar por preço
    return freightOptions.sort((a, b) => a.price - b.price);
  } catch (error) {
    console.error('Erro ao calcular frete dos Correios:', error);
    // Em caso de erro, retornar opções de fallback
    return getFallbackShippingOptions(weightInGrams);
  }
}

/**
 * Retorna opções de frete de fallback em caso de erro na API dos Correios
 */
export function getFallbackShippingOptions(weightInGrams: number): FreightOption[] {
  // Cálculo baseado no peso
  const basePrice = Math.round(weightInGrams * 0.05) / 10; // R$ 0,005 por grama

  return [
    {
      name: 'PAC',
      price: basePrice + 15.90,
      estimatedDays: '4-9 dias úteis',
    },
    {
      name: 'SEDEX',
      price: basePrice + 25.90,
      estimatedDays: '1-3 dias úteis',
    },
  ];
}

/**
 * Função principal para calcular frete usando a API dos Correios
 */
export async function calculateShippingWithCorreios(
  postalCode: string,
  weight: number
): Promise<FreightCalculationResponse> {
  const options = await calculateCorreiosShipping(postalCode, weight);

  return {
    options,
    postalCode,
  };
}
