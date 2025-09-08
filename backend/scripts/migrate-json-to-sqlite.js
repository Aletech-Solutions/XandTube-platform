const fs = require('fs-extra');
const path = require('path');
const { ChannelImage, Download, syncDatabase } = require('../models');

/**
 * Script para migrar dados dos arquivos JSON para o banco SQLite
 */
async function migrateJsonToSqlite() {
  try {
    console.log('🔄 Iniciando migração de dados JSON para SQLite...');
    
    // Sincronizar banco primeiro
    await syncDatabase();
    
    // 1. Migrar channel-images.json
    await migrateChannelImages();
    
    // 2. Migrar downloads-cache.json (se necessário)
    await migrateDownloadsCache();
    
    console.log('✅ Migração concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante migração:', error);
    throw error;
  }
}

/**
 * Migra dados do channel-images.json para a tabela ChannelImage
 */
async function migrateChannelImages() {
  try {
    console.log('\n📋 Migrando channel-images.json...');
    
    const channelImagesPath = path.join(__dirname, '../../videos/channel-images.json');
    
    if (!(await fs.pathExists(channelImagesPath))) {
      console.log('ℹ️ Arquivo channel-images.json não encontrado, pulando...');
      return;
    }
    
    const channelImagesData = await fs.readJson(channelImagesPath);
    const channels = Object.keys(channelImagesData);
    
    console.log(`📊 Encontrados ${channels.length} canais com imagens`);
    
    let migrated = 0;
    let skipped = 0;
    
    for (const channelId of channels) {
      const channelData = channelImagesData[channelId];
      
      try {
        // Verificar se já existe
        const existing = await ChannelImage.findOne({ where: { channelId } });
        
        if (existing) {
          // Atualizar se necessário
          await existing.update({
            avatarFilename: channelData.avatar || null,
            bannerFilename: channelData.banner || null,
            avatarUrl: channelData.avatar ? `/api/images/avatar/${channelData.avatar}` : null,
            bannerUrl: channelData.banner ? `/api/images/banner/${channelData.banner}` : null
          });
          console.log(`🔄 Atualizado canal: ${channelId}`);
        } else {
          // Criar novo registro
          await ChannelImage.create({
            channelId,
            avatarFilename: channelData.avatar || null,
            bannerFilename: channelData.banner || null,
            avatarUrl: channelData.avatar ? `/api/images/avatar/${channelData.avatar}` : null,
            bannerUrl: channelData.banner ? `/api/images/banner/${channelData.banner}` : null
          });
          console.log(`✅ Migrado canal: ${channelId}`);
        }
        
        migrated++;
        
      } catch (channelError) {
        console.warn(`⚠️ Erro ao migrar canal ${channelId}:`, channelError.message);
        skipped++;
      }
    }
    
    console.log(`✅ Migração de imagens concluída: ${migrated} migrados, ${skipped} pulados`);
    
    // Fazer backup do arquivo JSON original
    const backupPath = path.join(__dirname, '../../videos/channel-images.json.backup');
    await fs.copy(channelImagesPath, backupPath);
    console.log(`💾 Backup criado: ${backupPath}`);
    
  } catch (error) {
    console.error('❌ Erro ao migrar channel-images.json:', error);
    throw error;
  }
}

/**
 * Migra dados do downloads-cache.json para a tabela Download (se necessário)
 */
async function migrateDownloadsCache() {
  try {
    console.log('\n📋 Verificando downloads-cache.json...');
    
    const downloadsCachePath = path.join(__dirname, '../../videos/downloads-cache.json');
    
    if (!(await fs.pathExists(downloadsCachePath))) {
      console.log('ℹ️ Arquivo downloads-cache.json não encontrado, pulando...');
      return;
    }
    
    // Verificar se já temos downloads no banco
    const existingDownloads = await Download.count();
    
    if (existingDownloads > 0) {
      console.log(`ℹ️ Já existem ${existingDownloads} downloads no banco, pulando migração do cache`);
      return;
    }
    
    const cacheData = await fs.readJson(downloadsCachePath);
    const downloads = cacheData.downloads || [];
    
    console.log(`📊 Encontrados ${downloads.length} downloads no cache`);
    
    if (downloads.length === 0) {
      console.log('ℹ️ Nenhum download encontrado no cache');
      return;
    }
    
    let migrated = 0;
    let skipped = 0;
    
    for (const downloadData of downloads) {
      try {
        // Verificar se já existe (por youtubeId)
        const existing = await Download.findOne({ 
          where: { youtubeId: downloadData.youtubeId } 
        });
        
        if (existing) {
          skipped++;
          continue;
        }
        
        // Verificar se o usuário admin existe, senão criar
        const { User } = require('../models');
        let adminUser = await User.findOne({ where: { username: 'admin' } });
        
        if (!adminUser) {
          adminUser = await User.create({
            username: 'admin',
            email: 'admin@xandtube.local',
            password: 'admin123',
            fullName: 'Administrador',
            role: 'admin'
          });
          console.log('✅ Usuário admin criado para migração');
        }
        
        // Criar registro no banco
        await Download.create({
          youtubeId: downloadData.youtubeId,
          downloadId: downloadData.downloadId || `cache_${downloadData.youtubeId}_${Date.now()}`,
          title: downloadData.title || 'Título não disponível',
          description: downloadData.description || null,
          duration: downloadData.duration || null,
          channelName: downloadData.channelName || null,
          channelId: downloadData.channelId || null,
          originalUrl: downloadData.originalUrl || `https://youtube.com/watch?v=${downloadData.youtubeId}`,
          quality: downloadData.quality || 'best',
          format: downloadData.format || 'mp4',
          resolution: downloadData.resolution || null,
          fileSize: downloadData.fileSize || null,
          videoPath: downloadData.videoPath || '',
          thumbnailPath: downloadData.thumbnailPath || null,
          infoPath: downloadData.infoPath || null,
          status: 'completed',
          progress: 100,
          metadata: downloadData.metadata || {},
          downloadedAt: downloadData.downloadedAt || new Date(),
          userId: adminUser.id
        });
        
        migrated++;
        console.log(`✅ Migrado download: ${downloadData.title}`);
        
      } catch (downloadError) {
        console.warn(`⚠️ Erro ao migrar download ${downloadData.youtubeId}:`, downloadError.message);
        skipped++;
      }
    }
    
    console.log(`✅ Migração de downloads concluída: ${migrated} migrados, ${skipped} pulados`);
    
    // Fazer backup do arquivo JSON original
    const backupPath = path.join(__dirname, '../../videos/downloads-cache.json.backup');
    await fs.copy(downloadsCachePath, backupPath);
    console.log(`💾 Backup criado: ${backupPath}`);
    
  } catch (error) {
    console.error('❌ Erro ao migrar downloads-cache.json:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  migrateJsonToSqlite()
    .then(() => {
      console.log('🎉 Migração concluída com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migração falhou:', error);
      process.exit(1);
    });
}

module.exports = { migrateJsonToSqlite, migrateChannelImages, migrateDownloadsCache };
