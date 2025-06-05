#!/usr/bin/env node

/**
 * Script para corrigir schemas Zod problemáticos
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.dirname(__dirname);

console.log('🔧 Corrigindo schemas Zod...');

const schemaFile = path.join(PROJECT_ROOT, 'shared/schema.ts');
let content = fs.readFileSync(schemaFile, 'utf8');

// Substituir schemas problemáticos por versões simplificadas
const replacements = [
  {
    from: /export const insertOrderSchema = createInsertSchema\(orders, \{[\s\S]*?\}\);/,
    to: `export const insertOrderSchema = z.object({
  userId: z.number(),
  status: z.string().optional(),
  total: z.string(),
  shippingAddress: z.string(),
  shippingCity: z.string(),
  shippingState: z.string(),
  shippingPostalCode: z.string(),
  shippingCountry: z.string(),
  shippingMethod: z.string().optional(),
  shippingCost: z.string().optional(),
  paymentMethod: z.string().optional(),
  paymentId: z.string().optional()
});`
  },
  {
    from: /export const insertOrderItemSchema = createInsertSchema\(orderItems, \{[\s\S]*?\}\);/,
    to: `export const insertOrderItemSchema = z.object({
  orderId: z.number(),
  productId: z.number(),
  quantity: z.number(),
  price: z.string(),
  name: z.string()
});`
  },
  {
    from: /export const insertReviewSchema = createInsertSchema\(reviews, \{[\s\S]*?\}\);/,
    to: `export const insertReviewSchema = z.object({
  productId: z.number(),
  userId: z.number(),
  rating: z.number(),
  title: z.string().optional(),
  comment: z.string().optional()
});`
  },
  {
    from: /export const insertCartItemSchema = createInsertSchema\(cartItems, \{[\s\S]*?\}\);/,
    to: `export const insertCartItemSchema = z.object({
  userId: z.number().optional(),
  sessionId: z.string().optional(),
  productId: z.number(),
  quantity: z.number()
}).refine((data) => data.userId !== undefined || data.sessionId !== undefined, {
  message: "Either userId or sessionId must be provided"
});`
  },
  {
    from: /export const insertWishlistItemSchema = createInsertSchema\(wishlistItems, \{[\s\S]*?\}\);/,
    to: `export const insertWishlistItemSchema = z.object({
  userId: z.number(),
  productId: z.number()
});`
  },
  {
    from: /export const insertAddressSchema = createInsertSchema\(addresses, \{[\s\S]*?\}\);/,
    to: `export const insertAddressSchema = z.object({
  userId: z.number(),
  postalCode: z.string(),
  street: z.string(),
  number: z.string().optional(),
  complement: z.string().optional(),
  district: z.string(),
  city: z.string(),
  state: z.string(),
  country: z.string().optional()
});`
  }
];

// Aplicar todas as substituições
replacements.forEach(({ from, to }) => {
  content = content.replace(from, to);
});

// Escrever arquivo corrigido
fs.writeFileSync(schemaFile, content);
console.log('✅ Schemas corrigidos!');

// Corrigir storage.ts
const storageFile = path.join(PROJECT_ROOT, 'server/storage.ts');
let storageContent = fs.readFileSync(storageFile, 'utf8');

storageContent = storageContent.replace(
  /const \[review\] = await db\.insert\(reviews\)\.values\(insertReview\)\.returning\(\);/,
  'const [review] = (await db.insert(reviews).values(insertReview).returning()) as any[];'
);

fs.writeFileSync(storageFile, storageContent);
console.log('✅ Storage corrigido!');

console.log('🎉 Correções concluídas!');
