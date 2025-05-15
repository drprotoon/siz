import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Obter o diretório atual em módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega variáveis de ambiente apenas em desenvolvimento
// Em produção, as variáveis de ambiente devem ser configuradas no ambiente
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
}

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
export const bucketName = 'product-images';

// Verifica se as credenciais do Supabase estão configuradas
const isSupabaseConfigured = supabaseUrl && supabaseKey;

console.log(`Supabase configuration status: ${isSupabaseConfigured ? 'Configured' : 'Not configured'}`);
if (isSupabaseConfigured) {
  console.log(`Supabase URL: ${supabaseUrl.substring(0, 10)}...`);
  console.log(`Supabase Key: ${supabaseKey.substring(0, 5)}...`);
} else {
  console.log('Supabase credentials are missing. Check your .env file.');
}

// Cliente do Supabase
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

console.log(`Supabase client initialized: ${supabase ? 'Yes' : 'No'}`);

/**
 * Verifica a conexão com o Supabase
 * @returns true se a conexão estiver funcionando, false caso contrário
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  if (!supabase) {
    console.warn('Supabase não configurado. Não é possível verificar a conexão.');
    return false;
  }

  try {
    // Tenta listar os buckets para verificar se a conexão está funcionando
    const { data, error } = await supabase.storage.listBuckets();

    if (error) {
      console.error('Erro ao verificar conexão com Supabase:', error);
      return false;
    }

    console.log('Conexão com Supabase verificada com sucesso!');
    console.log('Buckets disponíveis:', data?.map(b => b.name) || []);
    return true;
  } catch (error) {
    console.error('Erro ao verificar conexão com Supabase:', error);
    return false;
  }
}

/**
 * Inicializa o serviço de armazenamento
 * Cria o bucket se não existir
 */
export async function initSupabaseStorage() {
  if (!supabase) {
    console.warn('Supabase não configurado. As imagens serão servidas localmente.');
    return false;
  }

  try {
    console.log('Initializing storage service...');

    // Verifica se o bucket existe
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error('Error listing buckets:', listError);
      return false;
    }

    console.log('Available buckets:', buckets?.map(b => b.name) || []);

    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    console.log(`Bucket '${bucketName}' exists: ${bucketExists ? 'Yes' : 'No'}`);

    if (!bucketExists) {
      console.log(`Creating bucket '${bucketName}'...`);
      // Cria o bucket se não existir
      const { error } = await supabase.storage.createBucket(bucketName, {
        public: true, // Permite acesso público às imagens
      });

      if (error) {
        console.error('Erro ao criar bucket:', error);
        return false;
      }
      console.log(`Bucket '${bucketName}' created successfully`);
    }

    // Test listing the bucket contents
    try {
      console.log(`Testing bucket access by listing root contents...`);
      const { data, error } = await supabase.storage.from(bucketName).list();

      if (error) {
        console.error('Error accessing bucket:', error);
      } else {
        console.log(`Bucket access successful. Found ${data?.length || 0} items at root.`);
      }
    } catch (testError) {
      console.error('Error testing bucket access:', testError);
    }

    console.log('Serviço de armazenamento inicializado com sucesso!');
    return true;
  } catch (error) {
    console.error('Erro ao inicializar serviço de armazenamento:', error);
    return false;
  }
}
