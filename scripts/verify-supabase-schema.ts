import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

interface TableInfo {
  exists: boolean
  columns: string[]
  sampleData?: any
  error?: string
}

async function checkTable(tableName: string): Promise<TableInfo> {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1)

    if (error) {
      return {
        exists: false,
        columns: [],
        error: error.message
      }
    }

    return {
      exists: true,
      columns: data && data.length > 0 ? Object.keys(data[0]) : [],
      sampleData: data?.[0] || null
    }
  } catch (error) {
    return {
      exists: false,
      columns: [],
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

async function verifySchema() {
  console.log('🔍 Verificando schema do Supabase em produção...\n')

  const tables = [
    'users',
    'categories', 
    'products',
    'orders',
    'order_items',
    'payments',
    'addresses',
    'cart_items',
    'wishlist_items',
    'reviews'
  ]

  const results: Record<string, TableInfo> = {}

  for (const tableName of tables) {
    console.log(`📋 Verificando tabela: ${tableName}`)
    const info = await checkTable(tableName)
    results[tableName] = info

    if (info.exists) {
      console.log(`✅ ${tableName}: ${info.columns.length} colunas`)
      console.log(`   Colunas: ${info.columns.join(', ')}`)
    } else {
      console.log(`❌ ${tableName}: ${info.error || 'Tabela não encontrada'}`)
    }
    console.log('')
  }

  // Verificar tabelas críticas
  console.log('🎯 Verificação de tabelas críticas:\n')

  const criticalTables = ['users', 'products', 'orders', 'payments']
  let allCriticalTablesExist = true

  for (const tableName of criticalTables) {
    const info = results[tableName]
    if (!info.exists) {
      console.log(`❌ CRÍTICO: Tabela ${tableName} não existe`)
      allCriticalTablesExist = false
    } else {
      console.log(`✅ ${tableName} existe com ${info.columns.length} colunas`)
    }
  }

  if (allCriticalTablesExist) {
    console.log('\n🎉 Todas as tabelas críticas existem!')
  } else {
    console.log('\n⚠️  Algumas tabelas críticas estão faltando')
  }

  // Verificar colunas específicas importantes
  console.log('\n🔧 Verificando colunas específicas importantes:\n')

  // Verificar tabela users
  if (results.users.exists) {
    const userColumns = results.users.columns
    const requiredUserColumns = ['id', 'username', 'email', 'password', 'role', 'created_at']
    const missingUserColumns = requiredUserColumns.filter(col => !userColumns.includes(col))
    
    if (missingUserColumns.length === 0) {
      console.log('✅ Tabela users tem todas as colunas necessárias')
    } else {
      console.log(`❌ Tabela users está faltando: ${missingUserColumns.join(', ')}`)
    }
  }

  // Verificar tabela payments
  if (results.payments.exists) {
    const paymentColumns = results.payments.columns
    const requiredPaymentColumns = [
      'id', 'order_id', 'payment_method', 'payment_provider', 
      'external_payment_id', 'amount', 'status', 'created_at'
    ]
    const missingPaymentColumns = requiredPaymentColumns.filter(col => !paymentColumns.includes(col))
    
    if (missingPaymentColumns.length === 0) {
      console.log('✅ Tabela payments tem todas as colunas necessárias')
    } else {
      console.log(`❌ Tabela payments está faltando: ${missingPaymentColumns.join(', ')}`)
    }
  }

  // Verificar tabela orders
  if (results.orders.exists) {
    const orderColumns = results.orders.columns
    const requiredOrderColumns = [
      'id', 'user_id', 'status', 'total', 'created_at'
    ]
    const missingOrderColumns = requiredOrderColumns.filter(col => !orderColumns.includes(col))
    
    if (missingOrderColumns.length === 0) {
      console.log('✅ Tabela orders tem todas as colunas necessárias')
    } else {
      console.log(`❌ Tabela orders está faltando: ${missingOrderColumns.join(', ')}`)
    }
  }

  // Verificar tabela products
  if (results.products.exists) {
    const productColumns = results.products.columns
    const requiredProductColumns = [
      'id', 'name', 'slug', 'price', 'sku', 'category_id', 'created_at'
    ]
    const missingProductColumns = requiredProductColumns.filter(col => !productColumns.includes(col))
    
    if (missingProductColumns.length === 0) {
      console.log('✅ Tabela products tem todas as colunas necessárias')
    } else {
      console.log(`❌ Tabela products está faltando: ${missingProductColumns.join(', ')}`)
    }
  }

  console.log('\n📊 Resumo da verificação:')
  console.log(`✅ Tabelas existentes: ${Object.values(results).filter(r => r.exists).length}/${tables.length}`)
  console.log(`❌ Tabelas faltando: ${Object.values(results).filter(r => !r.exists).length}/${tables.length}`)

  // Salvar resultados em arquivo JSON para referência
  const fs = await import('fs/promises')
  await fs.writeFile(
    'supabase-schema-verification.json', 
    JSON.stringify(results, null, 2)
  )
  console.log('\n💾 Resultados salvos em: supabase-schema-verification.json')

  return results
}

// Função para criar tabelas faltando (se necessário)
async function createMissingTables(results: Record<string, TableInfo>) {
  console.log('\n🔨 Verificando se é necessário criar tabelas...\n')

  // Criar tabela payments se não existir
  if (!results.payments?.exists) {
    console.log('📝 Criando tabela payments...')
    
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS "payments" (
          "id" SERIAL PRIMARY KEY,
          "order_id" INTEGER NOT NULL,
          "user_id" INTEGER,
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
        );
      `
    })

    if (error) {
      console.log('❌ Erro ao criar tabela payments:', error.message)
    } else {
      console.log('✅ Tabela payments criada com sucesso')
    }
  }

  // Adicionar outras tabelas conforme necessário...
}

async function main() {
  try {
    const results = await verifySchema()
    await createMissingTables(results)
    
    console.log('\n🎯 Verificação concluída!')
    console.log('Para usar as Edge Functions, configure as seguintes variáveis no Supabase:')
    console.log('- ABACATEPAY_API_KEY')
    console.log('- ABACATEPAY_API_URL')
    console.log('- ABACATEPAY_WEBHOOK_SECRET')
    console.log('- WEBHOOK_BASE_URL')
    
  } catch (error) {
    console.error('❌ Erro durante a verificação:', error)
    process.exit(1)
  }
}

if (import.meta.main) {
  main()
}
