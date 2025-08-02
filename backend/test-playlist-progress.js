/**
 * Script para testar o progresso individual de vídeos em playlist
 * Executa: node test-playlist-progress.js
 */

const ytdlpService = require('./services/ytdlpService');

async function testPlaylistProgress() {
  // URL de teste - playlist pequena para facilitar o teste
  const testUrl = 'https://www.youtube.com/playlist?list=PLLtohW8jaVGonH1fjO_xJQGucOtdlyltP';
  
  try {
    console.log('🧪 Testando progresso individual de playlist...');
    console.log('🔗 URL:', testUrl);
    console.log('');
    
    const ytdlp = new ytdlpService();
    
    console.log('⏱️ Iniciando simulação de download...');
    const startTime = Date.now();
    
    // Simula o download com callback de progresso
    const result = await ytdlp.downloadPlaylist(testUrl, { quality: '480p' }, (progressData) => {
      console.log('📊 Progresso recebido:', progressData.type);
      
      switch (progressData.type) {
        case 'playlist_init':
          console.log(`🎬 Playlist: ${progressData.playlistTitle}`);
          console.log(`📁 Total de vídeos: ${progressData.totalVideos}`);
          console.log('📋 Vídeos iniciados:');
          Object.entries(progressData.videos).forEach(([id, video]) => {
            console.log(`  ${video.index}. ${video.title} - ${video.status}`);
          });
          console.log('');
          break;
          
        case 'video_update':
          const currentVideo = progressData.videos[progressData.videoId];
          if (currentVideo) {
            const progressBar = '█'.repeat(Math.floor(currentVideo.progress / 5)) + 
                              '░'.repeat(20 - Math.floor(currentVideo.progress / 5));
            console.log(`📥 ${currentVideo.index}. ${currentVideo.title}`);
            console.log(`   Status: ${currentVideo.status} | Progresso: [${progressBar}] ${currentVideo.progress.toFixed(1)}%`);
            if (currentVideo.error) {
              console.log(`   ❌ Erro: ${currentVideo.error}`);
            }
            console.log('');
          }
          break;
          
        case 'playlist_complete':
          console.log('🎉 Playlist completa!');
          console.log(`✅ ${progressData.downloaded}/${progressData.totalVideos} vídeos baixados com sucesso`);
          
          const failed = Object.values(progressData.videos).filter(v => v.status === 'error');
          if (failed.length > 0) {
            console.log('❌ Vídeos com erro:');
            failed.forEach(video => {
              console.log(`  ${video.index}. ${video.title} - ${video.error}`);
            });
          }
          break;
      }
    });
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('');
    console.log('✅ Teste concluído em', duration, 'segundos');
    console.log('');
    console.log('📊 Resultado final:');
    console.log(`   Playlist: ${result.playlistTitle}`);
    console.log(`   Total de vídeos: ${result.totalVideos}`);
    console.log(`   Downloads bem-sucedidos: ${result.downloaded}`);
    console.log(`   Falhas: ${result.totalVideos - result.downloaded}`);
    
    if (result.videosProgress) {
      console.log('');
      console.log('📋 Status final dos vídeos:');
      Object.entries(result.videosProgress).forEach(([id, video]) => {
        const statusIcon = video.status === 'completed' ? '✅' : 
                          video.status === 'error' ? '❌' : 
                          video.status === 'skipped' ? '⏭️' : '❓';
        console.log(`   ${statusIcon} ${video.index}. ${video.title} (${video.status})`);
      });
    }
    
    console.log('');
    console.log('🎉 Teste de progresso individual bem-sucedido!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    console.error('🔍 Stack:', error.stack);
    process.exit(1);
  }
}

// Executa o teste apenas se limitarmos a 3 vídeos para não sobrecarregar
console.log('⚠️  Este teste irá baixar alguns vídeos da playlist.');
console.log('🔄 Para cancelar, pressione Ctrl+C nos próximos 5 segundos...');

setTimeout(() => {
  testPlaylistProgress();
}, 5000);