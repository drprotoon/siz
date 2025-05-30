import { createClient } from '@supabase/supabase-js';

// Inicializar cliente Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials not configured in environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Faz upload de uma imagem a partir de uma URL para o Supabase Storage
 * @param imageUrl URL da imagem a ser baixada e salva
 * @param bucketName Nome do bucket no Supabase Storage
 * @param filePath Caminho do arquivo no bucket
 * @returns URL pública da imagem salva ou null em caso de erro
 */
export async function uploadImageFromUrl(
  imageUrl: string,
  bucketName: string = 'products',
  categorySlug: string = 'outros'
): Promise<string | null> {
  try {
    console.log(`Iniciando upload da imagem ${imageUrl} para o bucket ${bucketName}`);
    
    // Fazer download da imagem
    const imageResponse = await fetch(imageUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!imageResponse.ok) {
      console.error(`Erro ao baixar imagem: ${imageResponse.status} ${imageResponse.statusText}`);
      return null;
    }

    // Verificar se o conteúdo é uma imagem
    const contentType = imageResponse.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      console.error(`Conteúdo não é uma imagem: ${contentType}`);
      return null;
    }

    // Obter o blob da imagem
    const imageBlob = await imageResponse.blob();
    
    // Gerar nome de arquivo único
    const fileExtension = contentType.split('/')[1] || 'jpg';
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;
    const filePath = `${categorySlug}/${fileName}`;

    // Fazer upload para o Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, imageBlob, {
        contentType,
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error(`Erro ao fazer upload para o Supabase: ${error.message}`);
      return null;
    }

    // Obter URL pública da imagem
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    if (publicUrlData && publicUrlData.publicUrl) {
      console.log(`Imagem salva com sucesso: ${publicUrlData.publicUrl}`);
      return publicUrlData.publicUrl;
    } else {
      console.error('Erro ao obter URL pública da imagem');
      return null;
    }
  } catch (error) {
    console.error(`Erro ao processar upload da imagem: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    return null;
  }
}

/**
 * Faz upload de múltiplas imagens a partir de URLs para o Supabase Storage
 * @param imageUrls Array de URLs de imagens
 * @param bucketName Nome do bucket no Supabase Storage
 * @param categorySlug Slug da categoria para organizar as imagens
 * @returns Array de URLs públicas das imagens salvas (apenas as que foram salvas com sucesso)
 */
export async function uploadMultipleImagesFromUrls(
  imageUrls: string[],
  bucketName: string = 'products',
  categorySlug: string = 'outros'
): Promise<string[]> {
  const savedUrls: string[] = [];
  const errors: { url: string, error: string }[] = [];

  // Processar cada URL
  for (const url of imageUrls) {
    try {
      const savedUrl = await uploadImageFromUrl(url, bucketName, categorySlug);
      if (savedUrl) {
        savedUrls.push(savedUrl);
      } else {
        errors.push({ url, error: 'Failed to upload image' });
      }
    } catch (error) {
      errors.push({ url, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  // Logar resultados
  console.log(`Upload concluído: ${savedUrls.length} de ${imageUrls.length} imagens salvas com sucesso`);
  if (errors.length > 0) {
    console.error(`Erros durante o upload: ${errors.length} imagens falharam`);
    console.error(errors);
  }

  return savedUrls;
}

export default supabase;
