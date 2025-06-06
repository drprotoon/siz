import { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { cep } = req.query;

  if (!cep || Array.isArray(cep)) {
    return res.status(400).json({
      Success: false,
      Msg: 'CEP inválido'
    });
  }

  // Limpar e validar CEP
  const formattedCEP = cep.replace(/\D/g, '');

  if (formattedCEP.length !== 8) {
    return res.status(400).json({
      Success: false,
      Msg: 'CEP inválido. O formato correto é 00000-000.',
      CEP: cep
    });
  }

  try {
    console.log('Buscando CEP:', formattedCEP);

    // Tentar buscar no ViaCEP primeiro
    try {
      const viaCepResponse = await axios.get(`https://viacep.com.br/ws/${formattedCEP}/json/`, {
        timeout: 5000
      });

      if (viaCepResponse.data && !viaCepResponse.data.erro) {
        const address = {
          Success: true,
          CEP: formattedCEP,
          Street: viaCepResponse.data.logradouro || '',
          District: viaCepResponse.data.bairro || '',
          City: viaCepResponse.data.localidade || '',
          UF: viaCepResponse.data.uf || '',
          Complement: viaCepResponse.data.complemento || '',
          IBGE: viaCepResponse.data.ibge || ''
        };

        console.log('Endereço encontrado via ViaCEP:', address);
        return res.status(200).json(address);
      }
    } catch (viaCepError) {
      console.log('Erro no ViaCEP, tentando API dos Correios:', viaCepError);
    }

    // Se ViaCEP falhar, tentar API dos Correios
    try {
      const correiosResponse = await axios.get(`https://apps.correios.com.br/SigepMasterJPA/AtendeClienteService/AtendeCliente`, {
        params: {
          cep: formattedCEP
        },
        timeout: 5000
      });

      // A API dos Correios retorna XML, seria necessário parser
      // Por simplicidade, vamos usar apenas o ViaCEP
      throw new Error('API dos Correios não implementada');
    } catch (correiosError) {
      console.log('Erro na API dos Correios:', correiosError);
    }

    // Se ambas as APIs falharem, tentar uma busca alternativa
    try {
      const awesomeApiResponse = await axios.get(`https://cep.awesomeapi.com.br/json/${formattedCEP}`, {
        timeout: 5000
      });

      if (awesomeApiResponse.data && awesomeApiResponse.data.status !== 400) {
        const address = {
          Success: true,
          CEP: formattedCEP,
          Street: awesomeApiResponse.data.address || '',
          District: awesomeApiResponse.data.district || '',
          City: awesomeApiResponse.data.city || '',
          UF: awesomeApiResponse.data.state || '',
          Complement: '',
          IBGE: awesomeApiResponse.data.city_ibge || ''
        };

        console.log('Endereço encontrado via AwesomeAPI:', address);
        return res.status(200).json(address);
      }
    } catch (awesomeApiError) {
      console.log('Erro na AwesomeAPI:', awesomeApiError);
    }

    // Se todas as APIs falharem
    return res.status(404).json({
      Success: false,
      Msg: 'CEP não encontrado',
      CEP: formattedCEP
    });

  } catch (error) {
    console.error('Erro geral na busca de CEP:', error);
    return res.status(500).json({
      Success: false,
      Msg: 'Erro interno do servidor ao buscar CEP',
      CEP: formattedCEP,
      Error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
