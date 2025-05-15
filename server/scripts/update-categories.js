// Script para atualizar as categorias no banco de dados
import { db } from '../db.js';
import { categories } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';

async function updateCategories() {
  try {
    console.log('Iniciando atualização das categorias...');

    // Limpar categorias existentes
    console.log('Removendo categorias existentes...');
    await db.delete(categories);

    // Criar novas categorias principais
    console.log('Criando categorias principais...');
    
    // Categoria Feminino
    const [feminino] = await db.insert(categories).values({
      name: 'Feminino',
      slug: 'feminino',
      description: 'Produtos de beleza e cuidados pessoais para mulheres',
      imageUrl: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    }).returning();
    
    console.log('Categoria Feminino criada:', feminino);

    // Categoria Masculino
    const [masculino] = await db.insert(categories).values({
      name: 'Masculino',
      slug: 'masculino',
      description: 'Produtos de beleza e cuidados pessoais para homens',
      imageUrl: 'https://images.unsplash.com/photo-1581750219816-c6e04d103c9a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    }).returning();
    
    console.log('Categoria Masculino criada:', masculino);

    // Criar subcategorias para Feminino
    console.log('Criando subcategorias para Feminino...');
    
    // Perfumes Femininos
    const [perfumesFemininos] = await db.insert(categories).values({
      name: 'Perfumes Femininos',
      slug: 'perfumes-femininos',
      description: 'Fragrâncias exclusivas para mulheres',
      imageUrl: 'https://images.unsplash.com/photo-1600612253971-422e7f7faeb6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      parentId: feminino.id
    }).returning();
    
    console.log('Subcategoria Perfumes Femininos criada:', perfumesFemininos);

    // Cabelos
    const [cabelos] = await db.insert(categories).values({
      name: 'Cabelos',
      slug: 'cabelos',
      description: 'Produtos para cuidados com os cabelos',
      imageUrl: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      parentId: feminino.id
    }).returning();
    
    console.log('Subcategoria Cabelos criada:', cabelos);

    // Corpo e Banho
    const [corpoEBanho] = await db.insert(categories).values({
      name: 'Corpo e Banho',
      slug: 'corpo-e-banho',
      description: 'Produtos para cuidados com o corpo e banho',
      imageUrl: 'https://images.unsplash.com/photo-1570194065650-d99fb4cb7300?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      parentId: feminino.id
    }).returning();
    
    console.log('Subcategoria Corpo e Banho criada:', corpoEBanho);

    // Maquiagem
    const [maquiagem] = await db.insert(categories).values({
      name: 'Maquiagem',
      slug: 'maquiagem',
      description: 'Produtos de maquiagem para realçar sua beleza',
      imageUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      parentId: feminino.id
    }).returning();
    
    console.log('Subcategoria Maquiagem criada:', maquiagem);

    // Skincare
    const [skincare] = await db.insert(categories).values({
      name: 'Skincare',
      slug: 'skincare',
      description: 'Produtos para cuidados com a pele',
      imageUrl: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      parentId: feminino.id
    }).returning();
    
    console.log('Subcategoria Skincare criada:', skincare);

    // Criar subcategorias para Masculino
    console.log('Criando subcategorias para Masculino...');
    
    // Perfumes Masculinos
    const [perfumesMasculinos] = await db.insert(categories).values({
      name: 'Perfumes Masculinos',
      slug: 'perfumes-masculinos',
      description: 'Fragrâncias exclusivas para homens',
      imageUrl: 'https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      parentId: masculino.id
    }).returning();
    
    console.log('Subcategoria Perfumes Masculinos criada:', perfumesMasculinos);

    // Kits Masculinos
    const [kitsMasculinos] = await db.insert(categories).values({
      name: 'Kits Masculinos',
      slug: 'kits-masculinos',
      description: 'Kits completos para cuidados masculinos',
      imageUrl: 'https://images.unsplash.com/photo-1621607512214-68297480165e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      parentId: masculino.id
    }).returning();
    
    console.log('Subcategoria Kits Masculinos criada:', kitsMasculinos);

    console.log('Atualização das categorias concluída com sucesso!');
  } catch (error) {
    console.error('Erro ao atualizar categorias:', error);
  } finally {
    process.exit(0);
  }
}

updateCategories();
