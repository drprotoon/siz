import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function fixDatabaseSchema() {
  console.log("🔧 Verificando e corrigindo schema do banco de dados...");

  try {
    // Verificar se as colunas existem
    const checkColumns = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'products'
      AND table_schema = 'public'
    `);

    const existingColumns = checkColumns.rows.map((row: any) => row.column_name);
    console.log("Colunas existentes na tabela products:", existingColumns);

    // Lista de colunas que devem existir
    const requiredColumns = [
      'id', 'name', 'slug', 'description', 'price', 'compare_at_price',
      'sku', 'weight', 'quantity', 'category_id', 'images', 'ingredients',
      'how_to_use', 'visible', 'featured', 'new_arrival', 'best_seller',
      'rating', 'reviewcount', 'created_at'
    ];

    // Verificar colunas faltando
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

    if (missingColumns.length > 0) {
      console.log("❌ Colunas faltando:", missingColumns);

      // Adicionar colunas faltando
      for (const column of missingColumns) {
        try {
          let alterQuery = "";

          switch (column) {
            case 'compare_at_price':
              alterQuery = `ALTER TABLE products ADD COLUMN compare_at_price NUMERIC(10,2)`;
              break;
            case 'how_to_use':
              alterQuery = `ALTER TABLE products ADD COLUMN how_to_use TEXT`;
              break;
            case 'ingredients':
              alterQuery = `ALTER TABLE products ADD COLUMN ingredients TEXT`;
              break;
            case 'visible':
              alterQuery = `ALTER TABLE products ADD COLUMN visible BOOLEAN NOT NULL DEFAULT true`;
              break;
            case 'featured':
              alterQuery = `ALTER TABLE products ADD COLUMN featured BOOLEAN DEFAULT false`;
              break;
            case 'new_arrival':
              alterQuery = `ALTER TABLE products ADD COLUMN new_arrival BOOLEAN DEFAULT false`;
              break;
            case 'best_seller':
              alterQuery = `ALTER TABLE products ADD COLUMN best_seller BOOLEAN DEFAULT false`;
              break;
            case 'rating':
              alterQuery = `ALTER TABLE products ADD COLUMN rating NUMERIC(3,1) DEFAULT 0`;
              break;
            case 'reviewcount':
              alterQuery = `ALTER TABLE products ADD COLUMN reviewcount INTEGER DEFAULT 0`;
              break;
            default:
              console.log(`⚠️ Não sei como criar a coluna: ${column}`);
              continue;
          }

          if (alterQuery) {
            await db.execute(sql.raw(alterQuery));
            console.log(`✅ Coluna ${column} adicionada com sucesso`);
          }
        } catch (error) {
          console.error(`❌ Erro ao adicionar coluna ${column}:`, error.message);
        }
      }
    } else {
      console.log("✅ Todas as colunas necessárias existem");
    }

    // Verificar se há produtos na tabela
    const productCount = await db.execute(sql`SELECT COUNT(*) as count FROM products`);
    console.log(`📊 Total de produtos na tabela: ${productCount[0].count}`);

    console.log("🎉 Verificação do schema concluída!");

  } catch (error) {
    console.error("❌ Erro ao verificar schema:", error);
    throw error;
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  fixDatabaseSchema()
    .then(() => {
      console.log("✅ Script executado com sucesso!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Erro ao executar script:", error);
      process.exit(1);
    });
}

export { fixDatabaseSchema };
