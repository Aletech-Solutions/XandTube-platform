/**
 * Script para testar as correções de playlist
 * Executa: node test-playlist-fix.js
 */

const ytdlpService = require('./services/ytdlpService');

async function testPlaylistFix() {
  const testUrl = 'https://www.youtube.com/playlist?list=PLLtohW8jaVGonH1fjO_xJQGucOtdlyltP';
  
  try {
    console.log('🧪 Testando correções para playlist...');
    console.log('🔗 URL:', testUrl);
    console.log('');
    
    const ytdlp = new ytdlpService();
    
    console.log('⏱️ Iniciando teste...');
    const startTime = Date.now();
    
    const info = await ytdlp.getInfo(testUrl);
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('');
    console.log('✅ Teste concluído em', duration, 'segundos');
    console.log('');
    console.log('📊 Resultados:');
    console.log(`   Tipo: ${info._type}`);
    console.log(`   Título: ${info.title}`);
    console.log(`   ID: ${info.id}`);
    console.log(`   Vídeos: ${info.entries ? info.entries.length : 0}`);
    
    if (info.entries && info.entries.length > 0) {
      console.log('');
      console.log('🎥 Primeiros 5 vídeos:');
      info.entries.slice(0, 5).forEach((video, index) => {
        console.log(`   ${index + 1}. ${video.title} (${video.id})`);
      });
      
      if (info.entries.length > 5) {
        console.log(`   ... e mais ${info.entries.length - 5} vídeos`);
      }
    }
    
    console.log('');
    console.log('🎉 Teste de playlist bem-sucedido!');
    
    // Teste de formatação para o frontend
    console.log('');
    console.log('📋 Formato para frontend:');
    const frontendFormat = {
      type: 'playlist',
      title: info.title || 'Playlist sem título',
      playlistId: info.id || info.playlist_id,
      totalVideos: info.entries ? info.entries.length : 0,
      videos: info.entries ? info.entries.slice(0, 10).map((video, index) => ({
        id: video.id || video.url || `video_${index}`,
        title: video.title || `Vídeo ${index + 1}`,
        duration: video.duration || 0,
        thumbnail: video.thumbnail || video.thumbnails?.[0]?.url || ''
      })) : []
    };
    
    console.log(JSON.stringify(frontendFormat, null, 2));
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    console.error('🔍 Stack:', error.stack);
    process.exit(1);
  }
}

// Executa o teste
testPlaylistFix();