import { supabase } from './supabase';

/**
 * Salva ou atualiza o perfil do usuário no Supabase
 *
 * @param userId - ID do usuário
 * @param profileData - Dados do perfil a serem salvos
 * @returns Dados do perfil salvos ou null em caso de erro
 */
export async function saveUserProfileToSupabase(userId: string, profileData: any) {
  if (!supabase) {
    console.warn('Supabase não configurado. Perfil do usuário não será salvo no Supabase.');
    return null;
  }

  try {
    // Verificar se o usuário já existe no Supabase
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Erro ao verificar usuário no Supabase:', fetchError);
      return null;
    }

    // Preparar dados para inserção/atualização
    const userData = {
      id: parseInt(userId),
      name: profileData.name,
      email: profileData.email,
      phone: profileData.phone || null,
      cpf: profileData.cpf || null,
      birthdate: profileData.birthdate || null,
      updated_at: new Date().toISOString()
    };

    let result;

    if (existingUser) {
      // Atualizar usuário existente
      const { data, error } = await supabase
        .from('users')
        .update(userData)
        .eq('id', userId)
        .select();

      if (error) {
        console.error('Erro ao atualizar usuário no Supabase:', error);
        return null;
      }

      result = data?.[0] || null;
    } else {
      // Inserir novo usuário
      userData.created_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('users')
        .insert([userData])
        .select();

      if (error) {
        console.error('Erro ao inserir usuário no Supabase:', error);
        return null;
      }

      result = data?.[0] || null;
    }

    console.log('Perfil do usuário salvo no Supabase com sucesso:', result);
    return result;
  } catch (error) {
    console.error('Erro ao salvar perfil do usuário no Supabase:', error);
    return null;
  }
}

/**
 * Salva ou atualiza o endereço do usuário no Supabase
 *
 * @param userId - ID do usuário
 * @param addressData - Dados do endereço a serem salvos
 * @returns Dados do endereço salvos ou null em caso de erro
 */
export async function saveUserAddressToSupabase(userId: string, addressData: any) {
  if (!supabase) {
    console.warn('Supabase não configurado. Endereço do usuário não será salvo no Supabase.');
    return null;
  }

  try {
    // Verificar se o usuário existe no Supabase
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('Erro ao verificar usuário no Supabase:', fetchError);
      return null;
    }

    if (!existingUser) {
      console.error('Usuário não encontrado no Supabase:', userId);
      return null;
    }

    // Preparar dados para atualização
    const addressUpdate = {
      postal_code: addressData.postalCode,
      address: addressData.street,
      address_number: addressData.number || '',
      address_complement: addressData.complement || '',
      district: addressData.district,
      city: addressData.city,
      state: addressData.state,
      country: addressData.country || 'Brasil',
      updated_at: new Date().toISOString()
    };

    // Atualizar usuário com os dados de endereço
    const { data, error } = await supabase
      .from('users')
      .update(addressUpdate)
      .eq('id', userId)
      .select();

    if (error) {
      console.error('Erro ao atualizar endereço do usuário no Supabase:', error);
      return null;
    }

    const result = data?.[0] || null;
    console.log('Endereço do usuário salvo no Supabase com sucesso:', result);
    return result;
  } catch (error) {
    console.error('Erro ao salvar endereço do usuário no Supabase:', error);
    return null;
  }
}
