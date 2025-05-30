import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function fixSchema() {
  console.log('🔧 Corrigindo schema do banco de dados...');

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL não está definida');
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    // Verificar colunas existentes
    const result = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `);

    const existingColumns = result.rows.map(row => row.column_name);
    console.log('Colunas existentes:', existingColumns);

    // Renomear colunas se necessário
    if (existingColumns.includes('compareatprice') && !existingColumns.includes('compare_at_price')) {
      await pool.query('ALTER TABLE products RENAME COLUMN compareatprice TO compare_at_price');
      console.log('✅ Coluna compareatprice renomeada para compare_at_price');
    }

    if (existingColumns.includes('howtouse') && !existingColumns.includes('how_to_use')) {
      await pool.query('ALTER TABLE products RENAME COLUMN howtouse TO how_to_use');
      console.log('✅ Coluna howtouse renomeada para how_to_use');
    }

    // Adicionar colunas faltando
    const columnsToAdd = [
      { name: 'compare_at_price', type: 'NUMERIC(10,2)' },
      { name: 'how_to_use', type: 'TEXT' },
      { name: 'ingredients', type: 'TEXT' },
      { name: 'visible', type: 'BOOLEAN NOT NULL DEFAULT true' },
      { name: 'featured', type: 'BOOLEAN DEFAULT false' },
      { name: 'new_arrival', type: 'BOOLEAN DEFAULT false' },
      { name: 'best_seller', type: 'BOOLEAN DEFAULT false' },
      { name: 'rating', type: 'NUMERIC(3,1) DEFAULT 0' },
      { name: 'reviewcount', type: 'INTEGER DEFAULT 0' }
    ];

    // Verificar colunas existentes novamente após renomeação
    const updatedResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND table_schema = 'public'
    `);
    const updatedColumns = updatedResult.rows.map(row => row.column_name);

    for (const column of columnsToAdd) {
      if (!updatedColumns.includes(column.name)) {
        try {
          await pool.query(`ALTER TABLE products ADD COLUMN ${column.name} ${column.type}`);
          console.log(`✅ Coluna ${column.name} adicionada`);
        } catch (error) {
          console.error(`❌ Erro ao adicionar coluna ${column.name}:`, error.message);
        }
      } else {
        console.log(`ℹ️ Coluna ${column.name} já existe`);
      }
    }

    // Verificar schema final
    const finalResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `);

    console.log('\n📋 Schema final da tabela products:');
    finalResult.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : ''} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
    });

    console.log('\n🎉 Schema corrigido com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao corrigir schema:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

fixSchema()
  .then(() => {
    console.log('✅ Script executado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro ao executar script:', error);
    process.exit(1);
  });
