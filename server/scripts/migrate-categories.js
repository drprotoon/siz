// Script para migrar a tabela de categorias
import { db } from '../db.js';
import { sql } from 'drizzle-orm';

async function migrateCategories() {
  try {
    console.log('Iniciando migração da tabela de categorias...');

    // Verificar se a coluna parent_id já existe
    const checkParentIdColumn = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'categories' AND column_name = 'parent_id'
    `);

    if (checkParentIdColumn.length === 0) {
      console.log('Adicionando coluna parent_id à tabela categories...');
      await db.execute(sql`
        ALTER TABLE categories 
        ADD COLUMN parent_id INTEGER REFERENCES categories(id)
      `);
      console.log('Coluna parent_id adicionada com sucesso!');
    } else {
      console.log('Coluna parent_id já existe na tabela categories.');
    }

    // Verificar se a coluna order já existe
    const checkOrderColumn = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'categories' AND column_name = 'order'
    `);

    if (checkOrderColumn.length === 0) {
      console.log('Adicionando coluna order à tabela categories...');
      await db.execute(sql`
        ALTER TABLE categories 
        ADD COLUMN "order" INTEGER DEFAULT 0
      `);
      console.log('Coluna order adicionada com sucesso!');
    } else {
      console.log('Coluna order já existe na tabela categories.');
    }

    console.log('Migração da tabela de categorias concluída com sucesso!');
  } catch (error) {
    console.error('Erro ao migrar tabela de categorias:', error);
  } finally {
    process.exit(0);
  }
}

migrateCategories();
