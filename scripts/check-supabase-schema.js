#!/usr/bin/env node

/**
 * Script para verificar a estrutura real das tabelas no Supabase
 */

import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkSchema() {
  try {
    console.log('🔍 Verificando estrutura das tabelas no Supabase...\n');

    // Verificar tabelas existentes
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log('📋 Tabelas encontradas:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    // Verificar estrutura da tabela products
    if (tablesResult.rows.some(row => row.table_name === 'products')) {
      console.log('\n🛍️ Estrutura da tabela PRODUCTS:');
      const productsColumns = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `);

      productsColumns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
    }

    // Verificar estrutura da tabela users
    if (tablesResult.rows.some(row => row.table_name === 'users')) {
      console.log('\n👥 Estrutura da tabela USERS:');
      const usersColumns = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `);

      usersColumns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
    }

    // Verificar estrutura da tabela categories
    if (tablesResult.rows.some(row => row.table_name === 'categories')) {
      console.log('\n📂 Estrutura da tabela CATEGORIES:');
      const categoriesColumns = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'categories' 
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `);

      categoriesColumns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
    }

    // Contar registros
    console.log('\n📊 Contagem de registros:');
    
    for (const table of ['products', 'categories', 'users']) {
      if (tablesResult.rows.some(row => row.table_name === table)) {
        try {
          const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
          console.log(`  - ${table}: ${countResult.rows[0].count} registros`);
        } catch (error) {
          console.log(`  - ${table}: Erro ao contar (${error.message})`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Erro ao verificar schema:', error.message);
  } finally {
    await pool.end();
  }
}

checkSchema();
