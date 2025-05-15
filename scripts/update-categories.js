/**
 * Script para atualizar as categorias no banco de dados
 * Adiciona as novas categorias Feminino e Masculino e suas subcategorias
 */

const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Carrega variáveis de ambiente
dotenv.config();

// Configuração da conexão com o banco de dados
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Verifica se uma categoria existe pelo slug
 */
async function categoryExists(slug) {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT id FROM categories WHERE slug = $1', [slug]);
    return result.rows.length > 0;
  } finally {
    client.release();
  }
}

/**
 * Cria uma nova categoria
 */
async function createCategory(category) {
  const client = await pool.connect();
  try {
    const { name, slug, description, imageUrl } = category;
    const result = await client.query(
      'INSERT INTO categories (name, slug, description, image_url) VALUES ($1, $2, $3, $4) RETURNING id',
      [name, slug, description, imageUrl]
    );
    return result.rows[0].id;
  } finally {
    client.release();
  }
}

/**
 * Função principal
 */
async function main() {
  try {
    console.log('Iniciando atualização de categorias...');

    // Novas categorias a serem adicionadas
    const newCategories = [
      {
        name: "Feminino",
        slug: "feminino",
        description: "Produtos de beleza e cuidados para mulheres",
        imageUrl: "https://images.unsplash.com/photo-1596704017248-eb02655de3e4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80"
      },
      {
        name: "Masculino",
        slug: "masculino",
        description: "Produtos de beleza e cuidados para homens",
        imageUrl: "https://images.unsplash.com/photo-1581750955744-3e8a5e635c82?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80"
      },
      {
        name: "Perfumes Femininos",
        slug: "perfumes-femininos",
        description: "Perfumes e fragrâncias para mulheres",
        imageUrl: "https://images.unsplash.com/photo-1595425964072-537c688fe172?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80"
      },
      {
        name: "Perfumes Masculinos",
        slug: "perfumes-masculinos",
        description: "Perfumes e fragrâncias para homens",
        imageUrl: "https://images.unsplash.com/photo-1595425964072-537c688fe172?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80"
      }
    ];

    // Adiciona cada categoria se ela não existir
    for (const category of newCategories) {
      if (await categoryExists(category.slug)) {
        console.log(`Categoria '${category.name}' já existe, pulando...`);
      } else {
        const id = await createCategory(category);
        console.log(`Categoria '${category.name}' criada com ID ${id}`);
      }
    }

    console.log('Atualização de categorias concluída com sucesso!');
  } catch (error) {
    console.error('Erro ao atualizar categorias:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Executa o script
main();
