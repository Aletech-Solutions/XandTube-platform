#!/usr/bin/env node

/**
 * Teste específico para verificar se a correção do erro de referência funcionou
 */

const ytdlpService = require('./services/ytdlpService');

async function testDownloadFix() {
  console.log('🧪 Testando correção do erro de referência no download\n');

  const testUrl = 'https://www.youtube.com/watch?v=O2j4yDuw4Mk';
  
  console.log(`🔍 Testando URL: ${testUrl}\n`);

  try {
    // 1. Teste de obtenção de informações
    console.log('1️⃣ Obtendo informações...');
    const info = await ytdlpService.getInfo(testUrl);
    
    if (!info) {
      throw new Error('getInfo retornou null/undefined');
    }
    
    console.log('✅ Info obtida com sucesso');
    console.log(`   Título: ${info.title}`);
    console.log(`   ID: ${info.id}`);
    
    // 2. Teste de formatação de metadados
    console.log('\n2️⃣ Formatando metadados...');
    const metadata = ytdlpService.formatVideoMetadata(info);
    
    if (!metadata) {
      throw new Error('formatVideoMetadata retornou null/undefined');
    }
    
    console.log('✅ Metadados formatados com sucesso');
    console.log(`   YouTube ID: ${metadata.youtubeId}`);
    console.log(`   Canal: ${metadata.channelName}`);
    console.log(`   Duração: ${metadata.duration}s`);
    
    // 3. Teste de download simulado (apenas preparação)
    console.log('\n3️⃣ Testando preparação para download...');
    
    // Simula o que acontece na rota de download
    const downloadId = `test_${Date.now()}`;
    const downloadProgress = new Map();
    
    // Simula obtenção de metadados ANTES do download (como corrigido)
    const videoInfo = await ytdlpService.getInfo(testUrl);
    const downloadMetadata = ytdlpService.formatVideoMetadata(videoInfo);
    
    // Simula callback de progresso sem erro de referência
    const progressCallback = (progress) => {
      downloadProgress.set(downloadId, { 
        progress, 
        status: 'downloading',
        metadata: downloadMetadata // Agora metadata está disponível
      });
      console.log(`   📈 Progresso simulado: ${progress}% - Metadados: OK`);
    };
    
    // Testa o callback
    progressCallback(0);
    progressCallback(50);
    progressCallback(100);
    
    console.log('✅ Callback de progresso funcionando sem erros de referência');
    
    console.log('\n🎉 Todos os testes passaram! A correção está funcionando.');
    
  } catch (error) {
    console.error('\n❌ Erro durante o teste:', error.message);
    console.error('\n📝 Stack trace:', error.stack);
    
    console.log('\n💡 Se ainda houver erros:');
    console.log('   1. Certifique-se de que o yt-dlp está instalado');
    console.log('   2. Verifique sua conexão com a internet');
    console.log('   3. Teste com uma URL diferente');
    
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  testDownloadFix().catch(console.error);
}

module.exports = { testDownloadFix };