import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from '../shared/schema';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { eq } from 'drizzle-orm';

// Helper function to convert array to JSON string for SQLite
function arrayToJsonString(arr: string[]): string {
  return JSON.stringify(arr);
}

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: join(__dirname, '..', '.env') });

async function seedDatabase() {
  console.log('Seeding SQLite database...');

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  try {
    // Extract the file path from the DATABASE_URL
    const dbPath = process.env.DATABASE_URL.replace('file:', '');
    
    console.log(`Connecting to SQLite database at: ${dbPath}`);
    
    // Create a database connection
    const sqlite = new Database(dbPath);
    
    // Create the drizzle client
    const db = drizzle(sqlite, { schema });
    
    // Get categories
    const categories = await db.select().from(schema.categories);
    
    if (categories.length === 0) {
      throw new Error('No categories found. Please run the setup script first.');
    }
    
    // Create a map of category slugs to IDs
    const categoryMap: Record<string, number> = {};
    categories.forEach(category => {
      categoryMap[category.slug] = category.id;
    });
    
    // Create products
    console.log('Creating products...');
    
    const productData = [
      // Skincare
      {
        name: "Creme Hidratante Facial",
        slug: "creme-hidratante-facial",
        description: "Um creme hidratante rico que nutre profundamente a pele, deixando-a macia e radiante. Formulado com ácido hialurônico e vitaminas essenciais.",
        price: 89.90,
        compareAtPrice: 99.90,
        sku: "SKN001",
        weight: 150.00,
        quantity: 50,
        categoryId: categoryMap["skincare"],
        images: arrayToJsonString(["https://images.unsplash.com/photo-1556228578-8c89e6adf883?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80"]),
        ingredients: "Água, Glicerina, Ácido Hialurônico, Extrato de Aloe Vera, Vitamina E, Extrato de Camomila",
        howToUse: "Aplique uma pequena quantidade no rosto limpo e massageie suavemente. Use de manhã e à noite para melhores resultados.",
        visible: true,
        featured: true,
        newArrival: false,
        bestSeller: true
      },
      {
        name: "Sérum de Vitamina C",
        slug: "serum-vitamina-c",
        description: "Sérum potente que ilumina a pele, reduz manchas e melhora a textura. Contém 10% de vitamina C pura para resultados visíveis.",
        price: 129.90,
        compareAtPrice: null,
        sku: "SKN002",
        weight: 30.00,
        quantity: 35,
        categoryId: categoryMap["skincare"],
        images: arrayToJsonString(["https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1742&q=80"]),
        ingredients: "Água, Ácido Ascórbico (Vitamina C), Ácido Ferúlico, Vitamina E, Glicerina, Ácido Hialurônico",
        howToUse: "Aplique algumas gotas no rosto limpo antes do hidratante. Use apenas à noite e sempre aplique protetor solar durante o dia.",
        visible: true,
        featured: true,
        newArrival: true,
        bestSeller: false
      },
      
      // Maquiagem
      {
        name: "Base de Longa Duração",
        slug: "base-longa-duracao",
        description: "Base de cobertura média a alta que dura até 24 horas, com acabamento mate e resistente à água. Disponível em 30 tons inclusivos.",
        price: 119.90,
        compareAtPrice: null,
        sku: "MKP001",
        weight: 30.00,
        quantity: 60,
        categoryId: categoryMap["maquiagem"],
        images: arrayToJsonString(["https://images.unsplash.com/photo-1590156562745-5c67451bf4c9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1771&q=80"]),
        ingredients: "Água, Ciclopentasiloxano, Dimeticona, Óxidos de Ferro, Dióxido de Titânio, Extrato de Camomila",
        howToUse: "Aplique pequenas quantidades no rosto e espalhe com uma esponja ou pincel para um acabamento uniforme.",
        visible: true,
        featured: true,
        newArrival: false,
        bestSeller: true
      },
      
      // Cabelos
      {
        name: "Shampoo Hidratante",
        slug: "shampoo-hidratante",
        description: "Shampoo nutritivo que limpa suavemente enquanto hidrata os fios, deixando os cabelos macios, brilhantes e fáceis de pentear.",
        price: 69.90,
        compareAtPrice: null,
        sku: "CAB001",
        weight: 300.00,
        quantity: 70,
        categoryId: categoryMap["cabelos"],
        images: arrayToJsonString(["https://images.unsplash.com/photo-1626093961922-40ea7320fc10?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80"]),
        ingredients: "Água, Lauril Sulfato de Sódio, Cocamidopropil Betaína, Óleo de Argan, Pantenol, Extrato de Aloe Vera",
        howToUse: "Aplique no cabelo molhado, massageie suavemente e enxágue bem. Repita se necessário.",
        visible: true,
        featured: false,
        newArrival: false,
        bestSeller: true
      },
      
      // Corpo & Banho
      {
        name: "Gel de Banho Relaxante",
        slug: "gel-banho-relaxante",
        description: "Gel de banho aromático que limpa suavemente enquanto relaxa corpo e mente com uma fragrância calmante de lavanda e camomila.",
        price: 59.90,
        compareAtPrice: null,
        sku: "CRP001",
        weight: 400.00,
        quantity: 65,
        categoryId: categoryMap["corpo-banho"],
        images: arrayToJsonString(["https://images.unsplash.com/photo-1550309510-cf8c39a42dc0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80"]),
        ingredients: "Água, Lauril Sulfato de Sódio, Cocamidopropil Betaína, Glicerina, Óleo Essencial de Lavanda, Extrato de Camomila",
        howToUse: "Aplique no corpo molhado, massageie para criar espuma e enxágue bem.",
        visible: true,
        featured: false,
        newArrival: true,
        bestSeller: false
      },
      
      // Fragrâncias
      {
        name: "Eau de Parfum Floral",
        slug: "eau-de-parfum-floral",
        description: "Fragrância sofisticada com notas de jasmim, rosa e baunilha. Elegante e feminina, ideal para uso diário ou ocasiões especiais.",
        price: 199.90,
        compareAtPrice: null,
        sku: "FRG001",
        weight: 50.00,
        quantity: 30,
        categoryId: categoryMap["fragrancias"],
        images: arrayToJsonString(["https://images.unsplash.com/photo-1592914637125-10b313c2f8fc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80"]),
        ingredients: "Álcool, Água, Fragrância, Óleo de Jojoba",
        howToUse: "Aplique nos pulsos, atrás das orelhas e no pescoço. Para maior duração, aplique após o banho quando a pele ainda está úmida.",
        visible: true,
        featured: true,
        newArrival: false,
        bestSeller: true
      }
    ];
    
    // Insert products
    const createdProducts = await db.insert(schema.products).values(productData).returning();
    console.log(`${createdProducts.length} products created successfully`);
    
    // Create reviews
    console.log('Creating reviews...');
    
    // Get users
    const users = await db.select().from(schema.users);
    
    if (users.length === 0) {
      throw new Error('No users found. Please run the setup script first.');
    }
    
    // Find test user
    const testUser = users.find(user => user.username === 'teste');
    
    if (!testUser) {
      throw new Error('Test user not found. Please run the setup script first.');
    }
    
    // Create reviews
    const reviewsData = [
      {
        productId: createdProducts[0].id, // Creme Hidratante Facial
        userId: testUser.id,
        rating: 5,
        title: "Excelente produto!",
        comment: "Este creme é incrível! Minha pele nunca esteve tão hidratada. Recomendo muito!"
      },
      {
        productId: createdProducts[1].id, // Sérum de Vitamina C
        userId: testUser.id,
        rating: 4,
        title: "Muito bom",
        comment: "Ótimo produto, mas achei o preço um pouco alto. De qualquer forma, vale a pena pelo resultado."
      }
    ];
    
    // Insert reviews
    const createdReviews = await db.insert(schema.reviews).values(reviewsData).returning();
    console.log(`${createdReviews.length} reviews created successfully`);
    
    // Update product ratings
    console.log('Updating product ratings...');
    
    for (const product of createdProducts) {
      const productReviews = await db.select().from(schema.reviews).where(eq(schema.reviews.productId, product.id));
      
      if (productReviews.length > 0) {
        const totalRating = productReviews.reduce((sum, review) => sum + review.rating, 0);
        const avgRating = totalRating / productReviews.length;
        
        await db.update(schema.products)
          .set({
            rating: avgRating,
            reviewCount: productReviews.length
          })
          .where(eq(schema.products.id, product.id));
        
        console.log(`Updated rating for product ${product.name}: ${avgRating} (${productReviews.length} reviews)`);
      }
    }
    
    // Close the database connection
    sqlite.close();
    
    console.log('Database seeding completed successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
