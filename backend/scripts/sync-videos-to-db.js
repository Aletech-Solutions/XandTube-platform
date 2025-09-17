#!/usr/bin/env node

/**
 * Script para sincronizar vídeos existentes com o banco de dados
 * Executa o mesmo processo que acontece na inicialização do servidor
 */

const downloadScanService = require('../services/downloadScanService');

async function syncVideosToDatabase() {
  console.log('🚀 XandTube - Sincronização de Vídeos');
  console.log('📋 Este script sincroniza todos os vídeos da pasta downloads com o banco de dados');
  console.log('=' .repeat(70));
  
  const startTime = Date.now();
  
  try {
    // Executar sincronização com opções detalhadas
    const options = {
      skipExisting: true,    // Pular vídeos já existentes
      batchSize: 5,         // Processar 5 arquivos por vez
      logProgress: true     // Mostrar progresso detalhado
    };
    
    console.log('⚙️ Configurações:');
    console.log(`   • Pular existentes: ${options.skipExisting ? 'Sim' : 'Não'}`);
    console.log(`   • Tamanho do lote: ${options.batchSize}`);
    console.log(`   • Log detalhado: ${options.logProgress ? 'Sim' : 'Não'}\n`);
    
    const processedDownloads = await downloadScanService.scanAndRegisterDownloads(options);
    
    const totalTime = Date.now() - startTime;
    
    console.log('\n' + '='.repeat(70));
    console.log('🎉 Sincronização concluída com sucesso!');
    console.log(`⏱️ Tempo total: ${totalTime}ms`);
    console.log(`📊 Vídeos processados: ${processedDownloads.length}`);
    
    if (processedDownloads.length > 0) {
      console.log('\n📋 Últimos vídeos sincronizados:');
      processedDownloads.slice(-5).forEach((download, index) => {
        console.log(`   ${index + 1}. ${download.title}`);
        console.log(`      Canal: ${download.channelName}`);
        console.log(`      Tamanho: ${downloadScanService.formatBytes(download.fileSize || 0)}`);
      });
    }
    
    // Mostrar estatísticas do banco
    try {
      const stats = await downloadScanService.getDownloadStats();
      console.log('\n📈 Estatísticas do banco de dados:');
      console.log(`   • Total de downloads: ${stats.total}`);
      console.log(`   • Downloads completos: ${stats.completed}`);
      console.log(`   • Tamanho total: ${stats.totalSizeFormatted}`);
    } catch (statsError) {
      console.warn('⚠️ Erro ao obter estatísticas:', statsError.message);
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n💥 Erro durante a sincronização:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Mostrar ajuda se solicitado
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
XandTube - Script de Sincronização de Vídeos

Este script escaneia a pasta videos/downloads e registra todos os vídeos
encontrados no banco de dados SQLite.

Uso:
  node sync-videos-to-db.js              Executar sincronização
  node sync-videos-to-db.js --help       Mostrar esta ajuda

O que faz:
  1. Escaneia pasta videos/downloads
  2. Processa arquivos .info.json
  3. Registra vídeos no banco de dados
  4. Pula vídeos já existentes
  5. Cria usuário padrão se necessário
  6. Mostra estatísticas detalhadas

Recursos de segurança:
  - Não sobrescreve dados existentes
  - Processamento em lotes para performance
  - Tratamento robusto de erros
  - Logs detalhados para debug
`);
  process.exit(0);
}

// Verificar se deve forçar re-sincronização
const forceSync = process.argv.includes('--force');
if (forceSync) {
  console.log('⚠️ Modo FORCE ativado - irá reprocessar vídeos existentes');
}

syncVideosToDatabase();
