const fs = require('fs-extra');
const path = require('path');

/**
 * Script para limpar arquivos JSON antigos após migração para SQLite
 */
async function cleanupJsonFiles() {
  try {
    console.log('🧹 Iniciando limpeza de arquivos JSON antigos...');
    
    const videosPath = path.join(__dirname, '../../videos');
    const filesToCheck = [
      'downloads-cache.json',
      'channel-images.json'
    ];
    
    let cleaned = 0;
    let kept = 0;
    
    for (const fileName of filesToCheck) {
      const filePath = path.join(videosPath, fileName);
      const backupPath = path.join(videosPath, `${fileName}.backup`);
      
      if (await fs.pathExists(filePath)) {
        // Verificar se já existe backup
        if (await fs.pathExists(backupPath)) {
          console.log(`🗑️ Removendo ${fileName} (backup já existe)`);
          await fs.remove(filePath);
          cleaned++;
        } else {
          console.log(`💾 Mantendo ${fileName} (sem backup encontrado)`);
          kept++;
        }
      } else {
        console.log(`ℹ️ ${fileName} não encontrado`);
      }
    }
    
    console.log(`✅ Limpeza concluída: ${cleaned} arquivos removidos, ${kept} mantidos`);
    
    if (kept > 0) {
      console.log('💡 Dica: Execute o script de migração primeiro para criar backups');
    }
    
  } catch (error) {
    console.error('❌ Erro durante limpeza:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  cleanupJsonFiles()
    .then(() => {
      console.log('🎉 Limpeza concluída com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Limpeza falhou:', error);
      process.exit(1);
    });
}

module.exports = { cleanupJsonFiles };
