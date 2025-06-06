import { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserById, updateUserProfile } from '../../lib/supabase';

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
  console.log(`User Profile API - Method: ${req.method}, URL: ${req.url}, UserId: ${req.query.userId}`);

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

    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in profile endpoint:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
