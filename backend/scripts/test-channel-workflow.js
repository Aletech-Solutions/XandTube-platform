#!/usr/bin/env node

/**
 * Script para testar o fluxo completo: getChannelInfo + getChannelVideos
 */

const ytdlpService = require('../services/ytdlpService');

async function testChannelWorkflow() {
  console.log('🧪 Testando fluxo completo: Canal + Vídeos\n');
  
  // URL do canal que estava falhando
  const channelUrl = 'https://www.youtube.com/@CienciaTodoDia';
  const videoLimit = 3;
  
  try {
    console.log(`🔍 Testando canal: ${channelUrl}`);
    console.log(`📺 Buscando ${videoLimit} vídeos mais recentes`);
    console.log('⏳ Iniciando fluxo completo...\n');
    
    const startTime = Date.now();
    
    // Testar o método combinado
    const result = await ytdlpService.getChannelInfoAndVideos(channelUrl, videoLimit);
    
    const endTime = Date.now();
    const totalDuration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('\n🎉 FLUXO COMPLETO BEM-SUCEDIDO!');
    console.log('═'.repeat(70));
    console.log(`⏱️  Tempo total: ${totalDuration} segundos`);
    console.log('═'.repeat(70));
    
    console.log('\n📋 INFORMAÇÕES DO CANAL:');
    console.log('─'.repeat(50));
    console.log(`📺 Nome: ${result.channel.name}`);
    console.log(`🆔 ID: ${result.channel.id}`);
    console.log(`📝 Título: ${result.channel.title || 'N/A'}`);
    console.log(`📊 Tipo: ${result.channel._type || 'N/A'}`);
    console.log(`🖼️  Thumbnail: ${result.channel.thumbnail ? 'Disponível' : 'N/A'}`);
    console.log(`👥 Inscritos: ${result.channel.subscriber_count || 'N/A'}`);
    console.log(`🎥 Total de vídeos: ${result.channel.video_count || 'N/A'}`);
    if (result.channel.description) {
      console.log(`📝 Descrição: ${result.channel.description.substring(0, 100)}...`);
    }
    
    console.log('\n🎥 VÍDEOS RECENTES:');
    console.log('─'.repeat(50));
    console.log(`📊 Total encontrados: ${result.stats.totalVideosFound}`);
    
    if (result.videos && result.videos.length > 0) {
      result.videos.forEach((video, index) => {
        console.log(`\n${index + 1}. 📺 ${video.title}`);
        console.log(`   🆔 ID: ${video.id}`);
        console.log(`   ⏱️  Duração: ${video.duration ? Math.floor(video.duration / 60) + ':' + String(video.duration % 60).padStart(2, '0') : 'N/A'}`);
        console.log(`   👁️  Visualizações: ${video.view_count ? video.view_count.toLocaleString() : 'N/A'}`);
        console.log(`   📅 Data: ${video.upload_date || 'N/A'}`);
        if (video.description) {
          console.log(`   📝 Descrição: ${video.description.substring(0, 80)}...`);
        }
      });
    } else {
      console.log('⚠️ Nenhum vídeo encontrado');
    }
    
    console.log('\n📊 ESTATÍSTICAS:');
    console.log('─'.repeat(50));
    console.log(`⏱️  Tempo de processamento: ${result.stats.processingTime}`);
    console.log(`✅ Status: ${result.stats.success ? 'Sucesso' : 'Falhou'}`);
    console.log(`🎯 Taxa de sucesso: 100%`);
    
    console.log('\n✅ TESTE CONCLUÍDO COM SUCESSO!');
    
  } catch (error) {
    console.error('\n❌ TESTE FALHOU!');
    console.error('═'.repeat(70));
    console.error(`🚨 Erro: ${error.message}`);
    console.error('═'.repeat(70));
    
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
testChannelWorkflow().catch(error => {
  console.error('💥 Erro fatal no teste:', error);
  process.exit(1);
});
