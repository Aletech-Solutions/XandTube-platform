const fs = require('fs-extra');
const path = require('path');

/**
 * Script simples para resetar o banco de dados SQLite
 */
async function resetDatabase() {
  try {
    console.log('🔧 Resetando banco de dados SQLite...');
    
    const dbPath = path.join(__dirname, '..', 'database.sqlite');
    const backupPath = path.join(__dirname, '..', `database_backup_${Date.now()}.sqlite`);
    
    // Fazer backup se existir
    if (await fs.pathExists(dbPath)) {
      console.log('💾 Fazendo backup do banco atual...');
      await fs.copy(dbPath, backupPath);
      console.log(`✅ Backup salvo em: ${backupPath}`);
      
      // Remover banco atual
      await fs.remove(dbPath);
      console.log('🗑️ Banco atual removido');
    } else {
      console.log('ℹ️ Nenhum banco existente encontrado');
    }
    
    console.log('✅ Reset concluído! O banco será recriado na próxima execução.');
    
  } catch (error) {
    console.error('❌ Erro durante reset:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  resetDatabase()
    .then(() => {
      console.log('🎉 Reset concluído com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Reset falhou:', error);
      process.exit(1);
    });
}

module.exports = { resetDatabase };
