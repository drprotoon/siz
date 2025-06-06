import { readFileSync } from 'fs';
import { join } from 'path';
import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function runPixMigration() {
  try {
    console.log('🔄 Running PIX settings migration...');
    
    // Read the migration file
    const migrationPath = join(process.cwd(), 'migrations', '0004_add_pix_settings.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    // Execute the migration
    await db.execute(sql.raw(migrationSQL));
    
    console.log('✅ PIX settings migration completed successfully!');
  } catch (error) {
    console.error('❌ Error running PIX migration:', error);
    process.exit(1);
  }
}

runPixMigration();
