/**
 * Script para criar pastas para as novas categorias no Supabase Storage
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Carrega variáveis de ambiente
dotenv.config();

// Configuração do cliente Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const bucketName = process.env.SUPABASE_BUCKET || 'product-images';

// Verifica se as variáveis de ambiente estão configuradas
if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: SUPABASE_URL e SUPABASE_KEY devem ser configurados no arquivo .env');
  process.exit(1);
}

// Cria o cliente Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Cria uma pasta no bucket do Supabase
 */
async function createFolder(folderName) {
  try {
    // Adiciona uma barra no final para indicar que é uma pasta
    const folderPath = folderName.endsWith('/') ? folderName : `${folderName}/`;

    // Cria um arquivo vazio .keep para representar a pasta
    const { error } = await supabase.storage
      .from(bucketName)
      .upload(`${folderPath}.keep`, new Uint8Array(0), {
        contentType: 'application/octet-stream',
        upsert: true
      });

    if (error) {
      console.error(`Erro ao criar pasta '${folderName}':`, error);
      return false;
    }

    console.log(`Pasta '${folderName}' criada com sucesso no bucket`);
    return true;
  } catch (error) {
    console.error(`Erro ao criar pasta '${folderName}':`, error);
    return false;
  }
}

/**
 * Função principal
 */
async function main() {
  try {
    console.log('Iniciando criação de pastas para novas categorias...');

    // Lista de novas categorias
    const newCategories = [
      'feminino',
      'masculino',
      'perfumes-femininos',
      'perfumes-masculinos'
    ];

    // Cria uma pasta para cada categoria
    for (const category of newCategories) {
      await createFolder(category);
    }

    console.log('Criação de pastas concluída com sucesso!');
  } catch (error) {
    console.error('Erro:', error);
    process.exit(1);
  }
}

// Executa o script
main();
