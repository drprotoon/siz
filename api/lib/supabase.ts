import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

// Cliente do Supabase com service role key para operações administrativas
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Tipos para o banco de dados
export interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  phone?: string;
  cpf?: string;
  birthdate?: string;
  role: string;
  address?: string;
  address_number?: string;
  address_complement?: string;
  district?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  created_at: string;
  updated_at?: string;
}

export interface Address {
  id: number;
  user_id: number;
  postal_code: string;
  street: string;
  number?: string;
  complement?: string;
  district: string;
  city: string;
  state: string;
  country: string;
  created_at: string;
  updated_at: string;
}

// Funções auxiliares para interagir com o Supabase
export async function getUserById(userId: number): Promise<User | null> {
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

export async function updateUserProfile(userId: number, profileData: Partial<User>): Promise<User | null> {
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

export async function getUserAddress(userId: number): Promise<Address | null> {
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

export async function saveUserAddress(userId: number, addressData: Partial<Address>): Promise<Address | null> {
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
