const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas');
  console.log('Certifique-se de que SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão definidas no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupAdminUsers() {
  console.log('🚀 Configurando usuários admin no Supabase...');
  
  try {
    // Lista de usuários admin para criar
    const adminUsers = [
      {
        username: 'admin',
        email: 'admin@sizcosmeticos.com',
        password: '123456',
        full_name: 'Administrador',
        role: 'admin'
      },
      {
        username: 'siz_admin',
        email: 'admin@siz.com',
        password: 'admin123',
        full_name: 'SIZ Admin',
        role: 'admin'
      }
    ];

    for (const adminData of adminUsers) {
      console.log(`\n📝 Verificando usuário: ${adminData.username}`);
      
      // Verificar se o usuário já existe
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id, username, email, role')
        .eq('username', adminData.username)
        .single();

      if (existingUser) {
        console.log(`✅ Usuário ${adminData.username} já existe`);
        console.log(`   Email: ${existingUser.email}`);
        console.log(`   Role: ${existingUser.role}`);
        
        // Verificar se é admin
        if (existingUser.role !== 'admin') {
          console.log(`🔄 Atualizando role para admin...`);
          const { error: updateError } = await supabase
            .from('users')
            .update({ role: 'admin' })
            .eq('id', existingUser.id);
            
          if (updateError) {
            console.error(`❌ Erro ao atualizar role: ${updateError.message}`);
          } else {
            console.log(`✅ Role atualizada para admin`);
          }
        }
        continue;
      }

      // Criar novo usuário admin
      console.log(`🔨 Criando usuário admin: ${adminData.username}`);
      
      // Hash da senha
      const hashedPassword = await bcrypt.hash(adminData.password, 10);
      
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          username: adminData.username,
          email: adminData.email,
          password: hashedPassword,
          full_name: adminData.full_name,
          role: adminData.role,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error(`❌ Erro ao criar usuário ${adminData.username}:`, createError.message);
        continue;
      }

      console.log(`✅ Usuário admin criado com sucesso!`);
      console.log(`   ID: ${newUser.id}`);
      console.log(`   Username: ${newUser.username}`);
      console.log(`   Email: ${newUser.email}`);
      console.log(`   Role: ${newUser.role}`);
      console.log(`   Senha: ${adminData.password}`);
    }

    console.log('\n🎉 Configuração de usuários admin concluída!');
    console.log('\n📋 Credenciais de login:');
    console.log('   Username: admin | Email: admin@sizcosmeticos.com | Senha: 123456');
    console.log('   Username: siz_admin | Email: admin@siz.com | Senha: admin123');
    console.log('\n💡 Use qualquer uma dessas credenciais para fazer login como admin');

  } catch (error) {
    console.error('❌ Erro durante a configuração:', error);
  }
}

// Executar o script
setupAdminUsers().then(() => {
  console.log('\n✨ Script finalizado');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
