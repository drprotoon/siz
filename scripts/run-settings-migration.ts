import { db } from '../server/db';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

async function runMigration() {
  try {
    console.log('🔄 Executando migração da tabela de configurações...');

    // Ler o arquivo de migração
    const migrationPath = path.join(process.cwd(), 'migrations', '0002_add_settings_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Executar a migração
    await db.execute(sql.raw(migrationSQL));

    console.log('✅ Migração executada com sucesso!');
    console.log('📋 Tabela de configurações criada e dados iniciais inseridos.');

    // Verificar se a tabela foi criada
    const result = await db.execute(sql`
      SELECT COUNT(*) as count FROM settings WHERE category = 'frenet'
    `);

    console.log(`🔧 Configurações da Frenet inseridas: ${result.rows?.[0]?.count || result[0]?.count || 'N/A'}`);

  } catch (error) {
    console.error('❌ Erro ao executar migração:', error);
    throw error;
  }
}

runMigration().catch(console.error);
