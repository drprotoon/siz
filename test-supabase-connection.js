// Script para testar a conexão com o Supabase
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Obter o diretório atual em módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const bucketName = 'product-images';

console.log('Ambiente:', process.env.NODE_ENV || 'não definido');
console.log('Supabase URL:', supabaseUrl ? `${supabaseUrl.substring(0, 15)}...` : 'não definido');
console.log('Supabase Key:', supabaseKey ? `${supabaseKey.substring(0, 5)}...` : 'não definido');

// Verificar se as credenciais do Supabase estão configuradas
if (!supabaseUrl || !supabaseKey) {
  console.error('Credenciais do Supabase não encontradas nas variáveis de ambiente');
  process.exit(1);
}

// Criar cliente do Supabase
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Função para testar a conexão com o Supabase
async function testSupabaseConnection() {
  try {
    console.log('Testando conexão com o Supabase...');
    
    // Testar a conexão com o banco de dados
    const { data: dbData, error: dbError } = await supabase
      .from('products')
      .select('id, name')
      .limit(5);
    
    if (dbError) {
      console.error('Erro ao conectar ao banco de dados do Supabase:', dbError);
    } else {
      console.log('Conexão com o banco de dados do Supabase bem-sucedida!');
      console.log(`Produtos encontrados: ${dbData.length}`);
      if (dbData.length > 0) {
        console.log('Primeiros produtos:', dbData.map(p => `${p.id}: ${p.name}`).join(', '));
      }
    }
    
    // Testar a conexão com o storage
    console.log('\nTestando conexão com o Storage do Supabase...');
    
    // Verificar se o bucket existe
    const { data: bucketData, error: bucketError } = await supabase
      .storage
      .getBucket(bucketName);
    
    if (bucketError) {
      console.error('Erro ao verificar bucket no Supabase Storage:', bucketError);
      
      // Tentar listar todos os buckets
      const { data: allBuckets, error: bucketsError } = await supabase
        .storage
        .listBuckets();
      
      if (bucketsError) {
        console.error('Erro ao listar buckets:', bucketsError);
      } else {
        console.log('Buckets disponíveis:', allBuckets.map(b => b.name).join(', '));
      }
    } else {
      console.log(`Bucket '${bucketName}' encontrado:`, bucketData);
      
      // Listar arquivos no bucket
      const { data: files, error: filesError } = await supabase
        .storage
        .from(bucketName)
        .list();
      
      if (filesError) {
        console.error('Erro ao listar arquivos no bucket:', filesError);
      } else {
        console.log(`Arquivos no bucket '${bucketName}':`, files.length ? files.map(f => f.name).join(', ') : 'Nenhum arquivo encontrado');
      }
    }
    
    // Testar a autenticação
    console.log('\nTestando serviço de autenticação do Supabase...');
    
    // Verificar se o serviço de autenticação está funcionando
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('Erro ao verificar serviço de autenticação:', authError);
    } else {
      console.log('Serviço de autenticação do Supabase está funcionando!');
      console.log('Sessão atual:', authData);
    }
    
  } catch (error) {
    console.error('Erro ao testar conexão com o Supabase:', error);
  }
}

// Executar o teste
testSupabaseConnection();
