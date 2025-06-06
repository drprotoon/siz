-- Migration to add settings table for storing application configurations
-- This includes Frenet API settings and other system configurations

CREATE TABLE IF NOT EXISTS "settings" (
  "id" SERIAL PRIMARY KEY,
  "key" TEXT NOT NULL UNIQUE,
  "value" TEXT,
  "description" TEXT,
  "category" TEXT DEFAULT 'general',
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

-- Create index on key for faster lookups
CREATE INDEX IF NOT EXISTS "idx_settings_key" ON "settings" ("key");
CREATE INDEX IF NOT EXISTS "idx_settings_category" ON "settings" ("category");

-- Insert default Frenet settings
INSERT INTO "settings" ("key", "value", "description", "category") VALUES
  ('frenet_api_token', '13B9E436RD32DR455ERAC99R93357F8D6640', 'Token da API da Frenet', 'frenet'),
  ('frenet_seller_cep', '74591990', 'CEP de origem para cálculo de frete', 'frenet'),
  ('frenet_api_url', 'https://api.frenet.com.br', 'URL da API da Frenet', 'frenet'),
  ('frenet_enabled', 'true', 'Habilitar integração com Frenet', 'frenet'),
  ('free_shipping_threshold', '150', 'Valor mínimo para frete grátis (em reais)', 'shipping'),
  ('store_name', 'SIZ Cosméticos', 'Nome da loja', 'general'),
  ('store_email', 'contato@sizcos.com', 'Email da loja', 'general'),
  ('store_phone', '', 'Telefone da loja', 'general'),
  ('abacatepay_api_key', '', 'Chave da API do AbacatePay', 'pix'),
  ('abacatepay_api_url', 'https://api.abacatepay.com', 'URL da API do AbacatePay', 'pix'),
  ('abacatepay_webhook_secret', '', 'Chave secreta para validar webhooks', 'pix'),
  ('webhook_base_url', '', 'URL base para webhooks', 'pix'),
  ('pix_enabled', 'true', 'Habilitar pagamentos PIX', 'pix')
ON CONFLICT ("key") DO NOTHING;
