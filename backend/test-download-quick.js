#!/usr/bin/env node

/**
 * Teste rápido da funcionalidade de download corrigida
 */

const ytdlpService = require('./services/ytdlpService');

async function quickTest() {
  console.log('🚀 Teste rápido da correção do download\n');

  const testUrls = [
    'https://www.youtube.com/watch?v=O2j4yDuw4Mk', // URL que estava falhando
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // URL de teste conhecida
  ];

  for (const url of testUrls) {
    console.log(`\n🔍 Testando: ${url}`);
    
    try {
      const info = await ytdlpService.getInfo(url);
      
      if (info) {
        console.log('✅ SUCESSO!');
        console.log(`   Título: ${info.title}`);
        console.log(`   Tipo: ${info._type || 'video'}`);
        console.log(`   ID: ${info.id}`);
        console.log(`   Canal: ${info.channel || info.uploader}`);
        
        // Testa formatação de metadados
        const metadata = ytdlpService.formatVideoMetadata(info);
        if (metadata) {
          console.log('✅ Formatação de metadados: OK');
        } else {
          console.log('❌ Formatação de metadados: FALHOU');
        }
      } else {
        console.log('❌ FALHOU: info é null/undefined');
      }
      
    } catch (error) {
      console.log('❌ ERRO:', error.message);
    }
  }

  console.log('\n🎯 Teste concluído!');
}

// Executar se chamado diretamente
if (require.main === module) {
  quickTest().catch(console.error);
}

module.exports = { quickTest };