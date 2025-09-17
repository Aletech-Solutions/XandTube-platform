#!/usr/bin/env node

/**
 * Script para testar a obtenção de informações de canal com as melhorias anti-bot
 */

const ytdlpService = require('../services/ytdlpService');

async function testChannelInfo() {
  console.log('🧪 Testando obtenção de informações do canal com melhorias anti-bot...\n');
  
  // URL do canal que estava falhando
  const channelUrl = 'https://www.youtube.com/@CienciaTodoDia';
  
  try {
    console.log(`🔍 Testando canal: ${channelUrl}`);
    console.log('⏳ Iniciando teste...\n');
    
    const startTime = Date.now();
    
    // Testar o método melhorado
    const channelInfo = await ytdlpService.getChannelInfo(channelUrl);
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('\n✅ TESTE BEM-SUCEDIDO!');
    console.log('═'.repeat(50));
    console.log(`⏱️  Tempo total: ${duration} segundos`);
    console.log(`📺 Canal: ${channelInfo.channel || channelInfo.uploader || 'N/A'}`);
    console.log(`🆔 ID: ${channelInfo.id || channelInfo.channel_id || channelInfo.uploader_id || 'N/A'}`);
    console.log(`📊 Tipo: ${channelInfo._type || 'N/A'}`);
    console.log(`📝 Descrição: ${(channelInfo.description || 'N/A').substring(0, 100)}...`);
    console.log(`👥 Inscritos: ${channelInfo.subscriber_count || 'N/A'}`);
    console.log(`🎥 Vídeos: ${channelInfo.video_count || 'N/A'}`);
    console.log(`🖼️  Thumbnail: ${channelInfo.thumbnail ? 'Disponível' : 'N/A'}`);
    console.log('═'.repeat(50));
    
  } catch (error) {
    console.error('\n❌ TESTE FALHOU!');
    console.error('═'.repeat(50));
    console.error(`🚨 Erro: ${error.message}`);
    console.error('═'.repeat(50));
    
    // Sugestões baseadas no tipo de erro
    if (error.message.includes('bot') || error.message.includes('Sign in')) {
      console.log('\n💡 SUGESTÕES PARA RESOLVER:');
      console.log('1. 🍪 Verifique se o arquivo cookies.txt está atualizado');
      console.log('2. 🌐 Tente usar uma VPN ou IP diferente'); 
      console.log('3. ⏰ Aguarde alguns minutos antes de tentar novamente');
      console.log('4. 🔧 Exporte cookies frescos do seu navegador');
    }
    
    process.exit(1);
  }
}

// Executar teste
testChannelInfo().catch(error => {
  console.error('💥 Erro fatal no teste:', error);
  process.exit(1);
});
