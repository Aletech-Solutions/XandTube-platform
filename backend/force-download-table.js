const sequelize = require('./config/database');

async function recreateDownloadsTable() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado ao banco');
    
    // Primeiro, dropa a tabela se existir
    await sequelize.query('DROP TABLE IF EXISTS downloads;');
    console.log('🗑️ Tabela downloads removida (se existia)');
    
    // Agora importa o modelo atualizado e cria a tabela
    const { Download } = require('./models');
    await Download.sync({ force: true });
    console.log('✅ Tabela Downloads recriada com sucesso!');
    
    // Verifica se a tabela foi criada corretamente
    const [results] = await sequelize.query("PRAGMA table_info(downloads);");
    console.log('📋 Estrutura da tabela downloads:');
    results.forEach(col => {
      console.log(`  - ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : 'NULL'} ${col.pk ? '(PK)' : ''}`);
    });
    
    await sequelize.close();
    console.log('✅ Processo concluído com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    await sequelize.close();
    process.exit(1);
  }
}

recreateDownloadsTable();