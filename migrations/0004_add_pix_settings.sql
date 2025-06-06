-- Migration to add PIX/AbacatePay settings to the settings table
-- This adds the necessary configuration options for PIX payments

-- First, create the settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS "settings" (
  "id" SERIAL PRIMARY KEY,
  "key" TEXT NOT NULL UNIQUE,
  "value" TEXT,
  "description" TEXT,
  "category" TEXT DEFAULT 'general',
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS "idx_settings_key" ON "settings" ("key");
CREATE INDEX IF NOT EXISTS "idx_settings_category" ON "settings" ("category");

-- Insert PIX/AbacatePay settings only if they don't exist
INSERT INTO "settings" ("key", "value", "description", "category")
SELECT 'store_phone', '', 'Telefone da loja', 'general'
WHERE NOT EXISTS (SELECT 1 FROM "settings" WHERE "key" = 'store_phone');

INSERT INTO "settings" ("key", "value", "description", "category")
SELECT 'abacatepay_api_key', '', 'Chave da API do AbacatePay', 'pix'
WHERE NOT EXISTS (SELECT 1 FROM "settings" WHERE "key" = 'abacatepay_api_key');

INSERT INTO "settings" ("key", "value", "description", "category")
SELECT 'abacatepay_api_url', 'https://api.abacatepay.com', 'URL da API do AbacatePay', 'pix'
WHERE NOT EXISTS (SELECT 1 FROM "settings" WHERE "key" = 'abacatepay_api_url');

INSERT INTO "settings" ("key", "value", "description", "category")
SELECT 'abacatepay_webhook_secret', '', 'Chave secreta para validar webhooks', 'pix'
WHERE NOT EXISTS (SELECT 1 FROM "settings" WHERE "key" = 'abacatepay_webhook_secret');

INSERT INTO "settings" ("key", "value", "description", "category")
SELECT 'webhook_base_url', '', 'URL base para webhooks', 'pix'
WHERE NOT EXISTS (SELECT 1 FROM "settings" WHERE "key" = 'webhook_base_url');

INSERT INTO "settings" ("key", "value", "description", "category")
SELECT 'pix_enabled', 'true', 'Habilitar pagamentos PIX', 'pix'
WHERE NOT EXISTS (SELECT 1 FROM "settings" WHERE "key" = 'pix_enabled');
