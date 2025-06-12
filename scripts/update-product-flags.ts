import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateProductFlags() {
  try {
    console.log('Verificando estrutura da tabela products...');
    
    // First, let's check the current products
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, name, slug, best_seller, new_arrival, featured')
      .limit(5);

    if (fetchError) {
      console.error('Erro ao buscar produtos:', fetchError);
      return;
    }

    console.log('Produtos encontrados:', products?.length || 0);
    if (products && products.length > 0) {
      console.log('Exemplo de produto:', products[0]);
    }

    // Update some products to be best sellers
    console.log('\nAtualizando produtos como best sellers...');
    const { data: bestSellerUpdate, error: bestSellerError } = await supabase
      .from('products')
      .update({ best_seller: true })
      .in('id', [1, 2, 3])
      .select();

    if (bestSellerError) {
      console.error('Erro ao atualizar best sellers:', bestSellerError);
    } else {
      console.log('Best sellers atualizados:', bestSellerUpdate?.length || 0);
    }

    // Update some products to be new arrivals
    console.log('\nAtualizando produtos como new arrivals...');
    const { data: newArrivalUpdate, error: newArrivalError } = await supabase
      .from('products')
      .update({ new_arrival: true })
      .in('id', [4, 5, 6])
      .select();

    if (newArrivalError) {
      console.error('Erro ao atualizar new arrivals:', newArrivalError);
    } else {
      console.log('New arrivals atualizados:', newArrivalUpdate?.length || 0);
    }

    // Update some products to be featured
    console.log('\nAtualizando produtos como featured...');
    const { data: featuredUpdate, error: featuredError } = await supabase
      .from('products')
      .update({ featured: true })
      .in('id', [1, 4, 7])
      .select();

    if (featuredError) {
      console.error('Erro ao atualizar featured:', featuredError);
    } else {
      console.log('Featured atualizados:', featuredUpdate?.length || 0);
    }

    // Verify the updates
    console.log('\nVerificando atualizações...');
    const { data: updatedProducts, error: verifyError } = await supabase
      .from('products')
      .select('id, name, slug, best_seller, new_arrival, featured')
      .or('best_seller.eq.true,new_arrival.eq.true,featured.eq.true');

    if (verifyError) {
      console.error('Erro ao verificar atualizações:', verifyError);
    } else {
      console.log('Produtos com flags especiais:', updatedProducts?.length || 0);
      updatedProducts?.forEach(product => {
        console.log(`- ${product.name}: best_seller=${product.best_seller}, new_arrival=${product.new_arrival}, featured=${product.featured}`);
      });
    }

  } catch (error) {
    console.error('Erro geral:', error);
  }
}

// Run the script
updateProductFlags().then(() => {
  console.log('\nScript concluído!');
  process.exit(0);
}).catch(error => {
  console.error('Erro ao executar script:', error);
  process.exit(1);
});
