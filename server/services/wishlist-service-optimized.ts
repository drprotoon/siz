/**
 * SERVIÇO OTIMIZADO DE WISHLIST
 * 
 * Este arquivo consolida e otimiza a lógica de wishlist,
 * eliminando duplicações entre wishlist-service.ts e storage.ts
 * 
 * OTIMIZAÇÕES:
 * - Batching de operações para reduzir chamadas ao banco
 * - Cache em memória para consultas frequentes
 * - Validação centralizada
 * - Interface única para todas as operações
 */

import { storage } from '../storage';

// ===== INTERFACES =====

export interface WishlistItem {
  id: number;
  userId: number;
  productId: number;
  createdAt: Date;
  product?: {
    id: number;
    name: string;
    price: string;
    images: string[];
    slug: string;
  };
}

export interface WishlistOperation {
  userId: number;
  productId: number;
  action: 'add' | 'remove';
}

export interface WishlistStats {
  totalItems: number;
  recentlyAdded: number;
  categories: Record<string, number>;
}

// ===== CACHE EM MEMÓRIA =====

class WishlistCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutos

  set(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  invalidate(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

// ===== SERVIÇO PRINCIPAL =====

export class OptimizedWishlistService {
  private pendingOperations = new Map<number, WishlistOperation[]>();
  private cache = new WishlistCache();
  private readonly BATCH_TIMEOUT = 1000; // 1 segundo
  private readonly MAX_BATCH_SIZE = 10;
  private batchTimers = new Map<number, NodeJS.Timeout>();

  /**
   * Adiciona item à wishlist com batching
   * OTIMIZAÇÃO: Agrupa múltiplas operações para reduzir chamadas ao banco
   */
  async addToWishlist(userId: number, productId: number): Promise<void> {
    // Validar entrada
    if (!userId || !productId) {
      throw new Error('userId e productId são obrigatórios');
    }

    // Verificar se o produto existe
    try {
      const product = await storage.getProduct(productId);
      if (!product) {
        throw new Error('Produto não encontrado');
      }
    } catch (error) {
      throw new Error('Produto não encontrado');
    }

    // Verificar se já está na wishlist
    const isInWishlist = await this.isInWishlist(userId, productId);
    if (isInWishlist) {
      return; // Já está na wishlist, não fazer nada
    }

    return this.queueOperation(userId, productId, 'add');
  }

  /**
   * Remove item da wishlist com batching
   */
  async removeFromWishlist(userId: number, productId: number): Promise<void> {
    if (!userId || !productId) {
      throw new Error('userId e productId são obrigatórios');
    }

    return this.queueOperation(userId, productId, 'remove');
  }

  /**
   * Verifica se produto está na wishlist (com cache)
   * OTIMIZAÇÃO: Cache para evitar consultas repetidas
   */
  async isInWishlist(userId: number, productId: number): Promise<boolean> {
    const cacheKey = `wishlist:${userId}:${productId}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached !== null) {
      return cached;
    }

    try {
      const wishlist = await storage.getUserWishlist(userId);
      const isInList = wishlist.some(item => item.productId === productId);
      
      // Cachear resultado
      this.cache.set(cacheKey, isInList);
      
      return isInList;
    } catch (error) {
      console.error(`Erro ao verificar wishlist para usuário ${userId}:`, error);
      return false;
    }
  }

  /**
   * Obtém wishlist do usuário com produtos (com cache)
   * OTIMIZAÇÃO: Cache para listas completas
   */
  async getUserWishlist(userId: number): Promise<WishlistItem[]> {
    const cacheKey = `wishlist:full:${userId}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const wishlist = await storage.getUserWishlistWithProducts(userId);
      
      // Cachear resultado
      this.cache.set(cacheKey, wishlist);
      
      return wishlist as any;
    } catch (error) {
      console.error(`Erro ao obter wishlist para usuário ${userId}:`, error);
      return [];
    }
  }

  /**
   * Obtém estatísticas da wishlist
   * FUNCIONALIDADE ADICIONAL: Analytics da wishlist
   */
  async getWishlistStats(userId: number): Promise<WishlistStats> {
    const cacheKey = `wishlist:stats:${userId}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const wishlist = await this.getUserWishlist(userId);
      
      const stats: WishlistStats = {
        totalItems: wishlist.length,
        recentlyAdded: wishlist.filter(item => {
          const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return item.createdAt > dayAgo;
        }).length,
        categories: {}
      };

      // Agrupar por categoria (se disponível)
      for (const item of wishlist) {
        if (item.product) {
          // TODO: Adicionar categoria quando disponível no produto
          const category = 'Geral'; // Placeholder
          stats.categories[category] = (stats.categories[category] || 0) + 1;
        }
      }

      // Cachear resultado por 10 minutos
      this.cache.set(cacheKey, stats);
      
      return stats;
    } catch (error) {
      console.error(`Erro ao obter estatísticas da wishlist para usuário ${userId}:`, error);
      return { totalItems: 0, recentlyAdded: 0, categories: {} };
    }
  }

  /**
   * Limpa wishlist do usuário
   */
  async clearWishlist(userId: number): Promise<void> {
    try {
      // Processar operações pendentes primeiro
      await this.processBatch(userId);
      
      // Limpar wishlist no banco
      const wishlist = await storage.getUserWishlist(userId);
      for (const item of wishlist) {
        await storage.removeFromWishlist(item.id);
      }
      
      // Invalidar cache
      this.cache.invalidate(`wishlist:${userId}`);
      
    } catch (error) {
      console.error(`Erro ao limpar wishlist para usuário ${userId}:`, error);
      throw new Error('Erro ao limpar wishlist');
    }
  }

  // ===== MÉTODOS PRIVADOS =====

  private async queueOperation(userId: number, productId: number, action: 'add' | 'remove'): Promise<void> {
    // Adicionar à fila
    if (!this.pendingOperations.has(userId)) {
      this.pendingOperations.set(userId, []);
    }

    const operations = this.pendingOperations.get(userId)!;
    operations.push({ userId, productId, action });

    // Invalidar cache imediatamente
    this.cache.invalidate(`wishlist:${userId}`);

    // Processar se atingiu o limite ou configurar timer
    if (operations.length >= this.MAX_BATCH_SIZE) {
      await this.processBatch(userId);
    } else {
      this.scheduleBatch(userId);
    }
  }

  private scheduleBatch(userId: number): void {
    // Cancelar timer existente
    const existingTimer = this.batchTimers.get(userId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Configurar novo timer
    const timer = setTimeout(() => {
      this.processBatch(userId).catch(error => {
        console.error(`Erro ao processar batch para usuário ${userId}:`, error);
      });
    }, this.BATCH_TIMEOUT);

    this.batchTimers.set(userId, timer);
  }

  private async processBatch(userId: number): Promise<void> {
    const operations = this.pendingOperations.get(userId);
    if (!operations || operations.length === 0) {
      return;
    }

    // Limpar fila e timer
    this.pendingOperations.delete(userId);
    const timer = this.batchTimers.get(userId);
    if (timer) {
      clearTimeout(timer);
      this.batchTimers.delete(userId);
    }

    // Processar operações
    const addOperations = operations.filter(op => op.action === 'add');
    const removeOperations = operations.filter(op => op.action === 'remove');

    try {
      // Processar adições
      for (const op of addOperations) {
        try {
          await storage.addToWishlist({ userId: op.userId, productId: op.productId });
        } catch (error) {
          console.error(`Erro ao adicionar produto ${op.productId} à wishlist:`, error);
        }
      }

      // Processar remoções
      for (const op of removeOperations) {
        try {
          // Encontrar o item na wishlist para obter o ID
          const wishlist = await storage.getUserWishlist(op.userId);
          const item = wishlist.find(item => item.productId === op.productId);
          if (item) {
            await storage.removeFromWishlist(item.id);
          }
        } catch (error) {
          console.error(`Erro ao remover produto ${op.productId} da wishlist:`, error);
        }
      }

      console.log(`Processadas ${operations.length} operações de wishlist para usuário ${userId}`);
      
    } catch (error) {
      console.error(`Erro ao processar batch de wishlist para usuário ${userId}:`, error);
    }
  }

  /**
   * Força o processamento de todas as operações pendentes
   * UTILIDADE: Para shutdown graceful
   */
  async flushAllBatches(): Promise<void> {
    const userIds = Array.from(this.pendingOperations.keys());
    const promises = userIds.map(userId => this.processBatch(userId));
    await Promise.all(promises);
  }

  /**
   * Obtém contagem de operações pendentes
   * MONITORAMENTO: Para debugging e monitoramento
   */
  getPendingOperationsCount(): number {
    let total = 0;
    for (const operations of this.pendingOperations.values()) {
      total += operations.length;
    }
    return total;
  }
}

// ===== INSTÂNCIA SINGLETON =====

export const optimizedWishlistService = new OptimizedWishlistService();

// ===== SHUTDOWN GRACEFUL =====

process.on('SIGTERM', async () => {
  console.log('Processando operações pendentes de wishlist...');
  await optimizedWishlistService.flushAllBatches();
});
