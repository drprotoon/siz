/**
 * Ensures that product images are always returned as an array
 * This handles both PostgreSQL native arrays and JSON strings (for backward compatibility)
 *
 * @param images - The images field from the product
 * @returns An array of image URLs
 */
export function ensureImagesArray(images: string[] | string | null | undefined): string[] {
  if (!images) {
    return [];
  }

  if (Array.isArray(images)) {
    return images;
  }

  try {
    // Try to parse as JSON string (for backward compatibility)
    const parsed = JSON.parse(images);
    return Array.isArray(parsed) ? parsed : [images];
  } catch (e) {
    // If parsing fails, it's probably a single string URL
    return [images];
  }
}

/**
 * Prepares image data for storage in PostgreSQL
 *
 * @param images - Array of image URLs or JSON string
 * @returns Array of image URLs ready for PostgreSQL storage
 */
export function prepareImagesForStorage(images: string[] | string | null | undefined): string[] {
  // First ensure we have an array
  const imageArray = ensureImagesArray(images);

  // Filter out any empty strings or invalid URLs
  return imageArray.filter(url => url && url.trim() !== '');
}
