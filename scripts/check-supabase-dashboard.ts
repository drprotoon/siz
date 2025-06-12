import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file')
  console.error('')
  console.error('Example:')
  console.error('SUPABASE_URL=https://your-project.supabase.co')
  console.error('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkSupabaseConnection() {
  console.log('🔍 Verificando conexão com Supabase...')
  console.log(`📡 URL: ${supabaseUrl}`)
  console.log(`🔑 Service Key: ${supabaseServiceKey.substring(0, 10)}...`)
  console.log('')

  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)

    if (error) {
      console.log('❌ Erro na conexão:', error.message)
      return false
    }

    console.log('✅ Conexão com Supabase estabelecida com sucesso!')
    return true
  } catch (error) {
    console.log('❌ Erro na conexão:', error)
    return false
  }
}

async function checkTables() {
  console.log('\n📋 Verificando tabelas necessárias...')
  
  const requiredTables = [
    { name: 'users', critical: true },
    { name: 'products', critical: true },
    { name: 'orders', critical: true },
    { name: 'payments', critical: true },
    { name: 'categories', critical: false },
    { name: 'order_items', critical: false }
  ]

  const results = []

  for (const table of requiredTables) {
    try {
      const { data, error } = await supabase
        .from(table.name)
        .select('*')
        .limit(1)

      if (error) {
        console.log(`${table.critical ? '❌' : '⚠️'} ${table.name}: ${error.message}`)
        results.push({ name: table.name, exists: false, critical: table.critical, error: error.message })
      } else {
        console.log(`✅ ${table.name}: OK`)
        results.push({ name: table.name, exists: true, critical: table.critical })
      }
    } catch (error) {
      console.log(`${table.critical ? '❌' : '⚠️'} ${table.name}: ${error}`)
      results.push({ name: table.name, exists: false, critical: table.critical, error: String(error) })
    }
  }

  return results
}

async function checkPaymentsTable() {
  console.log('\n💳 Verificando estrutura da tabela payments...')
  
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .limit(1)

    if (error) {
      console.log('❌ Tabela payments não existe ou tem problemas:', error.message)
      console.log('\n📝 SQL para criar a tabela payments:')
      console.log(`
CREATE TABLE "payments" (
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
      `)
      return false
    }

    if (data && data.length > 0) {
      const columns = Object.keys(data[0])
      console.log(`✅ Tabela payments existe com ${columns.length} colunas`)
      console.log(`📋 Colunas: ${columns.join(', ')}`)
    } else {
      console.log('✅ Tabela payments existe mas está vazia')
    }

    return true
  } catch (error) {
    console.log('❌ Erro ao verificar tabela payments:', error)
    return false
  }
}

async function generateInstructions(tableResults: any[]) {
  console.log('\n📋 Instruções para configurar Edge Functions:')
  console.log('===========================================')

  const criticalMissing = tableResults.filter(t => t.critical && !t.exists)
  
  if (criticalMissing.length > 0) {
    console.log('\n❌ ATENÇÃO: Tabelas críticas estão faltando!')
    console.log('Você precisa criar essas tabelas antes de usar as Edge Functions:')
    criticalMissing.forEach(table => {
      console.log(`   - ${table.name}`)
    })
    console.log('\nExecute as migrações do banco de dados primeiro.')
    return
  }

  console.log('\n✅ Todas as tabelas críticas existem!')
  console.log('\n🚀 Próximos passos para configurar Edge Functions:')
  
  console.log('\n1. 📱 Acesse o Dashboard do Supabase:')
  console.log(`   ${supabaseUrl.replace('/rest/v1', '')}/dashboard`)
  
  console.log('\n2. 🔧 Vá em Edge Functions e crie duas funções:')
  console.log('   a) Nome: "payment"')
  console.log('      - Cole o código de: supabase/functions/payment/index.ts')
  console.log('   b) Nome: "webhook-abacatepay"')
  console.log('      - Cole o código de: supabase/functions/webhook-abacatepay/index.ts')
  
  console.log('\n3. ⚙️ Configure as variáveis de ambiente em Settings > Edge Functions:')
  console.log('   ABACATEPAY_API_KEY=sua_chave_api')
  console.log('   ABACATEPAY_API_URL=https://api.abacatepay.com')
  console.log('   ABACATEPAY_WEBHOOK_SECRET=sua_chave_webhook')
  console.log(`   WEBHOOK_BASE_URL=${supabaseUrl.replace('/rest/v1', '')}`)
  
  console.log('\n4. 🔗 Configure o webhook no AbacatePay:')
  console.log(`   URL: ${supabaseUrl.replace('/rest/v1', '')}/functions/v1/webhook-abacatepay`)
  
  console.log('\n5. 🌐 Atualize as variáveis do frontend (.env):')
  console.log(`   VITE_SUPABASE_URL=${supabaseUrl.replace('/rest/v1', '')}`)
  console.log('   VITE_SUPABASE_ANON_KEY=sua_anon_key')
  
  console.log('\n6. 🧪 Teste as funções:')
  console.log('   npm run test:edge-functions')
}

async function main() {
  console.log('🔍 Verificação do Supabase para Edge Functions')
  console.log('==============================================')
  
  const connected = await checkSupabaseConnection()
  if (!connected) {
    console.log('\n❌ Não foi possível conectar ao Supabase')
    console.log('Verifique suas credenciais e tente novamente.')
    process.exit(1)
  }

  const tableResults = await checkTables()
  await checkPaymentsTable()
  await generateInstructions(tableResults)

  console.log('\n🎯 Verificação concluída!')
  console.log('Siga as instruções acima para configurar as Edge Functions.')
}

if (import.meta.main) {
  main()
}
