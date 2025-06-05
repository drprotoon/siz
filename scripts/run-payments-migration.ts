import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function runPaymentsMigration() {
  try {
    console.log('Creating payments table...');
    
    // Create payments table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "payments" (
        "id" SERIAL PRIMARY KEY,
        "order_id" INTEGER NOT NULL,
        "user_id" INTEGER NOT NULL,
        "payment_method" TEXT NOT NULL,
        "payment_provider" TEXT NOT NULL,
        "external_payment_id" TEXT UNIQUE,
        "amount" NUMERIC(10, 2) NOT NULL,
        "currency" TEXT DEFAULT 'BRL' NOT NULL,
        "status" TEXT DEFAULT 'pending' NOT NULL,
        "pix_qr_code" TEXT,
        "pix_qr_code_text" TEXT,
        "expires_at" TIMESTAMP,
        "paid_at" TIMESTAMP,
        "failed_at" TIMESTAMP,
        "failure_reason" TEXT,
        "webhook_data" JSONB,
        "customer_info" JSONB,
        "metadata" JSONB,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create indexes
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_payments_order_id" ON "payments"("order_id")`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_payments_user_id" ON "payments"("user_id")`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_payments_status" ON "payments"("status")`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_payments_payment_method" ON "payments"("payment_method")`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_payments_external_payment_id" ON "payments"("external_payment_id")`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_payments_created_at" ON "payments"("created_at")`);

    // Create trigger function
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION update_payments_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);

    // Create trigger
    await db.execute(sql`
      DROP TRIGGER IF EXISTS trigger_update_payments_updated_at ON "payments"
    `);
    
    await db.execute(sql`
      CREATE TRIGGER trigger_update_payments_updated_at
        BEFORE UPDATE ON "payments"
        FOR EACH ROW
        EXECUTE FUNCTION update_payments_updated_at()
    `);

    console.log('✅ Payments table created successfully!');
    
    // Test the table
    const result = await db.execute(sql`SELECT COUNT(*) FROM "payments"`);
    console.log('✅ Table is accessible, current count:', result.rows[0].count);
    
  } catch (error) {
    console.error('❌ Error creating payments table:', error);
    throw error;
  }
}

// Run the migration
runPaymentsMigration()
  .then(() => {
    console.log('✅ Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
