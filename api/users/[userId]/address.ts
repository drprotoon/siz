import { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserAddress, saveUserAddress, updateUserProfile } from '../../lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Log the request for debugging
  console.log(`User Address API - Method: ${req.method}, URL: ${req.url}, UserId: ${req.query.userId}`);

  const { userId } = req.query;

  if (!userId || Array.isArray(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  const userIdNum = parseInt(userId, 10);
  if (isNaN(userIdNum)) {
    return res.status(400).json({ error: 'Invalid user ID format' });
  }

  try {
    if (req.method === 'GET') {
      // Buscar endereço do usuário no Supabase
      const address = await getUserAddress(userIdNum);
      
      if (!address) {
        // Retornar endereço vazio em vez de erro
        return res.status(200).json({
          postalCode: '',
          street: '',
          number: '',
          complement: '',
          district: '',
          city: '',
          state: '',
          country: 'Brasil'
        });
      }

      // Converter para o formato esperado pelo frontend
      const addressResponse = {
        id: address.id,
        userId: address.user_id,
        postalCode: address.postal_code,
        street: address.street,
        number: address.number || '',
        complement: address.complement || '',
        district: address.district,
        city: address.city,
        state: address.state,
        country: address.country || 'Brasil'
      };

      return res.status(200).json(addressResponse);

    } else if (req.method === 'POST') {
      // Salvar endereço do usuário
      const addressData = req.body;

      // Validar dados obrigatórios
      if (!addressData.postalCode || !addressData.street || !addressData.city || !addressData.state) {
        return res.status(400).json({ 
          error: 'Postal code, street, city, and state are required' 
        });
      }

      // Converter para o formato do banco de dados
      const addressToSave = {
        postal_code: addressData.postalCode,
        street: addressData.street,
        number: addressData.number || '',
        complement: addressData.complement || '',
        district: addressData.district || '',
        city: addressData.city,
        state: addressData.state,
        country: addressData.country || 'Brasil'
      };

      // Salvar na tabela addresses
      const savedAddress = await saveUserAddress(userIdNum, addressToSave);

      // Também atualizar na tabela users para compatibilidade
      await updateUserProfile(userIdNum, {
        postal_code: addressData.postalCode,
        address: addressData.street,
        address_number: addressData.number,
        address_complement: addressData.complement,
        district: addressData.district,
        city: addressData.city,
        state: addressData.state,
        country: addressData.country || 'Brasil'
      });

      if (!savedAddress) {
        return res.status(500).json({ error: 'Failed to save address' });
      }

      // Converter de volta para o formato do frontend
      const addressResponse = {
        id: savedAddress.id,
        userId: savedAddress.user_id,
        postalCode: savedAddress.postal_code,
        street: savedAddress.street,
        number: savedAddress.number || '',
        complement: savedAddress.complement || '',
        district: savedAddress.district,
        city: savedAddress.city,
        state: savedAddress.state,
        country: savedAddress.country || 'Brasil'
      };

      return res.status(200).json(addressResponse);

    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in address endpoint:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
