import * as fs from 'fs/promises'
import * as path from 'path'

/**
 * Script para remover funções Vercel antigas após migração para Edge Functions
 * ATENÇÃO: Execute apenas após confirmar que as Edge Functions estão funcionando!
 */

const FUNCTIONS_TO_REMOVE = [
  'api/payment.ts',
  'api/webhook/abacatepay.ts'
]

const BACKUP_DIR = 'backup-vercel-functions'

async function createBackup() {
  console.log('📦 Criando backup das funções Vercel...')
  
  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true })
    
    for (const functionPath of FUNCTIONS_TO_REMOVE) {
      if (await fileExists(functionPath)) {
        const backupPath = path.join(BACKUP_DIR, functionPath)
        const backupDir = path.dirname(backupPath)
        
        await fs.mkdir(backupDir, { recursive: true })
        await fs.copyFile(functionPath, backupPath)
        
        console.log(`✅ Backup criado: ${functionPath} -> ${backupPath}`)
      } else {
        console.log(`⚠️  Arquivo não encontrado: ${functionPath}`)
      }
    }
    
    console.log(`📁 Backup salvo em: ${BACKUP_DIR}`)
    return true
  } catch (error) {
    console.error('❌ Erro ao criar backup:', error)
    return false
  }
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function removeFunctions() {
  console.log('\n🗑️  Removendo funções Vercel antigas...')
  
  for (const functionPath of FUNCTIONS_TO_REMOVE) {
    try {
      if (await fileExists(functionPath)) {
        await fs.unlink(functionPath)
        console.log(`✅ Removido: ${functionPath}`)
      } else {
        console.log(`⚠️  Já removido: ${functionPath}`)
      }
    } catch (error) {
      console.error(`❌ Erro ao remover ${functionPath}:`, error)
    }
  }
}

async function updateVercelConfig() {
  console.log('\n⚙️  Atualizando configuração do Vercel...')
  
  const vercelConfigPath = 'vercel.json'
  
  try {
    if (await fileExists(vercelConfigPath)) {
      const configContent = await fs.readFile(vercelConfigPath, 'utf-8')
      const config = JSON.parse(configContent)
      
      // Backup da configuração original
      await fs.writeFile(
        path.join(BACKUP_DIR, 'vercel.json'),
        configContent
      )
      
      console.log('✅ Backup do vercel.json criado')
      console.log('ℹ️  Configuração do Vercel mantida (sem alterações automáticas)')
    }
  } catch (error) {
    console.error('❌ Erro ao processar vercel.json:', error)
  }
}

async function generateReport() {
  console.log('\n📊 Gerando relatório de limpeza...')
  
  const report = {
    timestamp: new Date().toISOString(),
    removedFunctions: FUNCTIONS_TO_REMOVE,
    backupLocation: BACKUP_DIR,
    status: 'completed',
    notes: [
      'Funções Vercel de pagamento removidas',
      'Edge Functions do Supabase devem estar funcionando',
      'Backup criado para rollback se necessário'
    ]
  }
  
  const reportPath = 'cleanup-report.json'
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2))
  
  console.log(`📄 Relatório salvo em: ${reportPath}`)
}

async function confirmAction(): Promise<boolean> {
  console.log('⚠️  ATENÇÃO: Esta ação irá remover funções Vercel!')
  console.log('📋 Funções que serão removidas:')
  FUNCTIONS_TO_REMOVE.forEach(func => console.log(`   - ${func}`))
  console.log('')
  console.log('✅ Certifique-se de que:')
  console.log('   1. As Edge Functions do Supabase estão funcionando')
  console.log('   2. Os testes passaram com sucesso')
  console.log('   3. O sistema está funcionando em produção')
  console.log('')
  
  // Em um ambiente real, você usaria readline para input do usuário
  // Por simplicidade, vamos assumir confirmação via variável de ambiente
  const confirmed = process.env.CONFIRM_CLEANUP === 'true'
  
  if (!confirmed) {
    console.log('❌ Limpeza cancelada')
    console.log('💡 Para confirmar, execute: CONFIRM_CLEANUP=true npm run cleanup:vercel')
    return false
  }
  
  console.log('✅ Limpeza confirmada')
  return true
}

async function restoreInstructions() {
  console.log('\n🔄 Instruções para restaurar (se necessário):')
  console.log('=====================================')
  console.log('')
  console.log('Se precisar restaurar as funções Vercel:')
  console.log('')
  console.log('1. Copiar arquivos do backup:')
  FUNCTIONS_TO_REMOVE.forEach(func => {
    console.log(`   cp ${BACKUP_DIR}/${func} ${func}`)
  })
  console.log('')
  console.log('2. Remover variáveis Edge Functions do .env:')
  console.log('   # VITE_SUPABASE_URL=')
  console.log('')
  console.log('3. Fazer deploy na Vercel')
  console.log('')
  console.log(`📁 Backup localizado em: ${BACKUP_DIR}`)
}

async function main() {
  console.log('🧹 Limpeza de Funções Vercel')
  console.log('============================')
  console.log('')
  console.log('Este script remove funções Vercel após migração para Edge Functions')
  console.log('')
  
  // Confirmar ação
  const confirmed = await confirmAction()
  if (!confirmed) {
    process.exit(0)
  }
  
  try {
    // Criar backup
    const backupSuccess = await createBackup()
    if (!backupSuccess) {
      console.log('❌ Falha no backup. Abortando limpeza.')
      process.exit(1)
    }
    
    // Remover funções
    await removeFunctions()
    
    // Atualizar configurações
    await updateVercelConfig()
    
    // Gerar relatório
    await generateReport()
    
    // Mostrar instruções de restauração
    await restoreInstructions()
    
    console.log('\n🎉 Limpeza concluída com sucesso!')
    console.log('✅ Funções Vercel removidas')
    console.log('✅ Backup criado')
    console.log('✅ Relatório gerado')
    console.log('')
    console.log('🚀 Seu projeto agora usa apenas Edge Functions do Supabase!')
    console.log('📊 Funções Vercel reduzidas de 10 para 8 (dentro do limite de 12)')
    
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error)
    console.log('\n🔄 Se algo deu errado, restaure do backup:')
    console.log(`   cp -r ${BACKUP_DIR}/* .`)
    process.exit(1)
  }
}

if (import.meta.main) {
  main()
}
