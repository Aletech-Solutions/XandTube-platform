const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

/**
 * Script para corrigir problemas no banco de dados SQLite
 */
async function fixDatabaseIssues() {
  try {
    console.log('🔧 Iniciando correção dos problemas do banco de dados...');
    
    await sequelize.authenticate();
    console.log('✅ Conexão com banco estabelecida');
    
    // 1. Verificar e corrigir problema de emails duplicados/null na tabela users
    console.log('\n📋 Verificando tabela users...');
    
    try {
      // Verificar se a tabela users existe
      const tables = await sequelize.query(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='users';",
        { type: QueryTypes.SELECT }
      );
      
      if (tables.length > 0) {
        console.log('✅ Tabela users encontrada');
        
        // Verificar emails duplicados/null
        const duplicateEmails = await sequelize.query(
          "SELECT email, COUNT(*) as count FROM users WHERE email IS NOT NULL GROUP BY email HAVING COUNT(*) > 1;",
          { type: QueryTypes.SELECT }
        );
        
        const nullEmails = await sequelize.query(
          "SELECT COUNT(*) as count FROM users WHERE email IS NULL;",
          { type: QueryTypes.SELECT }
        );
        
        console.log(`📊 Emails duplicados: ${duplicateEmails.length}`);
        console.log(`📊 Emails NULL: ${nullEmails[0].count}`);
        
        if (duplicateEmails.length > 0 || nullEmails[0].count > 0) {
          console.log('🔄 Corrigindo emails duplicados/null...');
          
          // Remover registros com email NULL (exceto o primeiro)
          await sequelize.query(
            `DELETE FROM users WHERE id NOT IN (
              SELECT MIN(id) FROM users WHERE email IS NULL
            ) AND email IS NULL;`
          );
          
          // Para emails duplicados, manter apenas o mais antigo
          for (const duplicate of duplicateEmails) {
            await sequelize.query(
              `DELETE FROM users WHERE email = ? AND id NOT IN (
                SELECT MIN(id) FROM users WHERE email = ?
              );`,
              { 
                replacements: [duplicate.email, duplicate.email],
                type: QueryTypes.DELETE 
              }
            );
          }
          
          console.log('✅ Emails duplicados corrigidos');
        }
      } else {
        console.log('⚠️ Tabela users não existe, será criada no sync');
      }
    } catch (error) {
      console.log('⚠️ Erro ao verificar tabela users:', error.message);
    }
    
    // 2. Verificar e corrigir problema da coluna download_id
    console.log('\n📋 Verificando problema da coluna download_id...');
    
    try {
      // Verificar se existe alguma referência problemática
      const videoSchema = await sequelize.query(
        "SELECT sql FROM sqlite_master WHERE type='table' AND name='videos';",
        { type: QueryTypes.SELECT }
      );
      
      if (videoSchema.length > 0) {
        console.log('✅ Tabela videos encontrada');
        console.log('📄 Schema atual:', videoSchema[0].sql);
        
        // Verificar se a coluna downloadId existe
        const columns = await sequelize.query(
          "PRAGMA table_info(videos);",
          { type: QueryTypes.SELECT }
        );
        
        const hasDownloadId = columns.some(col => col.name === 'downloadId' || col.name === 'download_id');
        console.log(`📊 Coluna downloadId existe: ${hasDownloadId}`);
        
        if (!hasDownloadId) {
          console.log('🔄 Adicionando coluna downloadId à tabela videos...');
          await sequelize.query(
            "ALTER TABLE videos ADD COLUMN downloadId INTEGER REFERENCES downloads(id);"
          );
          console.log('✅ Coluna downloadId adicionada');
        }
      }
    } catch (error) {
      console.log('⚠️ Erro ao verificar coluna download_id:', error.message);
    }
    
    // 3. Limpar tabelas backup problemáticas
    console.log('\n🗑️ Limpando tabelas backup problemáticas...');
    
    try {
      const backupTables = await sequelize.query(
        "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%_backup';",
        { type: QueryTypes.SELECT }
      );
      
      for (const table of backupTables) {
        console.log(`🗑️ Removendo tabela backup: ${table.name}`);
        await sequelize.query(`DROP TABLE IF EXISTS "${table.name}";`);
      }
      
      console.log('✅ Tabelas backup removidas');
    } catch (error) {
      console.log('⚠️ Erro ao limpar tabelas backup:', error.message);
    }
    
    // 4. Tentar sync seguro
    console.log('\n🔄 Tentando sincronização segura...');
    
    try {
      // Primeiro, tentar sync sem alter
      await sequelize.sync({ logging: console.log });
      console.log('✅ Sincronização bem-sucedida');
    } catch (syncError) {
      console.log('⚠️ Sync normal falhou, tentando recriação controlada...');
      
      // Se falhar, recriar apenas as tabelas problemáticas
      const { User, Download, Video } = require('../models');
      
      try {
        await User.sync({ force: true });
        console.log('✅ Tabela users recriada');
        
        await Download.sync({ force: true });
        console.log('✅ Tabela downloads recriada');
        
        await Video.sync({ force: true });
        console.log('✅ Tabela videos recriada');
        
        // Sync geral para outras tabelas
        await sequelize.sync();
        console.log('✅ Todas as tabelas sincronizadas');
        
      } catch (recreateError) {
        console.error('❌ Erro na recriação:', recreateError.message);
        throw recreateError;
      }
    }
    
    console.log('\n✅ Correção do banco de dados concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante correção:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  fixDatabaseIssues()
    .then(() => {
      console.log('🎉 Script concluído com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script falhou:', error);
      process.exit(1);
    });
}

module.exports = { fixDatabaseIssues };
