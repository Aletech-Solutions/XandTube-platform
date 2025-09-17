#!/usr/bin/env node

/**
 * Script para corrigir metadados faltantes nos registros existentes
 */

const downloadScanService = require('../services/downloadScanService');

async function fixMissingMetadata() {
  // Inicializar banco de dados
  try {
    const { sequelize } = require('../models');
    await sequelize.sync();
    console.log('✅ Banco de dados inicializado');
  } catch (dbError) {
    console.error('❌ Erro ao inicializar banco:', dbError.message);
    process.exit(1);
  }
  console.log('🔧 XandTube - Correção de Metadados Faltantes');
  console.log('📋 Este script corrige dados faltantes nos registros existentes');
  console.log('=' .repeat(70));
  
  const startTime = Date.now();
  
  try {
    console.log('🔍 Verificando registros com dados faltantes...');
    
    // Executar atualização de registros existentes
    const updatedRecords = await downloadScanService.updateExistingRecords();
    
    const totalTime = Date.now() - startTime;
    
    console.log('\n' + '='.repeat(70));
    console.log('🎉 Correção de metadados concluída!');
    console.log(`⏱️ Tempo total: ${totalTime}ms`);
    console.log(`📊 Registros corrigidos: ${updatedRecords}`);
    
    // Mostrar estatísticas do banco
    try {
      const stats = await downloadScanService.getDownloadStats();
      console.log('\n📈 Estatísticas atualizadas do banco:');
      console.log(`   • Total de downloads: ${stats.total}`);
      console.log(`   • Downloads completos: ${stats.completed}`);
      console.log(`   • Tamanho total: ${stats.totalSizeFormatted}`);
    } catch (statsError) {
      console.warn('⚠️ Erro ao obter estatísticas:', statsError.message);
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n💥 Erro durante a correção:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Mostrar ajuda se solicitado
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
XandTube - Script de Correção de Metadados

Este script corrige dados faltantes nos registros existentes do banco de dados,
incluindo fileSize, resolution, quality e thumbnailPath.

Uso:
  node fix-missing-metadata.js              Executar correção
  node fix-missing-metadata.js --help       Mostrar esta ajuda

O que faz:
  1. Busca registros com dados faltantes
  2. Lê arquivos .info.json correspondentes
  3. Extrai metadados faltantes
  4. Atualiza registros no banco
  5. Mostra estatísticas atualizadas

Campos corrigidos:
  - fileSize: Tamanho do arquivo de vídeo
  - resolution: Resolução do vídeo (ex: 1920x1080)
  - quality: Qualidade do vídeo (ex: 1080p)
  - thumbnailPath: Caminho para a thumbnail
`);
  process.exit(0);
}

fixMissingMetadata();
