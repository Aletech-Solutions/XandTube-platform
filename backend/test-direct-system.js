const directDownloadService = require('./services/directDownloadService');

async function testDirectSystem() {
  console.log('🧪 Testando sistema de downloads direto...\n');

  try {
    // Teste 1: Listar downloads
    console.log('📋 Teste 1: Listando downloads...');
    const { downloads, total } = await directDownloadService.listDownloads(null, 1, 10);
    console.log(`✅ Encontrados ${total} downloads`);
    
    if (downloads.length > 0) {
      const first = downloads[0];
      console.log(`📹 Primeiro download: "${first.title}" (${first.fileSizeFormatted})`);
      
      // Teste 2: Buscar download específico
      console.log('\n🔍 Teste 2: Buscando download específico...');
      const specific = await directDownloadService.getDownload(first.id);
      if (specific) {
        console.log(`✅ Download encontrado: ${specific.title}`);
        console.log(`   Canal: ${specific.channelName}`);
        console.log(`   Duração: ${specific.duration}`);
        console.log(`   Resolução: ${specific.resolution}`);
        console.log(`   Arquivo: ${specific.videoPath}`);
      } else {
        console.log('❌ Download não encontrado');
      }
      
      // Teste 3: Estatísticas
      console.log('\n📊 Teste 3: Obtendo estatísticas...');
      const stats = await directDownloadService.getStats();
      console.log(`✅ Estatísticas:`);
      console.log(`   Total de downloads: ${stats.totalDownloads}`);
      console.log(`   Tamanho total: ${stats.totalSizeFormatted}`);
      console.log(`   Duração total: ${stats.totalDurationFormatted}`);
      console.log(`   Formatos:`, Object.keys(stats.formats).join(', '));
      console.log(`   Top 3 canais:`, stats.channels.slice(0, 3).map(c => c.name).join(', '));
      
      // Teste 4: Busca por termo
      console.log('\n🔎 Teste 4: Buscando por termo...');
      const searchResult = await directDownloadService.searchDownloads('test', null, 1, 5);
      console.log(`✅ Busca retornou ${searchResult.total} resultados`);
      
    } else {
      console.log('⚠️ Nenhum download encontrado na pasta');
      console.log('   Certifique-se que há arquivos .info.json em /videos/downloads');
    }

  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message);
    if (error.code === 'ENOENT') {
      console.log('💡 Dica: A pasta /videos/downloads não existe ou está vazia');
    }
  }

  console.log('\n🏁 Testes concluídos!');
}

// Executa se chamado diretamente
if (require.main === module) {
  testDirectSystem();
}

module.exports = testDirectSystem;