// Script para criar usuários de teste com senhas bcrypt
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';
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

async function createTestUsers() {
  try {
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    const testUsers = [
      {
        username: 'admin',
        email: 'admin@beautyessence.com',
        password: hashedPassword,
        role: 'admin',
        name: 'Administrador'
      },
      {
        username: 'teste',
        email: 'teste@exemplo.com',
        password: hashedPassword,
        role: 'customer',
        name: 'Usuário Teste'
      },
      {
        username: 'cliente1',
        email: 'cliente1@teste.com',
        password: hashedPassword,
        role: 'customer',
        name: 'Cliente Teste 1'
      }
    ];

    for (const userData of testUsers) {
      // Verificar se o usuário já existe
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, username')
        .eq('username', userData.username)
        .single();

      if (existingUser) {
        console.log(`Usuário ${userData.username} já existe, atualizando senha...`);
        
        // Atualizar senha para bcrypt
        const { error: updateError } = await supabase
          .from('users')
          .update({ password: userData.password })
          .eq('username', userData.username);

        if (updateError) {
          console.error(`Erro ao atualizar usuário ${userData.username}:`, updateError);
        } else {
          console.log(`✅ Senha do usuário ${userData.username} atualizada para bcrypt`);
        }
      } else {
        // Criar novo usuário
        const { error: insertError } = await supabase
          .from('users')
          .insert([userData]);

        if (insertError) {
          console.error(`Erro ao criar usuário ${userData.username}:`, insertError);
        } else {
          console.log(`✅ Usuário ${userData.username} criado com sucesso`);
        }
      }
    }

    console.log('\n🎉 Usuários de teste configurados!');
    console.log('Credenciais para teste:');
    console.log('- admin / 123456 (administrador)');
    console.log('- teste / 123456 (cliente)');
    console.log('- cliente1 / 123456 (cliente)');
    
  } catch (error) {
    console.error('Erro ao criar usuários de teste:', error);
  }
}

createTestUsers();
