/**
 * Script para corrigir problemas de sincronização do banco de dados
 * Executa: node scripts/fix-database.js
 */

const sequelize = require('../config/database');
const { Video, Channel, User, Comment, Download } = require('../models');

async function fixDatabase() {
  try {
    console.log('🔧 Iniciando correção do banco de dados...');
    
    // Força a sincronização das tabelas, alterando as existentes
    console.log('📊 Sincronizando modelos com banco de dados...');
    await sequelize.sync({ alter: true });
    
    console.log('✅ Banco de dados sincronizado com sucesso!');
    
    // Verifica se as tabelas estão corretas
    console.log('🔍 Verificando estrutura das tabelas...');
    
    const [results] = await sequelize.query(`
      PRAGMA table_info(videos);
    `);
    
    console.log('📋 Estrutura da tabela videos:');
    results.forEach(column => {
      console.log(`  - ${column.name}: ${column.type} ${column.notnull ? 'NOT NULL' : ''} ${column.pk ? 'PRIMARY KEY' : ''}`);
    });
    
    // Verifica se a coluna download_id existe
    const hasDownloadId = results.some(column => column.name === 'download_id');
    
    if (hasDownloadId) {
      console.log('✅ Coluna download_id encontrada na tabela videos');
    } else {
      console.log('❌ Coluna download_id NÃO encontrada na tabela videos');
      console.log('🔧 Tentando adicionar a coluna manualmente...');
      
      try {
        await sequelize.query(`
          ALTER TABLE videos ADD COLUMN download_id INTEGER REFERENCES Downloads(id);
        `);
        console.log('✅ Coluna download_id adicionada com sucesso!');
      } catch (alterError) {
        console.error('❌ Erro ao adicionar coluna:', alterError.message);
      }
    }
    
    console.log('🎉 Correção do banco de dados concluída!');
    
  } catch (error) {
    console.error('❌ Erro ao corrigir banco de dados:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Executa se chamado diretamente
if (require.main === module) {
  fixDatabase();
}

module.exports = fixDatabase;