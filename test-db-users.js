import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testUsers() {
  console.log('🔍 Testando consulta de usuários no banco de dados...');

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL não está definida');
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    // Verificar se a tabela users existe
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    console.log('Tabela users existe:', tableCheck.rows[0].exists);

    if (tableCheck.rows[0].exists) {
      // Listar todos os usuários
      const users = await pool.query('SELECT id, username, email, role FROM users ORDER BY id');
      console.log('Usuários encontrados:', users.rows.length);
      
      users.rows.forEach(user => {
        console.log(`- ID: ${user.id}, Username: ${user.username}, Email: ${user.email}, Role: ${user.role}`);
      });

      // Tentar buscar especificamente o usuário admin
      const adminUser = await pool.query('SELECT * FROM users WHERE username = $1', ['admin']);
      console.log('Usuário admin encontrado:', adminUser.rows.length > 0);
      
      if (adminUser.rows.length > 0) {
        console.log('Dados do admin:', {
          id: adminUser.rows[0].id,
          username: adminUser.rows[0].username,
          email: adminUser.rows[0].email,
          role: adminUser.rows[0].role,
          hasPassword: !!adminUser.rows[0].password
        });
      }
    }

  } catch (error) {
    console.error('Erro ao consultar usuários:', error);
  } finally {
    await pool.end();
  }
}

testUsers().catch(console.error);
