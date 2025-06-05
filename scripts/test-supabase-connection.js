#!/usr/bin/env node

/**
 * Script para testar a conexão com Supabase e buscar dados
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const db = drizzle(pool);

async function testConnection() {
  try {
    console.log('🔗 Testando conexão com Supabase...\n');

    // Teste básico de conexão
    const result = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Conexão estabelecida com sucesso!');
    console.log(`⏰ Hora do servidor: ${result.rows[0].current_time}\n`);

    // Buscar produtos usando SQL direto
    console.log('📦 Buscando produtos (SQL direto):');
    const productsResult = await pool.query(`
      SELECT id, name, slug, price, visible, featured 
      FROM products 
      WHERE visible = true 
      LIMIT 5
    `);
    
    console.log(`Encontrados ${productsResult.rows.length} produtos:`);
    productsResult.rows.forEach(product => {
      console.log(`  - ${product.name} (${product.slug}) - R$ ${product.price}`);
    });

    // Buscar categorias
    console.log('\n📂 Buscando categorias:');
    const categoriesResult = await pool.query(`
      SELECT id, name, slug 
      FROM categories 
      ORDER BY name
    `);
    
    console.log(`Encontradas ${categoriesResult.rows.length} categorias:`);
    categoriesResult.rows.forEach(category => {
      console.log(`  - ${category.name} (${category.slug})`);
    });

    // Buscar usuários (sem senhas)
    console.log('\n👥 Buscando usuários:');
    const usersResult = await pool.query(`
      SELECT id, username, email, role 
      FROM users 
      ORDER BY id
    `);
    
    console.log(`Encontrados ${usersResult.rows.length} usuários:`);
    usersResult.rows.forEach(user => {
      console.log(`  - ${user.username} (${user.email}) - ${user.role}`);
    });

    console.log('\n🎉 Teste de conexão concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

testConnection();
