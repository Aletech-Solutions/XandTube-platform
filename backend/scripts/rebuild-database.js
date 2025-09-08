const sequelize = require('../config/database');
const fs = require('fs-extra');
const path = require('path');

/**
 * Script para recriar completamente o banco de dados SQLite
 */
async function rebuildDatabase() {
  let newSequelize = null;
  
  try {
    console.log('🔧 Iniciando reconstrução completa do banco de dados...');
    
    // Backup do banco atual (se existir)
    const dbPath = path.join(__dirname, '..', 'database.sqlite');
    const backupPath = path.join(__dirname, '..', `database_backup_${Date.now()}.sqlite`);
    
    if (await fs.pathExists(dbPath)) {
      console.log('💾 Fazendo backup do banco atual...');
      await fs.copy(dbPath, backupPath);
      console.log(`✅ Backup salvo em: ${backupPath}`);
      
      // Fechar conexão antes de remover o arquivo
      await sequelize.close();
      
      // Remover banco atual
      await fs.remove(dbPath);
      console.log('🗑️ Banco atual removido');
    }
    
    // Recriar conexão
    console.log('🔄 Recriando banco de dados...');
    
    // Criar nova instância do sequelize
    const { Sequelize } = require('sequelize');
    newSequelize = new Sequelize({
      dialect: 'sqlite',
      storage: dbPath,
      logging: false,
      define: {
        timestamps: true,
        underscored: true,
      }
    });
    
    // Importar modelos com nova conexão
    const { User, Video, Channel, ChannelTracking, Comment, Download } = require('../models');
    
    // Desabilitar foreign keys temporariamente
    await newSequelize.query('PRAGMA foreign_keys = OFF;');
    
    // Criar tabelas na ordem correta (respeitando dependências)
    console.log('📋 Criando tabela Users...');
    await User.sync({ force: true });
    
    console.log('📋 Criando tabela Channels...');
    await Channel.sync({ force: true });
    
    console.log('📋 Criando tabela Downloads...');
    await Download.sync({ force: true });
    
    console.log('📋 Criando tabela Videos...');
    await Video.sync({ force: true });
    
    console.log('📋 Criando tabela Comments...');
    await Comment.sync({ force: true });
    
    console.log('📋 Criando tabela ChannelTracking...');
    await ChannelTracking.sync({ force: true });
    
    // Reabilitar foreign keys
    await newSequelize.query('PRAGMA foreign_keys = ON;');
    
    // Verificar integridade
    console.log('🔍 Verificando integridade do banco...');
    const integrityCheck = await newSequelize.query('PRAGMA integrity_check;');
    console.log('📊 Resultado da verificação:', integrityCheck[0]);
    
    // Criar usuário admin padrão se não existir
    console.log('👤 Criando usuário admin padrão...');
    try {
      const adminUser = await User.create({
        username: 'admin',
        email: 'admin@xandtube.local',
        password: 'admin123',
        fullName: 'Administrador',
        role: 'admin'
      });
      console.log(`✅ Usuário admin criado com ID: ${adminUser.id}`);
    } catch (userError) {
      if (userError.name === 'SequelizeUniqueConstraintError') {
        console.log('ℹ️ Usuário admin já existe');
      } else {
        throw userError;
      }
    }
    
    console.log('✅ Reconstrução do banco de dados concluída com sucesso!');
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro durante reconstrução:', error);
    throw error;
  } finally {
    // Fechar a nova conexão se ela foi criada
    try {
      if (newSequelize) {
        await newSequelize.close();
      }
    } catch (closeError) {
      console.warn('⚠️ Erro ao fechar conexão:', closeError.message);
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  rebuildDatabase()
    .then(() => {
      console.log('🎉 Reconstrução concluída com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Reconstrução falhou:', error);
      process.exit(1);
    });
}

module.exports = { rebuildDatabase };
