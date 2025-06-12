import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials not found');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkUsers() {
  try {
    console.log('🔍 Verificando usuários no Supabase...\n');
    
    // Buscar todos os usuários
    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, email, role, password')
      .order('id');

    if (error) {
      console.error('❌ Erro ao buscar usuários:', error);
      return;
    }

    console.log(`📋 Total de usuários encontrados: ${users.length}\n`);
    
    users.forEach(user => {
      console.log(`👤 ID: ${user.id}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Password: ${user.password ? user.password.substring(0, 20) + '...' : 'NULL'}`);
      console.log('');
    });

    // Tentar buscar usuário específico
    console.log('🔍 Testando busca por username "testuser"...');
    const { data: testUser, error: testError } = await supabase
      .from('users')
      .select('*')
      .eq('username', 'testuser')
      .single();

    if (testError) {
      console.log('❌ Usuário "testuser" não encontrado:', testError.message);
    } else {
      console.log('✅ Usuário "testuser" encontrado:', testUser);
    }

    // Tentar buscar usuário "teste"
    console.log('\n🔍 Testando busca por username "teste"...');
    const { data: testeUser, error: testeError } = await supabase
      .from('users')
      .select('*')
      .eq('username', 'teste')
      .single();

    if (testeError) {
      console.log('❌ Usuário "teste" não encontrado:', testeError.message);
    } else {
      console.log('✅ Usuário "teste" encontrado:', testeUser);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkUsers();
