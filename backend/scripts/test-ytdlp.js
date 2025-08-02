#!/usr/bin/env node

/**
 * Script de teste para verificar se o YT-DLP está funcionando corretamente
 * Uso: node scripts/test-ytdlp.js [URL]
 */

const { checkYtdlpInstallation, testYtdlpWithUrl } = require('../utils/checkYtdlp');
const ytdlpService = require('../services/ytdlpService');

async function runTests() {
  console.log('🧪 Iniciando testes do YT-DLP...\n');

  // 1. Verificar instalação
  console.log('1️⃣ Verificando instalação do YT-DLP...');
  const isInstalled = await checkYtdlpInstallation();
  
  if (!isInstalled) {
    console.error('❌ YT-DLP não está instalado. Execute:');
    console.error('   pip install yt-dlp');
    process.exit(1);
  }

  // 2. URL de teste (pode ser passada como argumento)
  const testUrl = process.argv[2] || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
  console.log(`\n2️⃣ Testando com URL: ${testUrl}`);

  try {
    // 3. Teste direto
    console.log('\n3️⃣ Teste direto (comando shell)...');
    const directResult = await testYtdlpWithUrl(testUrl);
    
    if (directResult) {
      console.log('✅ Teste direto: SUCESSO');
      console.log(`   Tipo: ${directResult._type || 'video'}`);
      console.log(`   Título: ${directResult.title}`);
      console.log(`   É playlist: ${!!directResult.entries}`);
    } else {
      console.log('❌ Teste direto: FALHOU');
    }

    // 4. Teste via serviço
    console.log('\n4️⃣ Teste via serviço...');
    const serviceResult = await ytdlpService.getInfo(testUrl);
    
    if (serviceResult) {
      console.log('✅ Teste serviço: SUCESSO');
      console.log(`   Tipo: ${serviceResult._type || 'video'}`);
      console.log(`   Título: ${serviceResult.title}`);
      console.log(`   É playlist: ${!!serviceResult.entries}`);
    } else {
      console.log('❌ Teste serviço: FALHOU (retornou null)');
    }

    // 5. Teste de formatação
    console.log('\n5️⃣ Teste de formatação de metadados...');
    const metadata = ytdlpService.formatVideoMetadata(serviceResult);
    
    if (metadata) {
      console.log('✅ Formatação: SUCESSO');
      console.log(`   YouTube ID: ${metadata.youtubeId}`);
      console.log(`   Canal: ${metadata.channelName}`);
      console.log(`   Duração: ${metadata.duration}s`);
    } else {
      console.log('❌ Formatação: FALHOU');
    }

    console.log('\n🎉 Todos os testes concluídos!');

  } catch (error) {
    console.error('\n❌ Erro durante os testes:', error.message);
    
    // Dicas de solução
    console.log('\n💡 Dicas para solução:');
    console.log('   1. Certifique-se de que o YT-DLP está atualizado: pip install --upgrade yt-dlp');
    console.log('   2. Verifique se a URL é válida e pública');
    console.log('   3. Tente com uma URL de vídeo simples primeiro');
    console.log('   4. Verifique sua conexão com a internet');
    
    process.exit(1);
  }
}

// Executar apenas se for chamado diretamente
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };