/**
 * Module loader utility to handle dynamic imports in ESM
 * This helps with resolving module paths in both development and production
 */

import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Resolves a module path relative to the current directory
 * Adds .js extension in production to support ESM
 * 
 * @param modulePath - The module path to resolve
 * @returns The resolved module path
 */
export function resolveModulePath(modulePath: string): string {
  // In production, add .js extension to local imports
  if (process.env.NODE_ENV === 'production') {
    if (modulePath.startsWith('./') || modulePath.startsWith('../')) {
      if (!modulePath.endsWith('.js') && !modulePath.endsWith('.json')) {
        return `${modulePath}.js`;
      }
    }
  }
  return modulePath;
}

/**
 * Dynamically imports a module with proper path resolution
 * 
 * @param modulePath - The module path to import
 * @returns The imported module
 */
export async function importModule(modulePath: string): Promise<any> {
  const resolvedPath = resolveModulePath(modulePath);
  return import(resolvedPath);
}

/**
 * Gets the absolute path for a file relative to the server directory
 * 
 * @param relativePath - The relative path from the server directory
 * @returns The absolute path
 */
export function getServerPath(relativePath: string): string {
  return path.resolve(__dirname, relativePath);
}

/**
 * Gets the absolute path for a file relative to the project root
 * 
 * @param relativePath - The relative path from the project root
 * @returns The absolute path
 */
export function getProjectPath(relativePath: string): string {
  return path.resolve(__dirname, '..', relativePath);
}

export default {
  resolveModulePath,
  importModule,
  getServerPath,
  getProjectPath
};
