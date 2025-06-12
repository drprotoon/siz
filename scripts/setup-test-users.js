#!/usr/bin/env node

import { storage } from '../server/storage.js';
import bcrypt from 'bcrypt';

async function setupTestUsers() {
  console.log('🔧 Configurando usuários de teste...\n');

  try {
    // Verificar se já existe um usuário admin
    console.log('1. Verificando usuário admin existente...');
    let adminUser = await storage.getUserByUsername('admin');
    
    if (adminUser) {
      console.log('✅ Usuário admin já existe:', adminUser.username);
    } else {
      console.log('📝 Criando usuário admin...');
      
      // Criar usuário admin
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      adminUser = await storage.createUser({
        username: 'admin',
        email: 'admin@siz.com',
        password: hashedPassword,
        full_name: 'Administrador',
        name: 'Admin',
        role: 'admin'
      });
      
      console.log('✅ Usuário admin criado:', adminUser.username);
    }

    // Verificar se já existe um usuário customer
    console.log('\n2. Verificando usuário customer existente...');
    let customerUser = await storage.getUserByUsername('customer');
    
    if (customerUser) {
      console.log('✅ Usuário customer já existe:', customerUser.username);
    } else {
      console.log('📝 Criando usuário customer...');
      
      // Criar usuário customer
      const hashedPassword = await bcrypt.hash('customer123', 10);
      
      customerUser = await storage.createUser({
        username: 'customer',
        email: 'customer@siz.com',
        password: hashedPassword,
        full_name: 'Cliente Teste',
        name: 'Cliente',
        role: 'customer'
      });
      
      console.log('✅ Usuário customer criado:', customerUser.username);
    }

    // Listar todos os usuários
    console.log('\n3. Listando todos os usuários...');
    const allUsers = await storage.getUsers();
    console.log('📋 Usuários no sistema:');
    allUsers.forEach(user => {
      console.log(`   - ${user.username} (${user.email}) - ${user.role}`);
    });

    console.log('\n🎉 Configuração de usuários concluída!');
    console.log('\n📝 Credenciais de teste:');
    console.log('   Admin: admin / admin123');
    console.log('   Customer: customer / customer123');

  } catch (error) {
    console.error('❌ Erro durante a configuração:', error.message);
    console.error(error);
  }
}

// Executar configuração
setupTestUsers();
