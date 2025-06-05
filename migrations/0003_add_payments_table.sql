-- Migration to add payments table for storing payment information
-- This includes AbacatePay payments and other payment methods

CREATE TABLE IF NOT EXISTS "payments" (
  "id" SERIAL PRIMARY KEY,
  "order_id" INTEGER NOT NULL,
  "user_id" INTEGER NOT NULL,
  "payment_method" TEXT NOT NULL, -- 'pix', 'credit_card', 'boleto', etc.
  "payment_provider" TEXT NOT NULL, -- 'abacatepay', 'stripe', etc.
  "external_payment_id" TEXT, -- ID do pagamento no provedor externo
  "amount" NUMERIC(10, 2) NOT NULL,
  "currency" TEXT DEFAULT 'BRL' NOT NULL,
  "status" TEXT DEFAULT 'pending' NOT NULL, -- 'pending', 'paid', 'failed', 'expired', 'cancelled'
  "pix_qr_code" TEXT, -- QR Code PIX (se aplicável)
  "pix_qr_code_text" TEXT, -- Texto do QR Code PIX (se aplicável)
  "expires_at" TIMESTAMP, -- Data de expiração do pagamento
  "paid_at" TIMESTAMP, -- Data de confirmação do pagamento
  "failed_at" TIMESTAMP, -- Data de falha do pagamento
  "failure_reason" TEXT, -- Motivo da falha
  "webhook_data" JSONB, -- Dados do webhook recebido
  "customer_info" JSONB, -- Informações do cliente
  "metadata" JSONB, -- Dados adicionais
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW(),
  
  -- Foreign keys
  CONSTRAINT "fk_payments_order_id" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE,
  CONSTRAINT "fk_payments_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
  
  -- Indexes
  CONSTRAINT "payments_external_payment_id_unique" UNIQUE("external_payment_id")
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_payments_order_id" ON "payments"("order_id");
CREATE INDEX IF NOT EXISTS "idx_payments_user_id" ON "payments"("user_id");
CREATE INDEX IF NOT EXISTS "idx_payments_status" ON "payments"("status");
CREATE INDEX IF NOT EXISTS "idx_payments_payment_method" ON "payments"("payment_method");
CREATE INDEX IF NOT EXISTS "idx_payments_external_payment_id" ON "payments"("external_payment_id");
CREATE INDEX IF NOT EXISTS "idx_payments_created_at" ON "payments"("created_at");

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_payments_updated_at
  BEFORE UPDATE ON "payments"
  FOR EACH ROW
  EXECUTE FUNCTION update_payments_updated_at();

-- Add comments for documentation
COMMENT ON TABLE "payments" IS 'Stores payment information for orders including PIX, credit card, and other payment methods';
COMMENT ON COLUMN "payments"."payment_method" IS 'Type of payment method: pix, credit_card, boleto, etc.';
COMMENT ON COLUMN "payments"."payment_provider" IS 'Payment provider: abacatepay, stripe, etc.';
COMMENT ON COLUMN "payments"."external_payment_id" IS 'Payment ID from external provider';
COMMENT ON COLUMN "payments"."status" IS 'Payment status: pending, paid, failed, expired, cancelled';
COMMENT ON COLUMN "payments"."pix_qr_code" IS 'PIX QR Code image data (base64 or URL)';
COMMENT ON COLUMN "payments"."pix_qr_code_text" IS 'PIX QR Code text for copy/paste';
COMMENT ON COLUMN "payments"."webhook_data" IS 'JSON data received from payment provider webhooks';
COMMENT ON COLUMN "payments"."customer_info" IS 'Customer information used for payment';
COMMENT ON COLUMN "payments"."metadata" IS 'Additional payment metadata';
