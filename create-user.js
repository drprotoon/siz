// Script para criar um usuário de teste
const { db, users } = require('./dist/server/db.js');
const bcrypt = require('bcrypt');

async function createUser() {
  try {
    // Verificar se o usuário já existe
    const existingUser = await db.select().from(users).where(users.username.equals('admin'));
    
    if (existingUser.length > 0) {
      console.log('Usuário admin já existe. Atualizando senha...');
      
      // Hash da senha
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      // Atualizar a senha
      await db.update(users)
        .set({ password: hashedPassword })
        .where(users.username.equals('admin'));
      
      console.log('Senha do usuário admin atualizada com sucesso!');
    } else {
      console.log('Criando usuário admin...');
      
      // Hash da senha
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      // Criar o usuário
      const newUser = await db.insert(users).values({
        username: 'admin',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin',
        fullName: 'Administrator',
        createdat: new Date(),
        updatedAt: new Date()
      }).returning();
      
      console.log('Usuário admin criado com sucesso!');
      console.log(newUser);
    }
  } catch (error) {
    console.error('Erro ao criar/atualizar usuário:', error);
  } finally {
    process.exit(0);
  }
}

createUser();
