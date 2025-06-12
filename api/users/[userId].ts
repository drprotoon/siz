import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client directly
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Helper functions (moved from lib/supabase.ts)
async function getUserById(userId: number) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Erro ao buscar usuário:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return null;
  }
}

async function getUserAddress(userId: number) {
  try {
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // Se não encontrar endereço na tabela addresses, buscar na tabela users
      const user = await getUserById(userId);
      if (user && user.postal_code) {
        return {
          id: user.id,
          user_id: user.id,
          postal_code: user.postal_code,
          street: user.address || '',
          number: user.address_number || '',
          complement: user.address_complement || '',
          district: user.district || '',
          city: user.city || '',
          state: user.state || '',
          country: user.country || 'Brasil',
          created_at: user.created_at,
          updated_at: user.updated_at || user.created_at
        };
      }
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erro ao buscar endereço:', error);
    return null;
  }
}

async function saveUserAddress(userId: number, addressData: any) {
  try {
    // Primeiro, tentar atualizar se já existe
    const { data: existingAddress } = await supabase
      .from('addresses')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existingAddress) {
      // Atualizar endereço existente
      const { data, error } = await supabase
        .from('addresses')
        .update({
          ...addressData,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar endereço:', error);
        return null;
      }

      return data;
    } else {
      // Criar novo endereço
      const { data, error } = await supabase
        .from('addresses')
        .insert({
          user_id: userId,
          ...addressData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar endereço:', error);
        return null;
      }

      return data;
    }
  } catch (error) {
    console.error('Erro ao salvar endereço:', error);
    return null;
  }
}

async function updateUserProfile(userId: number, profileData: any) {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({
        ...profileData,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar perfil:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    return null;
  }
}

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
  console.log(`User API - Method: ${req.method}, URL: ${req.url}, UserId: ${req.query.userId}`);

  const { userId } = req.query;
  const isAddressEndpoint = req.url?.includes('/address');
  const isProfileEndpoint = req.url?.includes('/profile');

  if (!userId || Array.isArray(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  const userIdNum = parseInt(userId, 10);
  if (isNaN(userIdNum)) {
    return res.status(400).json({ error: 'Invalid user ID format' });
  }

  try {
    // Handle address endpoints
    if (isAddressEndpoint) {
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
      }
    }

    // Handle profile endpoints
    if (isProfileEndpoint || (!isAddressEndpoint && !isProfileEndpoint)) {
      if (req.method === 'GET') {
        // Buscar perfil do usuário no Supabase
        const user = await getUserById(userIdNum);
        
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

        // Converter para o formato esperado pelo frontend
        const profile = {
          id: user.id,
          name: user.full_name || user.username,
          email: user.email,
          phone: user.phone || '',
          cpf: user.cpf || '',
          birthdate: user.birthdate || '',
          role: user.role,
          address: user.address || '',
          address_number: user.address_number || '',
          address_complement: user.address_complement || '',
          district: user.district || '',
          city: user.city || '',
          state: user.state || '',
          postal_code: user.postal_code || '',
          country: user.country || 'Brasil',
          createdAt: user.created_at,
          updatedAt: user.updated_at
        };

        return res.status(200).json(profile);

      } else if (req.method === 'PUT') {
        // Atualizar perfil do usuário
        const profileData = req.body;

        // Validar dados obrigatórios
        if (!profileData.name || !profileData.email) {
          return res.status(400).json({ error: 'Name and email are required' });
        }

        // Converter para o formato do banco de dados
        const updateData = {
          full_name: profileData.name,
          email: profileData.email,
          phone: profileData.phone,
          cpf: profileData.cpf,
          birthdate: profileData.birthdate,
          address: profileData.address,
          address_number: profileData.address_number,
          address_complement: profileData.address_complement,
          district: profileData.district,
          city: profileData.city,
          state: profileData.state,
          postal_code: profileData.postal_code,
          country: profileData.country
        };

        const updatedUser = await updateUserProfile(userIdNum, updateData);

        if (!updatedUser) {
          return res.status(500).json({ error: 'Failed to update profile' });
        }

        // Converter de volta para o formato do frontend
        const updatedProfile = {
          id: updatedUser.id,
          name: updatedUser.full_name || updatedUser.username,
          email: updatedUser.email,
          phone: updatedUser.phone || '',
          cpf: updatedUser.cpf || '',
          birthdate: updatedUser.birthdate || '',
          role: updatedUser.role,
          address: updatedUser.address || '',
          address_number: updatedUser.address_number || '',
          address_complement: updatedUser.address_complement || '',
          district: updatedUser.district || '',
          city: updatedUser.city || '',
          state: updatedUser.state || '',
          postal_code: updatedUser.postal_code || '',
          country: updatedUser.country || 'Brasil',
          createdAt: updatedUser.created_at,
          updatedAt: updatedUser.updated_at
        };

        return res.status(200).json(updatedProfile);
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Error in user endpoint:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
