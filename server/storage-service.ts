import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { supabase, bucketName, initSupabaseStorage } from './supabase';

/**
 * Inicializa o serviço de armazenamento
 * Cria o bucket se não existir
 */
export async function initStorageService() {
  return await initSupabaseStorage();
}

/**
 * Faz upload de um arquivo para o Supabase Storage
 *
 * @param filePath - Caminho local do arquivo
 * @param category - Categoria para organização (pasta principal)
 * @param subfolder - Subpasta opcional dentro da categoria
 * @returns URL pública do arquivo ou null em caso de erro
 */
export async function uploadFile(filePath: string, category: string, subfolder?: string): Promise<string | null> {
  if (!supabase) {
    // Modo local: retorna o caminho relativo
    const fileName = path.basename(filePath);
    return subfolder
      ? `/assets/${category}/${subfolder}/${fileName}`
      : `/assets/${category}/${fileName}`;
  }

  try {
    const fileContent = fs.readFileSync(filePath);
    const fileExt = path.extname(filePath);
    const fileName = `${uuidv4()}${fileExt}`;

    // Constrói o caminho de armazenamento com base na categoria e subpasta (se fornecida)
    let storagePath = '';
    if (subfolder) {
      storagePath = `${category}/${subfolder}/${fileName}`;
    } else {
      storagePath = `${category}/${fileName}`;
    }

    console.log(`Uploading file to storage path: ${storagePath}`);

    const { error } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, fileContent, {
        contentType: getContentType(fileExt),
        upsert: true,
      });

    if (error) {
      console.error('Erro ao fazer upload:', error);
      return null;
    }

    // Gera URL pública
    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(storagePath);

    return data.publicUrl;
  } catch (error) {
    console.error('Erro ao fazer upload do arquivo:', error);
    return null;
  }
}

/**
 * Faz upload de múltiplos arquivos
 *
 * @param filePaths - Array de caminhos de arquivos
 * @param category - Categoria para organização
 * @param subfolder - Subpasta opcional dentro da categoria
 * @returns Array de URLs públicas
 */
export async function uploadMultipleFiles(filePaths: string[], category: string, subfolder?: string): Promise<string[]> {
  const urls: string[] = [];

  for (const filePath of filePaths) {
    const url = await uploadFile(filePath, category, subfolder);
    if (url) {
      urls.push(url);
    }
  }

  return urls;
}

/**
 * Determina o tipo de conteúdo com base na extensão do arquivo
 */
function getContentType(fileExt: string): string {
  const contentTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
  };

  return contentTypes[fileExt.toLowerCase()] || 'application/octet-stream';
}

/**
 * Deleta um arquivo do Supabase Storage
 *
 * @param filePath - Caminho do arquivo no bucket
 * @returns true se sucesso, false se falha
 */
export async function deleteFile(filePath: string): Promise<boolean> {
  if (!supabase) {
    console.warn('Supabase não configurado. Operação local.');
    return false;
  }

  try {
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      console.error('Erro ao deletar arquivo:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao deletar arquivo:', error);
    return false;
  }
}

/**
 * Gera uma URL assinada para acesso temporário a um arquivo
 *
 * @param filePath - Caminho do arquivo no bucket
 * @param expiresIn - Tempo de expiração em segundos (padrão: 60 minutos)
 * @returns URL assinada ou null em caso de erro
 */
export async function getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string | null> {
  if (!supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error('Erro ao gerar URL assinada:', error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Erro ao gerar URL assinada:', error);
    return null;
  }
}

/**
 * Lista imagens de um diretório específico no bucket
 *
 * @param folder - Diretório a ser listado (opcional)
 * @param includeSubfolders - Se deve incluir imagens de subpastas (padrão: false)
 * @returns Array de objetos com informações das imagens
 */
export async function listBucketImages(
  folder?: string,
  includeSubfolders: boolean = false
): Promise<Array<{name: string, url: string, path: string, folder: string}>> {
  if (!supabase) {
    console.warn('Supabase não configurado. Operação local não suportada.');
    return [];
  }

  try {
    // Define o caminho a ser listado
    const path = folder || '';
    console.log(`Storage Service: Listing images in bucket '${bucketName}' at path '${path}'`);

    // Lista arquivos no bucket
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list(path, {
        sortBy: { column: 'name', order: 'asc' }
      });

    if (error) {
      console.error('Erro ao listar arquivos do bucket:', error);
      return [];
    }

    // Se não houver dados, retorna array vazio
    if (!data) {
      console.log('Storage Service: No data returned from bucket');
      return [];
    }

    console.log(`Storage Service: Raw bucket data for items in '${path}':`, data);

    // Separa pastas e arquivos
    const folders = data.filter(item =>
      item.id.endsWith('/') ||
      item.metadata?.mimetype === 'folder' ||
      !item.metadata // Supabase às vezes não retorna metadata para pastas
    );

    // Filtra apenas arquivos (não pastas) e que sejam imagens
    const imageFiles = data.filter(item => {
      const isFolder = item.id.endsWith('/') || item.metadata?.mimetype === 'folder' || !item.metadata;
      const isImage = /\.(jpg|jpeg|png|gif|webp|svg|avif)$/i.test(item.name);

      console.log(`File: ${item.name}, isFolder: ${isFolder}, isImage: ${!isFolder && isImage}`);

      return !isFolder && isImage;
    });

    console.log(`Storage Service: Found ${imageFiles.length} image files and ${folders.length} folders in '${path}'`);

    // Gera URLs públicas para cada imagem
    let images = imageFiles.map(file => {
      const filePath = folder ? `${folder}/${file.name}` : file.name;
      const { data } = supabase!.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      // Verifica se a URL está correta
      console.log(`Generated URL for ${filePath}: ${data.publicUrl}`);

      return {
        name: file.name,
        url: data.publicUrl,
        path: filePath,
        folder: folder || 'root'
      };
    });

    // Se solicitado, busca imagens em subpastas
    if (includeSubfolders && folders.length > 0) {
      console.log(`Storage Service: Searching for images in ${folders.length} subfolders`);

      const subfoldersPromises = folders.map(async folderItem => {
        const folderName = folderItem.name.endsWith('/')
          ? folderItem.name.slice(0, -1)
          : folderItem.name;

        const subfolderPath = folder
          ? `${folder}/${folderName}`
          : folderName;

        console.log(`Storage Service: Searching in subfolder: ${subfolderPath}`);

        // Chamada recursiva para listar imagens na subpasta (sem incluir subpastas da subpasta)
        return await listBucketImages(subfolderPath, false);
      });

      const subfolderResults = await Promise.all(subfoldersPromises);

      // Combina os resultados de todas as subpastas
      for (const subfolderImages of subfolderResults) {
        images = [...images, ...subfolderImages];
      }

      console.log(`Storage Service: Found ${images.length} total images including subfolders`);
    }

    // Se não encontrou imagens, tenta listar todos os arquivos sem filtrar por tipo
    if (images.length === 0 && folder) {
      console.log(`Storage Service: No images found in folder '${folder}', listing all files`);

      // Lista todos os arquivos (não pastas)
      const allFiles = data.filter(item => !item.id.endsWith('/') && item.metadata);
      console.log(`Storage Service: Found ${allFiles.length} files (not folders) in '${folder}'`);

      // Gera URLs para todos os arquivos
      const allFileUrls = allFiles.map(file => {
        const filePath = folder ? `${folder}/${file.name}` : file.name;
        const { data } = supabase!.storage
          .from(bucketName)
          .getPublicUrl(filePath);

        console.log(`Generated URL for file ${filePath}: ${data.publicUrl}`);

        return {
          name: file.name,
          url: data.publicUrl,
          path: filePath,
          folder: folder || 'root'
        };
      });

      // Se encontrou arquivos, retorna-os
      if (allFileUrls.length > 0) {
        console.log(`Storage Service: Returning ${allFileUrls.length} files from '${folder}'`);
        return allFileUrls;
      }

      // Tenta listar imagens diretamente usando a URL pública
      try {
        // Tenta obter uma URL pública para um arquivo fictício para verificar a estrutura
        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(`${folder}/test.jpg`);

        console.log(`Storage Service: Public URL structure for this bucket: ${urlData.publicUrl}`);
      } catch (urlError) {
        console.error('Error checking URL structure:', urlError);
      }
    }

    console.log(`Storage Service: Generated ${images.length} image URLs`);
    return images;
  } catch (error) {
    console.error('Erro ao listar imagens do bucket:', error);
    return [];
  }
}

/**
 * Lista pastas (diretórios) no bucket
 *
 * @param path - Caminho base para listar pastas (opcional)
 * @param includeFullPath - Se deve incluir o caminho completo no nome da pasta (padrão: false)
 * @returns Array de objetos com informações das pastas
 */
export async function listBucketFolders(
  path?: string,
  includeFullPath: boolean = false
): Promise<Array<{name: string, path: string, hasSubfolders: boolean}>> {
  if (!supabase) {
    console.warn('Supabase não configurado. Operação local não suportada.');
    return [];
  }

  try {
    const basePath = path || '';
    console.log(`Storage Service: Listing folders in bucket '${bucketName}' at path '${basePath}'`);

    // Lista itens no bucket
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list(basePath);

    if (error) {
      console.error('Erro ao listar pastas do bucket:', error);
      return [];
    }

    // Se não houver dados, retorna array vazio
    if (!data) {
      console.log('Storage Service: No data returned from bucket');
      return [];
    }

    console.log(`Storage Service: Raw bucket data:`, data);

    // Filtra apenas pastas (terminam com '/' ou não têm metadata)
    const folderItems = data.filter(item =>
      (item.id && item.id.endsWith('/')) ||
      item.metadata?.mimetype === 'folder' ||
      !item.metadata // Supabase às vezes não retorna metadata para pastas
    );

    // Mapeia para o formato de retorno
    let folders = await Promise.all(folderItems.map(async folder => {
      // Remove a barra final para obter o nome da pasta
      const name = folder.name && folder.name.endsWith('/')
        ? folder.name.slice(0, -1)
        : folder.name;

      // Constrói o caminho completo
      const fullPath = basePath ? `${basePath}/${name}` : name;

      // Verifica se tem subpastas
      let hasSubfolders = false;
      try {
        // Garantir que supabase não é null (já verificamos isso no início da função)
        if (supabase) {
          const { data: subItems } = await supabase.storage
            .from(bucketName)
            .list(fullPath);

          hasSubfolders = subItems ? subItems.some(item =>
            (item.id && item.id.endsWith('/')) ||
            item.metadata?.mimetype === 'folder' ||
            !item.metadata
          ) : false;
        }
      } catch (e) {
        console.error(`Error checking subfolders for ${fullPath}:`, e);
      }

      return {
        name: includeFullPath ? fullPath : name,
        path: fullPath,
        hasSubfolders
      };
    }));

    // Verifica se existem pastas específicas que sabemos que existem
    // baseado na URL de exemplo fornecida
    if (!basePath) { // Só verifica pastas conhecidas na raiz
      const knownFolders = ['cabelos', 'rosto', 'kit', 'perfumes', 'corpo-banho', 'maquiagem'];
      const existingFolderPaths = folders.map(f => f.path);

      // Adiciona pastas conhecidas que não foram encontradas
      for (const knownFolder of knownFolders) {
        if (!existingFolderPaths.includes(knownFolder)) {
          try {
            // Verifica se a pasta existe tentando listar seu conteúdo
            const { data: folderContents, error: folderError } = await supabase.storage
              .from(bucketName)
              .list(knownFolder);

            if (!folderError && folderContents && folderContents.length > 0) {
              console.log(`Storage Service: Found existing folder '${knownFolder}' that wasn't in the root listing`);

              // Verifica se tem subpastas
              const hasSubfolders = folderContents.some((item: any) =>
                (item.id && item.id.endsWith('/')) ||
                item.metadata?.mimetype === 'folder' ||
                !item.metadata
              );

              folders.push({
                name: includeFullPath ? knownFolder : knownFolder,
                path: knownFolder,
                hasSubfolders
              });
            } else {
              // Se a pasta não existir, tenta criá-la
              console.log(`Storage Service: Known folder '${knownFolder}' doesn't exist, creating it`);
              await createFolderInBucket(knownFolder);
              folders.push({
                name: includeFullPath ? knownFolder : knownFolder,
                path: knownFolder,
                hasSubfolders: false
              });
            }
          } catch (folderError) {
            console.error(`Error checking/creating known folder '${knownFolder}':`, folderError);
          }
        }
      }
    }

    // Se ainda não encontrou pastas e estamos na raiz, tenta criar uma pasta padrão
    if (folders.length === 0 && !basePath) {
      console.log('Storage Service: No folders found, creating default folder');
      try {
        await createFolderInBucket('default');
        folders.push({
          name: 'default',
          path: 'default',
          hasSubfolders: false
        });
      } catch (createError) {
        console.error('Error creating default folder:', createError);
      }
    }

    console.log(`Storage Service: Found ${folders.length} folders:`, folders);
    return folders;
  } catch (error) {
    console.error('Erro ao listar pastas do bucket:', error);
    return [];
  }
}

/**
 * Cria uma pasta no bucket do Supabase
 *
 * @param folderPath - Caminho da pasta a ser criada (pode incluir subpastas)
 * @returns true se a pasta foi criada com sucesso, false caso contrário
 */
export async function createFolderInBucket(folderPath: string): Promise<boolean> {
  if (!supabase) {
    console.warn('Supabase não configurado. Operação local não suportada.');
    return false;
  }

  try {
    // Normaliza o caminho da pasta
    // Remove barras iniciais e finais extras
    const normalizedPath = folderPath
      .replace(/^\/+/, '') // Remove barras iniciais
      .replace(/\/+$/, ''); // Remove barras finais

    // Adiciona uma barra no final para indicar que é uma pasta
    const fullFolderPath = `${normalizedPath}/`;

    console.log(`Creating folder in bucket: ${fullFolderPath}`);

    // Cria um arquivo vazio .keep para representar a pasta
    const { error } = await supabase.storage
      .from(bucketName)
      .upload(`${fullFolderPath}.keep`, new Uint8Array(0), {
        contentType: 'application/octet-stream',
        upsert: true
      });

    if (error) {
      console.error('Erro ao criar pasta no bucket:', error);
      return false;
    }

    console.log(`Pasta '${folderPath}' criada com sucesso no bucket`);
    return true;
  } catch (error) {
    console.error('Erro ao criar pasta no bucket:', error);
    return false;
  }
}

/**
 * Cria uma estrutura de pastas aninhadas no bucket do Supabase
 *
 * @param folderPath - Caminho completo da pasta a ser criada (incluindo subpastas)
 * @returns true se todas as pastas foram criadas com sucesso, false caso contrário
 */
export async function createNestedFoldersInBucket(folderPath: string): Promise<boolean> {
  if (!supabase) {
    console.warn('Supabase não configurado. Operação local não suportada.');
    return false;
  }

  try {
    // Normaliza o caminho da pasta
    const normalizedPath = folderPath
      .replace(/^\/+/, '') // Remove barras iniciais
      .replace(/\/+$/, ''); // Remove barras finais

    // Divide o caminho em partes
    const pathParts = normalizedPath.split('/');

    // Cria cada nível da estrutura de pastas
    let currentPath = '';
    for (let i = 0; i < pathParts.length; i++) {
      if (currentPath) {
        currentPath += '/';
      }
      currentPath += pathParts[i];

      // Cria a pasta atual
      const success = await createFolderInBucket(currentPath);
      if (!success) {
        console.error(`Falha ao criar pasta '${currentPath}' na estrutura aninhada`);
        return false;
      }
    }

    console.log(`Estrutura de pastas '${folderPath}' criada com sucesso no bucket`);
    return true;
  } catch (error) {
    console.error('Erro ao criar estrutura de pastas no bucket:', error);
    return false;
  }
}
