import { db } from "../server/db";
import { users, categories, products, reviews } from "../shared/schema";
import * as bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Helper function to convert string to array for PostgreSQL
function stringToArray(str: string): string[] {
  if (Array.isArray(str)) return str;
  try {
    const parsed = JSON.parse(str);
    return Array.isArray(parsed) ? parsed : [str];
  } catch (e) {
    return [str];
  }
}

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: join(__dirname, '..', '.env') });

async function seedDatabase() {
  console.log("Iniciando o processo de seed do banco de dados...");

  try {
    // Verificar se já existem dados no banco
    const existingProducts = await db.select().from(products);

    if (existingProducts.length > 0) {
      console.log(`Já existem ${existingProducts.length} produtos no banco de dados.`);
      console.log("Pulando a limpeza do banco para preservar os dados existentes.");
    } else {
      // Limpar o banco de dados apenas se não houver produtos
      await db.delete(reviews);
      await db.delete(products);
      await db.delete(categories);
      // Não vamos deletar os usuários para preservar contas existentes

      console.log("Banco de dados limpo para inserção de novos dados");
    }

    // Criar usuários de teste
    const hashedPassword = await bcrypt.hash("123456", 10);

    // Verificar se o usuário admin já existe
    const existingAdmin = await db.select().from(users).where(eq(users.username, "admin"));
    let adminUser;

    if (existingAdmin.length === 0) {
      [adminUser] = await db.insert(users).values({
        username: "admin",
        password: hashedPassword,
        email: "admin@beautyessence.com",
        role: "admin",
        fullName: "Administrador",
        address: "Av Paulista, 1000",
        city: "São Paulo",
        state: "SP",
        postalCode: "01310-100",
        country: "Brasil",
        phone: "11987654321"
      }).returning();
      console.log("Usuário admin criado com sucesso");
    } else {
      adminUser = existingAdmin[0];
      console.log("Usuário admin já existe, pulando criação");
    }

    // Verificar se o usuário teste já existe
    const existingTest = await db.select().from(users).where(eq(users.username, "teste"));
    let testUser;

    if (existingTest.length === 0) {
      [testUser] = await db.insert(users).values({
        username: "teste",
        password: hashedPassword,
        email: "teste@exemplo.com",
        role: "customer",
        fullName: "Usuário Teste",
        address: "Rua Exemplo, 123",
        city: "Rio de Janeiro",
        state: "RJ",
        postalCode: "22222-222",
        country: "Brasil",
        phone: "21987654321"
      }).returning();
      console.log("Usuário teste criado com sucesso");
    } else {
      testUser = existingTest[0];
      console.log("Usuário teste já existe, pulando criação");
    }

    console.log(`Usuários criados: ${adminUser.id}, ${testUser.id}`);

    // Verificar categorias existentes
    const existingCategories = await db.select().from(categories);
    let createdCategories;

    if (existingCategories.length > 0) {
      console.log(`Já existem ${existingCategories.length} categorias no banco de dados.`);
      createdCategories = existingCategories;
    } else {
      // Criar categorias
      const categoryData = [
        {
          name: "Skincare",
          slug: "skincare",
          description: "Produtos para cuidados com a pele",
          imageUrl: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80"
        },
        {
          name: "Maquiagem",
          slug: "maquiagem",
          description: "Produtos de maquiagem para todos os tipos de pele",
          imageUrl: "https://images.unsplash.com/photo-1596704017248-eb02655de3e4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80"
        },
        {
          name: "Cabelos",
          slug: "cabelos",
          description: "Produtos para cuidados com os cabelos",
          imageUrl: "https://images.unsplash.com/photo-1576426863848-c21f53c60b19?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80"
        },
        {
          name: "Corpo & Banho",
          slug: "corpo-banho",
          description: "Produtos para cuidados com o corpo",
          imageUrl: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1771&q=80"
        },
        {
          name: "Fragrâncias",
          slug: "fragrancias",
          description: "Perfumes e fragrâncias para todos os gostos",
          imageUrl: "https://images.unsplash.com/photo-1595425964072-537c688fe172?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80"
        },
        {
          name: "Kits",
          slug: "kits",
          description: "Kits de produtos para cuidados completos",
          imageUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80"
        }
      ];

      createdCategories = await db.insert(categories).values(categoryData).returning();
      console.log(`Categorias criadas: ${createdCategories.length}`);
    }

    // Mapear categorias por slug para referência mais fácil
    const categoryMap = createdCategories.reduce((map, category) => {
      map[category.slug] = category.id;
      return map;
    }, {} as Record<string, number>);

    // Criar produtos
    const productData = [
      // Skincare
      {
        name: "Creme Hidratante Facial",
        slug: "creme-hidratante-facial",
        description: "Um creme hidratante rico que nutre profundamente a pele, deixando-a macia e radiante. Formulado com ácido hialurônico e vitaminas essenciais.",
        price: "89.90",
        compareatprice: "99.90",
        sku: "SKN001",
        weight: "150.00",
        quantity: 50,
        categoryId: categoryMap["skincare"],
        images: ["https://images.unsplash.com/photo-1556228578-8c89e6adf883?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80"],
        ingredients: "Água, Glicerina, Ácido Hialurônico, Extrato de Aloe Vera, Vitamina E, Extrato de Camomila",
        howtouse: "Aplique uma quantidade generosa em todo o rosto e pescoço após a limpeza, de manhã e à noite.",
        visible: true,
        featured: true,
        newArrival: false,
        bestSeller: true
      },
      {
        name: "Sérum de Vitamina C",
        slug: "serum-vitamina-c",
        description: "Sérum potente que ilumina e uniformiza o tom da pele, reduzindo manchas escuras e linhas finas. Enriquecido com 15% de vitamina C estabilizada.",
        price: "129.90",
        compareatprice: "149.90",
        sku: "SKN002",
        weight: "30.00",
        quantity: 35,
        categoryId: categoryMap["skincare"],
        images: ["https://images.unsplash.com/photo-1617993752826-ff4582b4b9d4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80"],
        ingredients: "Água, Ascorbato de Sódio, Ácido Ferúlico, Vitamina E, Extrato de Chá Verde, Ácido Hialurônico",
        howtouse: "Aplique algumas gotas na pele limpa e seca antes do hidratante, preferencialmente pela manhã.",
        visible: true,
        featured: true,
        newArrival: true,
        bestSeller: false
      },
      {
        name: "Máscara Facial de Argila",
        slug: "mascara-facial-argila",
        description: "Máscara purificante que remove impurezas e excesso de oleosidade, minimizando a aparência dos poros e deixando a pele fresca e renovada.",
        price: "69.90",
        compareatprice: null,
        sku: "SKN003",
        weight: "100.00",
        quantity: 40,
        categoryId: categoryMap["skincare"],
        images: ["https://images.unsplash.com/photo-1600213903598-25be92abde40?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1773&q=80"],
        ingredients: "Argila Verde, Óleo de Tea Tree, Extrato de Pepino, Kaolin, Glicerina, Ácido Salicílico",
        howtouse: "Aplique uma camada uniforme na pele limpa, evitando a área dos olhos. Deixe agir por 10-15 minutos e enxágue com água morna.",
        visible: true,
        featured: false,
        newArrival: false,
        bestSeller: false
      },

      // Maquiagem
      {
        name: "Base de Longa Duração",
        slug: "base-longa-duracao",
        description: "Base de cobertura média a alta que dura até 24 horas, com acabamento mate e resistente à água. Disponível em 30 tons inclusivos.",
        price: "119.90",
        compareatprice: null,
        sku: "MKP001",
        weight: "30.00",
        quantity: 60,
        categoryId: categoryMap["maquiagem"],
        images: ["https://images.unsplash.com/photo-1590156562745-5c67451bf4c9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1771&q=80"],
        ingredients: "Água, Ciclopentasiloxano, Dimeticona, Óxidos de Ferro, Dióxido de Titânio, Extrato de Camomila",
        howtouse: "Aplique pequenas quantidades no rosto e espalhe com uma esponja ou pincel para um acabamento uniforme.",
        visible: true,
        featured: true,
        newArrival: false,
        bestSeller: true
      },
      {
        name: "Paleta de Sombras",
        slug: "paleta-sombras",
        description: "Paleta versátil com 16 cores altamente pigmentadas em acabamentos mate, acetinado e metálico. Perfeita para criar diversos estilos de maquiagem.",
        price: "159.90",
        compareatprice: "179.90",
        sku: "MKP002",
        weight: "120.00",
        quantity: 25,
        categoryId: categoryMap["maquiagem"],
        images: ["https://images.unsplash.com/photo-1617897903246-719242758050?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80"],
        ingredients: "Talco, Mica, Óxidos de Ferro, Estearato de Zinco, Silicones, Parabenos",
        howtouse: "Aplique com um pincel de sombra limpo, construindo a intensidade gradualmente. Use tons mais claros na pálpebra móvel e tons mais escuros na dobra.",
        visible: true,
        featured: true,
        newArrival: true,
        bestSeller: false
      },
      {
        name: "Batom Líquido Mate",
        slug: "batom-liquido-mate",
        description: "Batom líquido de longa duração com acabamento mate aveludado. Fórmula leve e confortável que não resseca os lábios.",
        price: "79.90",
        compareatprice: null,
        sku: "MKP003",
        weight: "5.00",
        quantity: 45,
        categoryId: categoryMap["maquiagem"],
        images: ["https://images.unsplash.com/photo-1586495777744-4413f21062fa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1830&q=80"],
        ingredients: "Dimeticona, Isododecano, Cera de Abelha, Óleo de Jojoba, Vitamina E, Pigmentos",
        howtouse: "Aplique começando pelo centro dos lábios e espalhe para as bordas. Para maior precisão, contorne os lábios com um lápis antes de aplicar.",
        visible: true,
        featured: false,
        newArrival: false,
        bestSeller: true
      },

      // Cabelos
      {
        name: "Shampoo Hidratante",
        slug: "shampoo-hidratante",
        description: "Shampoo nutritivo que limpa suavemente enquanto hidrata os fios, deixando os cabelos macios, brilhantes e fáceis de pentear.",
        price: "69.90",
        compareatprice: null,
        sku: "CAB001",
        weight: "300.00",
        quantity: 70,
        categoryId: categoryMap["cabelos"],
        images: ["https://images.unsplash.com/photo-1626093961922-40ea7320fc10?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80"],
        ingredients: "Água, Lauril Sulfato de Sódio, Cocamidopropil Betaína, Óleo de Argan, Pantenol, Extrato de Aloe Vera",
        howtouse: "Aplique no cabelo molhado, massageie suavemente e enxágue bem. Repita se necessário.",
        visible: true,
        featured: false,
        newArrival: false,
        bestSeller: true
      },
      {
        name: "Máscara Reparadora",
        slug: "mascara-reparadora",
        description: "Tratamento intensivo que repara cabelos danificados, selando as cutículas e prevenindo o frizz. Ideal para cabelos quimicamente tratados.",
        price: "89.90",
        compareatprice: "99.90",
        sku: "CAB002",
        weight: "250.00",
        quantity: 55,
        categoryId: categoryMap["cabelos"],
        images: ["https://images.unsplash.com/photo-1610705267928-1b9f2fa7f1c5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1974&q=80"],
        ingredients: "Água, Álcool Cetílico, Óleo de Coco, Queratina Hidrolisada, Proteínas da Seda, Manteiga de Karité",
        howtouse: "Após lavar o cabelo, aplique uma quantidade generosa por todo o comprimento, concentrando-se nas pontas. Deixe agir por 5-10 minutos e enxágue bem.",
        visible: true,
        featured: true,
        newArrival: true,
        bestSeller: false
      },
      {
        name: "Óleo Capilar Multifuncional",
        slug: "oleo-capilar-multifuncional",
        description: "Óleo leve que nutre, dá brilho e protege os cabelos do calor sem pesar. Pode ser usado antes ou depois da modelagem.",
        price: "79.90",
        compareatprice: null,
        sku: "CAB003",
        weight: "100.00",
        quantity: 40,
        categoryId: categoryMap["cabelos"],
        images: ["https://images.unsplash.com/photo-1662752375496-28f718bd96b9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1829&q=80"],
        ingredients: "Ciclopentasiloxano, Dimeticona, Óleo de Argan, Óleo de Jojoba, Óleo de Coco, Vitamina E",
        howtouse: "Aplique algumas gotas no cabelo úmido ou seco, concentrando-se nas pontas. Evite a raiz se tiver cabelo oleoso.",
        visible: true,
        featured: false,
        newArrival: false,
        bestSeller: false
      },

      // Corpo & Banho
      {
        name: "Gel de Banho Relaxante",
        slug: "gel-banho-relaxante",
        description: "Gel de banho aromático que limpa suavemente enquanto relaxa corpo e mente com uma fragrância calmante de lavanda e camomila.",
        price: "59.90",
        compareatprice: null,
        sku: "CRP001",
        weight: "400.00",
        quantity: 65,
        categoryId: categoryMap["corpo-banho"],
        images: ["https://images.unsplash.com/photo-1550309510-cf8c39a42dc0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80"],
        ingredients: "Água, Lauril Sulfato de Sódio, Cocamidopropil Betaína, Glicerina, Óleo Essencial de Lavanda, Extrato de Camomila",
        howtouse: "Aplique no corpo molhado, massageie para criar espuma e enxágue bem.",
        visible: true,
        featured: false,
        newArrival: true,
        bestSeller: false
      },
      {
        name: "Esfoliante Corporal",
        slug: "esfoliante-corporal",
        description: "Esfoliante que remove células mortas e renova a pele, deixando-a macia e pronta para absorver os benefícios de outros produtos.",
        price: "79.90",
        compareatprice: "89.90",
        sku: "CRP002",
        weight: "200.00",
        quantity: 45,
        categoryId: categoryMap["corpo-banho"],
        images: ["https://images.unsplash.com/photo-1614859131177-3ed0523ae615?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80"],
        ingredients: "Açúcar, Óleo de Coco, Óleo de Amêndoas Doces, Manteiga de Karité, Óleo Essencial de Laranja, Vitamina E",
        howtouse: "Aplique na pele úmida com movimentos circulares. Massageie suavemente e enxágue com água morna.",
        visible: true,
        featured: true,
        newArrival: false,
        bestSeller: true
      },
      {
        name: "Loção Hidratante Corporal",
        slug: "locao-hidratante-corporal",
        description: "Loção leve que hidrata profundamente a pele sem sensação pegajosa. Absorção rápida e hidratação por até 48 horas.",
        price: "69.90",
        compareatprice: null,
        sku: "CRP003",
        weight: "300.00",
        quantity: 55,
        categoryId: categoryMap["corpo-banho"],
        images: ["https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80"],
        ingredients: "Água, Glicerina, Manteiga de Karité, Óleo de Jojoba, Vitamina E, Extrato de Aloe Vera",
        howtouse: "Aplique generosamente por todo o corpo após o banho ou quando necessário. Massageie até completa absorção.",
        visible: true,
        featured: false,
        newArrival: false,
        bestSeller: false
      },

      // Fragrâncias
      {
        name: "Eau de Parfum Floral",
        slug: "eau-de-parfum-floral",
        description: "Fragrância sofisticada com notas de jasmim, rosa e baunilha. Elegante e feminina, ideal para uso diário ou ocasiões especiais.",
        price: "199.90",
        compareatprice: null,
        sku: "FRG001",
        weight: "50.00",
        quantity: 30,
        categoryId: categoryMap["fragrancias"],
        images: ["https://images.unsplash.com/photo-1592914637125-10b313c2f8fc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80"],
        ingredients: "Álcool, Água, Fragrância, Óleo de Jojoba",
        howtouse: "Aplique nos pulsos, atrás das orelhas e no pescoço. Para maior duração, aplique após o banho quando a pele ainda está úmida.",
        visible: true,
        featured: true,
        newArrival: false,
        bestSeller: true
      },
      {
        name: "Eau de Toilette Cítrico",
        slug: "eau-de-toilette-citrico",
        description: "Fragrância refrescante com notas de limão, bergamota e lavanda. Perfeita para o dia-a-dia e climas quentes.",
        price: "149.90",
        compareatprice: "169.90",
        sku: "FRG002",
        weight: "100.00",
        quantity: 25,
        categoryId: categoryMap["fragrancias"],
        images: ["https://images.unsplash.com/photo-1615677197053-a8b34ddc0f78?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80"],
        ingredients: "Álcool, Água, Fragrância, Extrato de Citrus",
        howtouse: "Aplique generosamente no corpo após o banho. Reaplicar ao longo do dia se necessário.",
        visible: true,
        featured: false,
        newArrival: true,
        bestSeller: false
      },
      {
        name: "Body Mist Frutal",
        slug: "body-mist-frutal",
        description: "Névoa corporal leve com notas de pêssego, maçã e pera. Ideal para refrescar-se ao longo do dia e para climas quentes.",
        price: "89.90",
        compareatprice: null,
        sku: "FRG003",
        weight: "150.00",
        quantity: 40,
        categoryId: categoryMap["fragrancias"],
        images: ["https://images.unsplash.com/photo-1622618991746-fe6004db3a47?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1974&q=80"],
        ingredients: "Água, Álcool, Fragrância, Glicerina",
        howtouse: "Borrife generosamente por todo o corpo. Pode ser aplicado diretamente na pele ou nas roupas.",
        visible: true,
        featured: false,
        newArrival: false,
        bestSeller: false
      },

      // Kits Wella
      {
        name: "Kit Wella Nutri Enrich Nutrição Profunda 1L",
        slug: "kit-wella-nutri-enrich-nutricao-profunda-1l",
        description: "Kit completo para nutrição profunda dos cabelos, contendo Shampoo de 1 litro, Condicionador de 1 litro e Máscara de 500 gramas.",
        price: "623.70",
        compareatprice: "699.90",
        sku: "WELLA-KIT-001",
        weight: "2500.00",
        quantity: 15,
        categoryId: categoryMap["kits"],
        images: [],
        ingredients: "Água, Lauril Sulfato de Sódio, Cocamidopropil Betaína, Proteínas, Vitaminas, Óleos Essenciais",
        howtouse: "Aplique o shampoo nos cabelos molhados, massageie e enxágue. Em seguida, aplique o condicionador, deixe agir por 3 minutos e enxágue. Para tratamento intensivo, aplique a máscara após o shampoo, deixe agir por 5-10 minutos e enxágue.",
        visible: true,
        featured: true,
        newArrival: true,
        bestSeller: false
      },
      {
        name: "Kit Wella Nutri Enrich 250ml",
        slug: "kit-wella-nutri-enrich-250ml",
        description: "Kit para nutrição dos cabelos, contendo Shampoo de 250ml, Condicionador de 200ml e Máscara de 150ml.",
        price: "340.70",
        compareatprice: "399.90",
        sku: "WELLA-KIT-002",
        weight: "600.00",
        quantity: 20,
        categoryId: categoryMap["kits"],
        images: [],
        ingredients: "Água, Lauril Sulfato de Sódio, Cocamidopropil Betaína, Proteínas, Vitaminas, Óleos Essenciais",
        howtouse: "Aplique o shampoo nos cabelos molhados, massageie e enxágue. Em seguida, aplique o condicionador, deixe agir por 3 minutos e enxágue. Para tratamento intensivo, aplique a máscara após o shampoo, deixe agir por 5-10 minutos e enxágue.",
        visible: true,
        featured: false,
        newArrival: true,
        bestSeller: false
      },
      {
        name: "Kit Wella Color Brilliance 1L",
        slug: "kit-wella-color-brilliance-1l",
        description: "Kit para proteção da cor e hidratação, contendo Shampoo de 1 litro, Condicionador de 1 litro e Máscara de 500ml.",
        price: "633.70",
        compareatprice: "699.90",
        sku: "WELLA-KIT-003",
        weight: "2500.00",
        quantity: 15,
        categoryId: categoryMap["kits"],
        images: [],
        ingredients: "Água, Lauril Sulfato de Sódio, Cocamidopropil Betaína, Proteínas, Vitaminas, Óleos Essenciais, Filtro UV",
        howtouse: "Aplique o shampoo nos cabelos molhados, massageie e enxágue. Em seguida, aplique o condicionador, deixe agir por 3 minutos e enxágue. Para tratamento intensivo, aplique a máscara após o shampoo, deixe agir por 5-10 minutos e enxágue.",
        visible: true,
        featured: true,
        newArrival: true,
        bestSeller: false
      },
      {
        name: "Kit Wella Color Brilliance 250ml",
        slug: "kit-wella-color-brilliance-250ml",
        description: "Kit para proteção da cor e hidratação, contendo Shampoo de 250ml e Máscara de 150ml.",
        price: "228.80",
        compareatprice: "249.90",
        sku: "WELLA-KIT-004",
        weight: "400.00",
        quantity: 20,
        categoryId: categoryMap["kits"],
        images: [],
        ingredients: "Água, Lauril Sulfato de Sódio, Cocamidopropil Betaína, Proteínas, Vitaminas, Óleos Essenciais, Filtro UV",
        howtouse: "Aplique o shampoo nos cabelos molhados, massageie e enxágue. Para tratamento intensivo, aplique a máscara após o shampoo, deixe agir por 5-10 minutos e enxágue.",
        visible: true,
        featured: false,
        newArrival: true,
        bestSeller: false
      },
      {
        name: "Kit Wella Fusion Reparação Intensa",
        slug: "kit-wella-fusion-reparacao-intensa",
        description: "Kit para reparação intensa dos cabelos, contendo Shampoo de 1 litro e Máscara de 500ml.",
        price: "585.80",
        compareatprice: "629.90",
        sku: "WELLA-KIT-005",
        weight: "1500.00",
        quantity: 10,
        categoryId: categoryMap["kits"],
        images: [],
        ingredients: "Água, Lauril Sulfato de Sódio, Cocamidopropil Betaína, Proteínas, Aminoácidos, Óleos Essenciais",
        howtouse: "Aplique o shampoo nos cabelos molhados, massageie e enxágue. Para tratamento intensivo, aplique a máscara após o shampoo, deixe agir por 5-10 minutos e enxágue.",
        visible: true,
        featured: false,
        newArrival: true,
        bestSeller: false
      },
      {
        name: "Kit Sebastian Wella Revitalizante 1L",
        slug: "kit-sebastian-wella-revitalizante-1l",
        description: "Kit revitalizante para cabelos, contendo Shampoo de 1 litro, Condicionador de 1 litro e Máscara de 500ml.",
        price: "999.70",
        compareatprice: "1099.90",
        sku: "WELLA-KIT-006",
        weight: "2500.00",
        quantity: 8,
        categoryId: categoryMap["kits"],
        images: [],
        ingredients: "Água, Lauril Sulfato de Sódio, Cocamidopropil Betaína, Proteínas, Vitaminas, Óleos Essenciais",
        howtouse: "Aplique o shampoo nos cabelos molhados, massageie e enxágue. Em seguida, aplique o condicionador, deixe agir por 3 minutos e enxágue. Para tratamento intensivo, aplique a máscara após o shampoo, deixe agir por 5-10 minutos e enxágue.",
        visible: true,
        featured: true,
        newArrival: true,
        bestSeller: false
      },
      {
        name: "Óleo Oil Reflections 100ml",
        slug: "oleo-oil-reflections-100ml",
        description: "Óleo para cabelos que proporciona brilho intenso e hidratação profunda.",
        price: "179.90",
        compareatprice: null,
        sku: "WELLA-OIL-001",
        weight: "100.00",
        quantity: 25,
        categoryId: categoryMap["cabelos"],
        images: [],
        ingredients: "Óleo de Argan, Óleo de Macadâmia, Vitamina E, Silicones",
        howtouse: "Aplique algumas gotas nas pontas dos cabelos úmidos ou secos para controlar o frizz e adicionar brilho.",
        visible: true,
        featured: false,
        newArrival: true,
        bestSeller: false
      },
      {
        name: "Óleo Oil Reflections 30ml",
        slug: "oleo-oil-reflections-30ml",
        description: "Óleo para cabelos que proporciona brilho intenso e hidratação profunda.",
        price: "76.90",
        compareatprice: null,
        sku: "WELLA-OIL-002",
        weight: "30.00",
        quantity: 30,
        categoryId: categoryMap["cabelos"],
        images: [],
        ingredients: "Óleo de Argan, Óleo de Macadâmia, Vitamina E, Silicones",
        howtouse: "Aplique algumas gotas nas pontas dos cabelos úmidos ou secos para controlar o frizz e adicionar brilho.",
        visible: true,
        featured: false,
        newArrival: true,
        bestSeller: false
      },
      {
        name: "Óleo Oil Reflections Light 100ml",
        slug: "oleo-oil-reflections-light-100ml",
        description: "Óleo leve para cabelos finos que proporciona brilho sem pesar.",
        price: "179.90",
        compareatprice: null,
        sku: "WELLA-OIL-003",
        weight: "100.00",
        quantity: 25,
        categoryId: categoryMap["cabelos"],
        images: [],
        ingredients: "Óleo de Camélia, Óleo de Abacate, Vitamina E, Silicones Leves",
        howtouse: "Aplique algumas gotas nas pontas dos cabelos úmidos ou secos para controlar o frizz e adicionar brilho sem pesar.",
        visible: true,
        featured: false,
        newArrival: true,
        bestSeller: false
      },
      {
        name: "Óleo Oil Reflections Light 30ml",
        slug: "oleo-oil-reflections-light-30ml",
        description: "Óleo leve para cabelos finos que proporciona brilho sem pesar.",
        price: "76.90",
        compareatprice: null,
        sku: "WELLA-OIL-004",
        weight: "30.00",
        quantity: 30,
        categoryId: categoryMap["cabelos"],
        images: [],
        ingredients: "Óleo de Camélia, Óleo de Abacate, Vitamina E, Silicones Leves",
        howtouse: "Aplique algumas gotas nas pontas dos cabelos úmidos ou secos para controlar o frizz e adicionar brilho sem pesar.",
        visible: true,
        featured: false,
        newArrival: true,
        bestSeller: false
      },
      {
        name: "Kit Sebastian Penetraitt Wella 1L",
        slug: "kit-sebastian-penetraitt-wella-1l",
        description: "Kit para cabelos danificados, contendo Shampoo de 1 litro, Condicionador de 1 litro e Máscara de 500ml.",
        price: "729.70",
        compareatprice: "799.90",
        sku: "WELLA-KIT-007",
        weight: "2500.00",
        quantity: 10,
        categoryId: categoryMap["kits"],
        images: [],
        ingredients: "Água, Lauril Sulfato de Sódio, Cocamidopropil Betaína, Proteínas, Queratina, Óleos Essenciais",
        howtouse: "Aplique o shampoo nos cabelos molhados, massageie e enxágue. Em seguida, aplique o condicionador, deixe agir por 3 minutos e enxágue. Para tratamento intensivo, aplique a máscara após o shampoo, deixe agir por 5-10 minutos e enxágue.",
        visible: true,
        featured: true,
        newArrival: true,
        bestSeller: false
      },
      {
        name: "Kit Wella Hidratação e Luminosidade 250ml",
        slug: "kit-wella-hidratacao-luminosidade-250ml",
        description: "Kit para hidratação e luminosidade dos cabelos, contendo Shampoo de 250ml, Condicionador de 200ml e Máscara de 150ml.",
        price: "441.70",
        compareatprice: "499.90",
        sku: "WELLA-KIT-008",
        weight: "600.00",
        quantity: 20,
        categoryId: categoryMap["kits"],
        images: [],
        ingredients: "Água, Lauril Sulfato de Sódio, Cocamidopropil Betaína, Proteínas, Vitaminas, Óleos Essenciais",
        howtouse: "Aplique o shampoo nos cabelos molhados, massageie e enxágue. Em seguida, aplique o condicionador, deixe agir por 3 minutos e enxágue. Para tratamento intensivo, aplique a máscara após o shampoo, deixe agir por 5-10 minutos e enxágue.",
        visible: true,
        featured: false,
        newArrival: true,
        bestSeller: false
      },
      {
        name: "Máscara Wella Oil Reflection 500ml",
        slug: "mascara-wella-oil-reflection-500ml",
        description: "Máscara de tratamento intensivo que proporciona brilho e hidratação profunda aos cabelos.",
        price: "309.90",
        compareatprice: null,
        sku: "WELLA-MASK-001",
        weight: "500.00",
        quantity: 15,
        categoryId: categoryMap["cabelos"],
        images: [],
        ingredients: "Água, Álcool Cetílico, Óleo de Argan, Óleo de Macadâmia, Queratina, Proteínas da Seda",
        howtouse: "Após lavar os cabelos com shampoo, aplique a máscara mecha por mecha, deixe agir por 5-10 minutos e enxágue abundantemente.",
        visible: true,
        featured: true,
        newArrival: true,
        bestSeller: false
      }
    ];

    // Verificar se já existem produtos
    const productsInDb = await db.select().from(products);
    let createdProducts;

    if (productsInDb.length > 0) {
      console.log(`Já existem ${productsInDb.length} produtos no banco de dados.`);
      createdProducts = productsInDb;
    } else {
      // Criar produtos
      createdProducts = await db.insert(products).values(productData).returning();
      console.log(`Produtos criados: ${createdProducts.length}`);
    }

    // Adicionar avaliações aos produtos
    const reviewsData = [
      {
        productId: createdProducts[0].id, // Creme Hidratante Facial
        userId: testUser.id,
        rating: 5,
        title: "Excelente produto!",
        comment: "Este creme é incrível! Minha pele nunca esteve tão hidratada. Recomendo muito!"
      },
      {
        productId: createdProducts[0].id, // Creme Hidratante Facial
        userId: testUser.id,
        rating: 4,
        title: "Muito bom",
        comment: "Ótimo produto, mas achei o preço um pouco alto. De qualquer forma, vale a pena pelo resultado."
      },
      {
        productId: createdProducts[1].id, // Sérum de Vitamina C
        userId: testUser.id,
        rating: 5,
        title: "O melhor sérum que já usei",
        comment: "Estou usando há 2 semanas e já notei uma diferença significativa na minha pele. As manchas estão mais claras e a pele mais luminosa."
      },
      {
        productId: createdProducts[3].id, // Base de Longa Duração
        userId: testUser.id,
        rating: 5,
        title: "Base perfeita",
        comment: "Cobertura incrível e realmente dura o dia todo. Não transfere para as roupas e tem acabamento natural."
      },
      {
        productId: createdProducts[7].id, // Esfoliante Corporal
        userId: testUser.id,
        rating: 4,
        title: "Bom esfoliante",
        comment: "Deixa a pele muito macia, mas o cheiro poderia ser mais agradável."
      }
    ];

    // Verificar se já existem avaliações
    const existingReviews = await db.select().from(reviews);

    if (existingReviews.length > 0) {
      console.log(`Já existem ${existingReviews.length} avaliações no banco de dados.`);
    } else {
      // Criar avaliações
      const createdReviews = await db.insert(reviews).values(reviewsData).returning();
      console.log(`Avaliações criadas: ${createdReviews.length}`);
    }

    // Atualizar as médias de avaliações dos produtos
    for (const product of createdProducts) {
      const productReviews = await db.select().from(reviews).where(eq(reviews.productId, product.id));

      if (productReviews.length > 0) {
        const totalRating = productReviews.reduce((sum, review) => sum + review.rating, 0);
        const avgRating = (totalRating / productReviews.length).toFixed(1);

        await db.update(products)
          .set({
            reviewCount: productReviews.length
          })
          .where(eq(products.id, product.id));

        console.log(`Atualizada a média de avaliações do produto ${product.id}: ${avgRating} (${productReviews.length} avaliações)`);
      }
    }

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Erro ao executar o seed:", error);
  }
}

seedDatabase().catch(console.error);
