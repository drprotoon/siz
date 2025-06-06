import { runEssentialMigrations } from '../server/db';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: join(__dirname, '..', '.env') });

async function main() {
  console.log('🚀 Starting essential migrations...');
  
  try {
    await runEssentialMigrations();
    console.log('✅ All essential migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to run essential migrations:', error);
    process.exit(1);
  }
}

// Execute if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main as runEssentialMigrationsScript };
