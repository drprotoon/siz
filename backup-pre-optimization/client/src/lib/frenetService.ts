/**
 * Frenet API Service
 *
 * Este serviço fornece integração com a API da Frenet para cálculo de frete e rastreamento de pedidos.
 */

// Configuração da API Frenet
const FRENET_API_TOKEN = "13B9E436RD32DR455ERAC99R93357F8D6640";
const FRENET_API_URL = "https://api.frenet.com.br";

// Interfaces para os tipos de dados
export interface FrenetQuoteRequest {
  SellerCEP: string;
  RecipientCEP: string;
  ShipmentInvoiceValue: number;
  ShippingServiceCode?: string | null;
  ShippingItemArray: FrenetShippingItem[];
  RecipientCountry?: string;
}

export interface FrenetShippingItem {
  Height: number;
  Length: number;
  Width: number;
  Weight: number;
  Quantity: number;
  SKU?: string;
  Category?: string;
  isFragile?: boolean;
}

export interface FrenetQuoteResponse {
  ShippingSevicesArray?: FrenetShippingService[];
  ShippingSeviceAvailableArray?: FrenetShippingServiceAvailable[];
  Msg?: string;
  Message?: string;
}

export interface FrenetShippingServiceAvailable {
  ServiceCode: string;
  ServiceDescription: string;
  Carrier: string;
  CarrierCode: string;
  ShippingPrice?: number;
  DeliveryTime?: string;
}

export interface FrenetShippingService {
  ServiceCode: string;
  ServiceDescription: string;
  Carrier: string;
  CarrierCode?: string;
  ShippingPrice: number;
  DeliveryTime: number | string;
  Error?: boolean | string;
  Msg?: string;
  OriginalDeliveryTime?: number;
  OriginalShippingPrice?: number;
}

export interface FrenetTrackingRequest {
  ShippingServiceCode: string;
  TrackingNumber: string;
  InvoiceNumber?: string;
  InvoiceSerie?: string;
  RecipientDocument?: string;
}

export interface FrenetTrackingResponse {
  TrackingEvents: FrenetTrackingEvent[];
  Success: boolean;
  Msg?: string;
}

export interface FrenetTrackingEvent {
  EventDateTime: string;
  EventDescription: string;
  EventLocation: string;
}

export interface FrenetShippingInfo {
  Success: boolean;
  Message?: string;
  Token?: string;
  CompanyName?: string;
  CompanyDocument?: string;
  CompanyStateRegistration?: string;
  TokenDueDate?: string;
}

export interface FrenetAddressResponse {
  CEP: string;
  UF: string;
  City: string;
  District: string;
  Street: string;
  Success: boolean;
  Msg?: string;
}

/**
 * Realiza uma cotação de frete utilizando a API da Frenet
 *
 * @param request Dados para cotação de frete
 * @returns Resposta com as opções de frete disponíveis
 */
export async function getShippingQuote(request: FrenetQuoteRequest): Promise<FrenetQuoteResponse> {
  try {
    console.log('Enviando requisição para Frenet:', JSON.stringify(request));

    // Usar o endpoint do servidor em vez de chamar diretamente a API da Frenet
    const response = await fetch('/api/freight/quote', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ request })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erro na cotação de frete (${response.status}): ${errorText}`);
      throw new Error(`Erro na cotação de frete: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Resposta da cotação de frete:', JSON.stringify(data));

    // Verificar se a resposta contém os dados esperados
    if (!data) {
      throw new Error('Resposta vazia da API de cotação de frete');
    }

    // Verificar e inicializar arrays vazios se necessário
    if (!data.ShippingSevicesArray && !data.ShippingSeviceAvailableArray) {
      // Se não tiver nenhum dos arrays de serviços, inicializar ambos com arrays vazios
      data.ShippingSevicesArray = [];
      data.ShippingSeviceAvailableArray = [];
    } else if (!data.ShippingSevicesArray) {
      data.ShippingSevicesArray = [];
    } else if (!data.ShippingSeviceAvailableArray) {
      data.ShippingSeviceAvailableArray = [];
    }

    return data;
  } catch (error) {
    console.error('Erro ao obter cotação de frete:', error);
    // Retornar um objeto de erro formatado em vez de lançar uma exceção
    return {
      ShippingSevicesArray: [],
      ShippingSeviceAvailableArray: [],
      Message: error instanceof Error ? error.message : 'Erro desconhecido ao calcular frete'
    };
  }
}

/**
 * Rastreia um pedido utilizando a API da Frenet
 *
 * @param request Dados para rastreamento do pedido
 * @returns Resposta com as informações de rastreamento
 */
export async function trackShipment(request: FrenetTrackingRequest): Promise<FrenetTrackingResponse> {
  try {
    const response = await fetch(`${FRENET_API_URL}/tracking/trackinginfo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': FRENET_API_TOKEN
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`Erro no rastreamento: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao rastrear pedido:', error);
    throw error;
  }
}

/**
 * Busca informações de endereço a partir de um CEP
 *
 * @param cep CEP para busca de endereço
 * @returns Resposta com as informações do endereço
 */
export async function getAddressByCEP(cep: string): Promise<FrenetAddressResponse> {
  try {
    console.log('Buscando endereço para o CEP:', cep);

    const formattedCEP = cep.replace(/\D/g, '');

    if (formattedCEP.length !== 8) {
      console.warn('CEP inválido:', cep);
      return {
        CEP: cep,
        UF: '',
        City: '',
        District: '',
        Street: '',
        Success: false,
        Msg: 'CEP inválido. O formato correto é 00000-000.'
      };
    }

    // Usar o endpoint do servidor em vez de chamar diretamente a API da Frenet
    const response = await fetch(`/api/address/${formattedCEP}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erro na busca de CEP (${response.status}): ${errorText}`);

      let errorMsg = 'Erro na busca de CEP';
      try {
        // Tentar extrair a mensagem de erro do JSON retornado
        const errorData = JSON.parse(errorText);
        if (errorData && errorData.Msg) {
          errorMsg = errorData.Msg;
        }
      } catch (e) {
        // Se não for um JSON válido, usar a mensagem padrão
        errorMsg = `Erro na busca de CEP: ${response.status} ${response.statusText}`;
      }

      return {
        CEP: cep,
        UF: '',
        City: '',
        District: '',
        Street: '',
        Success: false,
        Msg: errorMsg
      };
    }

    const data = await response.json();
    console.log('Resposta da busca de CEP:', data);

    // Verificar se a resposta contém os dados esperados
    if (!data) {
      console.error('Resposta vazia da API de CEP');
      return {
        CEP: cep,
        UF: '',
        City: '',
        District: '',
        Street: '',
        Success: false,
        Msg: 'Resposta vazia da API de CEP'
      };
    }

    // Se a resposta não tiver o campo Success, adicionar com valor false
    if (data.Success === undefined) {
      data.Success = false;
      data.Msg = data.Msg || 'CEP não encontrado ou formato de resposta inválido';
    }

    // Garantir que todos os campos necessários existam
    if (!data.UF) data.UF = '';
    if (!data.City) data.City = '';
    if (!data.District) data.District = '';
    if (!data.Street) data.Street = '';
    if (!data.CEP) data.CEP = cep;

    return data;
  } catch (error) {
    console.error('Erro ao buscar endereço por CEP:', error);
    // Retornar um objeto de erro formatado em vez de lançar uma exceção
    // para que o componente possa exibir a mensagem de erro
    return {
      CEP: cep,
      UF: '',
      City: '',
      District: '',
      Street: '',
      Success: false,
      Msg: error instanceof Error ? error.message : 'Erro desconhecido ao buscar CEP'
    };
  }
}

/**
 * Obtém informações sobre a conta Frenet
 *
 * @returns Informações sobre a conta Frenet
 */
export async function getShippingInfo(): Promise<FrenetShippingInfo> {
  try {
    // Usar o endpoint do servidor em vez de chamar diretamente a API da Frenet
    const response = await fetch('/api/freight/info');

    if (!response.ok) {
      throw new Error(`Erro ao obter informações de frete: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao obter informações de frete:', error);
    throw error;
  }
}
