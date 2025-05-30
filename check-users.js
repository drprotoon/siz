// Script para verificar os usuários no banco de dados
const { db, users } = require('./dist/server/db.js');

async function getUsers() {
  try {
    const result = await db.select().from(users);
    console.log('Usuários encontrados:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
  } finally {
    process.exit(0);
  }
}

getUsers();
