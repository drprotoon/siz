// Script para migrar usuários para o sistema de autenticação do Supabase
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials not found in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function migrateUsers() {
  try {
    // Verificar se a coluna auth_id existe
    const { data: hasAuthIdColumn, error: columnError } = await supabase.rpc(
      'check_column_exists',
      { table_name: 'users', column_name: 'auth_id' }
    );

    if (columnError) {
      console.error('Erro ao verificar coluna auth_id:', columnError);
      
      // Tentar adicionar a coluna
      const { error: alterError } = await supabase.rpc(
        'execute_sql',
        { sql: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_id TEXT;' }
      );
      
      if (alterError) {
        console.error('Erro ao adicionar coluna auth_id:', alterError);
        return;
      }
      
      console.log('Coluna auth_id adicionada com sucesso');
    }

    // Buscar usuários sem auth_id
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username, email')
      .is('auth_id', null);

    if (usersError) {
      console.error('Erro ao buscar usuários:', usersError);
      return;
    }

    console.log(`Encontrados ${users.length} usuários para migrar`);

    // Migrar cada usuário
    for (const user of users) {
      console.log(`Migrando usuário: ${user.username} (${user.email})`);
      
      // Criar usuário na autenticação do Supabase
      const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: 'TEMP_PASSWORD_' + Math.random().toString(36).substring(2, 10),
        email_confirm: true,
        user_metadata: { 
          username: user.username,
          email_verified: true 
        }
      });

      if (createError) {
        console.error(`Erro ao criar usuário ${user.username} na autenticação:`, createError);
        continue;
      }

      // Atualizar auth_id na tabela users
      const { error: updateError } = await supabase
        .from('users')
        .update({ auth_id: authUser.user.id })
        .eq('id', user.id);

      if (updateError) {
        console.error(`Erro ao atualizar auth_id do usuário ${user.username}:`, updateError);
        continue;
      }

      console.log(`Usuário ${user.username} migrado com sucesso`);
    }

    console.log('Migração concluída');
  } catch (error) {
    console.error('Erro durante a migração:', error);
  }
}

migrateUsers();