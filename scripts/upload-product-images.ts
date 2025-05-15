import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../server/db';
import { products, categories } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { initStorageService, uploadMultipleFiles } from '../server/storage-service';
import { prepareImagesForStorage } from '../server/utils';

// Obter o diretório atual em módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Diretório base de assets
const ASSETS_DIR = path.resolve(__dirname, '../dist/public/assets');

// Mapeamento de categorias para diretórios
const CATEGORY_DIRS: Record<string, string | string[]> = {
  'skincare': 'skincare',
  'maquiagem': 'maquiagem',
  'cabelos': ['shampoo', 'condicionador', 'mascaras'],
  'fragrancias': 'fragrancias',
  'corpo-banho': 'corpo-banho',
  'kits': 'kit',
  'oleo': 'oleo'
};

// Função para escanear um diretório e retornar todos os arquivos de imagem
function scanImagesInDir(dir: string): string[] {
  if (!fs.existsSync(dir)) {
    console.warn(`Diretório não encontrado: ${dir}`);
    return [];
  }

  return fs.readdirSync(dir)
    .filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext);
    })
    .map(file => path.join(dir, file));
}

// Função para agrupar imagens por prefixo
function groupImagesByPrefix(images: string[]): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};

  for (const imagePath of images) {
    const fileName = path.basename(imagePath);
    // Assume que o nome do arquivo começa com um identificador do produto
    // Por exemplo: "kit-wella-nutri-01.jpg", "kit-wella-nutri-02.jpg"
    const prefix = fileName.split('-').slice(0, 3).join('-');
    
    if (!grouped[prefix]) {
      grouped[prefix] = [];
    }
    
    grouped[prefix].push(imagePath);
  }

  return grouped;
}

// Função principal
async function uploadProductImages() {
  // Inicializa o serviço de armazenamento
  await initStorageService();

  // Busca todas as categorias do banco de dados
  const allCategories = await db.select().from(categories);
  const categoryMap = new Map(allCategories.map(cat => [cat.slug, cat]));

  // Busca todos os produtos
  const allProducts = await db.select().from(products);
  let updatedCount = 0;

  // Processa cada categoria
  for (const [categorySlug, dirs] of Object.entries(CATEGORY_DIRS)) {
    const category = categoryMap.get(categorySlug);
    if (!category) {
      console.log(`Categoria não encontrada: ${categorySlug}`);
      continue;
    }

    let allImages: string[] = [];
    
    if (Array.isArray(dirs)) {
      // Se for um array de diretórios
      for (const dir of dirs) {
        const dirPath = path.join(ASSETS_DIR, dir);
        allImages = [...allImages, ...scanImagesInDir(dirPath)];
      }
    } else {
      // Se for um único diretório
      const dirPath = path.join(ASSETS_DIR, dirs);
      allImages = scanImagesInDir(dirPath);
    }

    // Agrupa as imagens por prefixo
    const groupedImages = groupImagesByPrefix(allImages);
    
    // Filtra produtos desta categoria
    const categoryProducts = allProducts.filter(p => p.categoryId === category.id);
    
    for (const product of categoryProducts) {
      // Procura imagens que correspondam ao produto
      let productImagePaths: string[] = [];
      
      // Tenta encontrar por slug
      const slug = product.slug;
      const slugParts = slug.split('-').slice(0, 3).join('-');
      
      // Procura por correspondências no agrupamento de imagens
      for (const [prefix, images] of Object.entries(groupedImages)) {
        if (slug.includes(prefix) || prefix.includes(slugParts)) {
          productImagePaths = images;
          break;
        }
      }

      // Se não encontrou imagens específicas, tenta por palavras-chave no nome
      if (productImagePaths.length === 0) {
        const keywords = product.name.toLowerCase().split(' ');
        
        for (const [prefix, images] of Object.entries(groupedImages)) {
          if (keywords.some(keyword => prefix.includes(keyword))) {
            productImagePaths = images;
            break;
          }
        }
      }

      // Se encontrou imagens, faz upload e atualiza o produto
      if (productImagePaths.length > 0) {
        console.log(`Fazendo upload de ${productImagePaths.length} imagens para: ${product.name}`);
        
        // Faz upload das imagens
        const imageUrls = await uploadMultipleFiles(productImagePaths, categorySlug);
        
        if (imageUrls.length > 0) {
          // Atualiza o produto no banco de dados
          await db.update(products)
            .set({ 
              images: prepareImagesForStorage(imageUrls) 
            })
            .where(eq(products.id, product.id));
          
          console.log(`Produto atualizado: ${product.name} com ${imageUrls.length} imagens`);
          updatedCount++;
        }
      } else {
        console.log(`Nenhuma imagem encontrada para: ${product.name}`);
      }
    }
  }

  console.log(`Total de produtos atualizados: ${updatedCount} de ${allProducts.length}`);
}

// Executa o script
uploadProductImages().catch(console.error);
