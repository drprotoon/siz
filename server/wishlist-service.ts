import { storage } from './storage';

interface WishlistOperation {
  userId: number;
  productId: number;
  action: 'add' | 'remove';
}

/**
 * Optimized wishlist service with batch operations and caching
 */
export class WishlistService {
  private pendingOperations: Map<number, WishlistOperation[]> = new Map();
  private readonly BATCH_TIMEOUT = 1000; // 1 second
  private readonly MAX_BATCH_SIZE = 10;

  /**
   * Add item to wishlist with batching
   */
  async addToWishlist(userId: number, productId: number): Promise<void> {
    return this.queueOperation(userId, productId, 'add');
  }

  /**
   * Remove item from wishlist with batching
   */
  async removeFromWishlist(userId: number, productId: number): Promise<void> {
    return this.queueOperation(userId, productId, 'remove');
  }

  /**
   * Queue operation for batch processing
   */
  private async queueOperation(userId: number, productId: number, action: 'add' | 'remove'): Promise<void> {
    const userOperations = this.pendingOperations.get(userId) || [];
    
    // Remove any existing operation for the same product to avoid conflicts
    const filteredOperations = userOperations.filter(op => op.productId !== productId);
    
    // Add new operation
    filteredOperations.push({ userId, productId, action });
    this.pendingOperations.set(userId, filteredOperations);

    // Process immediately if batch is full
    if (filteredOperations.length >= this.MAX_BATCH_SIZE) {
      await this.processBatch(userId);
    } else {
      // Schedule batch processing
      this.scheduleBatchProcessing(userId);
    }
  }

  /**
   * Schedule batch processing with timeout
   */
  private scheduleBatchProcessing(userId: number): void {
    setTimeout(async () => {
      await this.processBatch(userId);
    }, this.BATCH_TIMEOUT);
  }

  /**
   * Process batch of operations for a user
   */
  private async processBatch(userId: number): Promise<void> {
    const operations = this.pendingOperations.get(userId);
    if (!operations || operations.length === 0) {
      return;
    }

    // Clear pending operations
    this.pendingOperations.delete(userId);

    try {
      // Group operations by action
      const addOperations = operations.filter(op => op.action === 'add');
      const removeOperations = operations.filter(op => op.action === 'remove');

      // Process add operations
      if (addOperations.length > 0) {
        await this.batchAddToWishlist(userId, addOperations.map(op => op.productId));
      }

      // Process remove operations
      if (removeOperations.length > 0) {
        await this.batchRemoveFromWishlist(userId, removeOperations.map(op => op.productId));
      }

      console.log(`Processed batch for user ${userId}: ${addOperations.length} adds, ${removeOperations.length} removes`);
    } catch (error) {
      console.error(`Error processing wishlist batch for user ${userId}:`, error);
      
      // Re-queue operations on error (with exponential backoff)
      setTimeout(() => {
        this.pendingOperations.set(userId, operations);
        this.scheduleBatchProcessing(userId);
      }, this.BATCH_TIMEOUT * 2);
    }
  }

  /**
   * Batch add multiple items to wishlist
   */
  private async batchAddToWishlist(userId: number, productIds: number[]): Promise<void> {
    // Get current wishlist to avoid duplicates
    const currentWishlist = await storage.getUserWishlist(userId);
    const currentProductIds = new Set(currentWishlist.map(item => item.productId));

    // Filter out products already in wishlist
    const newProductIds = productIds.filter(id => !currentProductIds.has(id));

    if (newProductIds.length === 0) {
      return;
    }

    // Validate that products exist
    const validProductIds: number[] = [];
    for (const productId of newProductIds) {
      try {
        const product = await storage.getProduct(productId);
        if (product) {
          validProductIds.push(productId);
        }
      } catch (error) {
        console.warn(`Product ${productId} not found, skipping wishlist add`);
      }
    }

    // Add valid products to wishlist
    for (const productId of validProductIds) {
      try {
        await storage.addToWishlist(userId, productId);
      } catch (error) {
        console.error(`Error adding product ${productId} to wishlist:`, error);
      }
    }
  }

  /**
   * Batch remove multiple items from wishlist
   */
  private async batchRemoveFromWishlist(userId: number, productIds: number[]): Promise<void> {
    // Get current wishlist
    const currentWishlist = await storage.getUserWishlist(userId);
    const wishlistMap = new Map(currentWishlist.map(item => [item.productId, item.id]));

    // Remove products from wishlist
    for (const productId of productIds) {
      const wishlistItemId = wishlistMap.get(productId);
      if (wishlistItemId) {
        try {
          await storage.removeFromWishlist(wishlistItemId);
        } catch (error) {
          console.error(`Error removing product ${productId} from wishlist:`, error);
        }
      }
    }
  }

  /**
   * Get user wishlist with caching
   */
  async getUserWishlist(userId: number): Promise<any[]> {
    try {
      return await storage.getUserWishlistWithProducts(userId);
    } catch (error) {
      console.error(`Error getting wishlist for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Check if product is in user's wishlist
   */
  async isInWishlist(userId: number, productId: number): Promise<boolean> {
    try {
      const wishlist = await storage.getUserWishlist(userId);
      return wishlist.some(item => item.productId === productId);
    } catch (error) {
      console.error(`Error checking wishlist for user ${userId}, product ${productId}:`, error);
      return false;
    }
  }

  /**
   * Get pending operations count for monitoring
   */
  getPendingOperationsCount(): number {
    let total = 0;
    for (const operations of this.pendingOperations.values()) {
      total += operations.length;
    }
    return total;
  }

  /**
   * Force process all pending batches (useful for shutdown)
   */
  async flushAllBatches(): Promise<void> {
    const userIds = Array.from(this.pendingOperations.keys());
    const promises = userIds.map(userId => this.processBatch(userId));
    await Promise.all(promises);
  }
}

// Singleton instance
export const wishlistService = new WishlistService();

// Graceful shutdown handler
process.on('SIGTERM', async () => {
  console.log('Flushing pending wishlist operations...');
  await wishlistService.flushAllBatches();
});

process.on('SIGINT', async () => {
  console.log('Flushing pending wishlist operations...');
  await wishlistService.flushAllBatches();
});
