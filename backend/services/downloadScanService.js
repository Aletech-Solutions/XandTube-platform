const fs = require('fs-extra');
const path = require('path');
const { Download, Video, Channel } = require('../models');
const { Op } = require('sequelize');

/**
 * Serviço para escanear e processar downloads existentes na pasta
 */
class DownloadScanService {
  constructor() {
    this.downloadsPath = path.join(__dirname, '../../videos/downloads');
  }

  /**
   * Escaneia a pasta de downloads e registra arquivos não catalogados
   */
  async scanAndRegisterDownloads(options = {}) {
    const startTime = Date.now();
    const { 
      skipExisting = true, 
      batchSize = 10,
      logProgress = true 
    } = options;

    try {
      if (logProgress) {
        console.log('🔍 Iniciando escaneamento da pasta de downloads...');
      }
      
      if (!await fs.pathExists(this.downloadsPath)) {
        console.log('📁 Pasta de downloads não existe, criando...');
        await fs.ensureDir(this.downloadsPath);
        return [];
      }

      const files = await fs.readdir(this.downloadsPath);
      const infoFiles = files.filter(file => file.endsWith('.info.json'));
      
      if (logProgress) {
        console.log(`📊 Encontrados ${infoFiles.length} arquivos de metadados para análise`);
      }

      if (infoFiles.length === 0) {
        console.log('ℹ️ Nenhum arquivo .info.json encontrado');
        return [];
      }

      // Verificar quantos já existem no banco se skipExisting estiver ativo
      let existingCount = 0;
      if (skipExisting && infoFiles.length > 0) {
        const sampleIds = await this.extractYouTubeIds(infoFiles.slice(0, Math.min(infoFiles.length, 50)));
        const existingDownloads = await Download.count({
          where: {
            youtubeId: sampleIds
          }
        });
        existingCount = existingDownloads;
      }

      const processedDownloads = [];
      const errors = [];
      let processed = 0;
      let skipped = 0;

      // Processar em lotes para melhor performance
      for (let i = 0; i < infoFiles.length; i += batchSize) {
        const batch = infoFiles.slice(i, i + batchSize);
        
        for (const infoFile of batch) {
          try {
            const result = await this.processInfoFile(infoFile, { skipExisting });
            
            if (result === 'skipped') {
              skipped++;
            } else if (result) {
              processedDownloads.push(result);
            }
            processed++;

            // Log de progresso a cada 20 arquivos
            if (logProgress && processed % 20 === 0) {
              console.log(`📈 Progresso: ${processed}/${infoFiles.length} arquivos processados`);
            }
          } catch (error) {
            console.error(`❌ Erro ao processar ${infoFile}:`, error.message);
            errors.push({ file: infoFile, error: error.message });
          }
        }

        // Pequena pausa entre lotes para não sobrecarregar
        if (i + batchSize < infoFiles.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      const duration = Date.now() - startTime;
      
      if (logProgress) {
        console.log(`✅ Escaneamento concluído em ${duration}ms`);
        console.log(`📊 Estatísticas:`);
        console.log(`   • Total analisado: ${infoFiles.length} arquivos`);
        console.log(`   • Novos importados: ${processedDownloads.length}`);
        console.log(`   • Já existentes: ${skipped}`);
        console.log(`   • Erros: ${errors.length}`);
      }

      if (errors.length > 0 && errors.length < 10) {
        console.log('⚠️ Erros encontrados:');
        errors.forEach(err => console.log(`   • ${err.file}: ${err.error}`));
      } else if (errors.length >= 10) {
        console.log(`⚠️ ${errors.length} erros encontrados (muitos para exibir)`);
      }

      return processedDownloads;

    } catch (error) {
      console.error('❌ Erro crítico ao escanear downloads:', error);
      throw error;
    }
  }

  /**
   * Extrai YouTube IDs de uma lista de arquivos .info.json
   */
  async extractYouTubeIds(infoFiles) {
    const ids = [];
    
    for (const infoFile of infoFiles) {
      try {
        const infoPath = path.join(this.downloadsPath, infoFile);
        if (await fs.pathExists(infoPath)) {
          const metadata = JSON.parse(await fs.readFile(infoPath, 'utf8'));
          if (metadata.id) {
            ids.push(metadata.id);
          }
        }
      } catch (error) {
        // Ignorar erros individuais na extração de IDs
        continue;
      }
    }
    
    return ids;
  }

  /**
   * Processa um arquivo .info.json específico
   */
  async processInfoFile(infoFileName, options = {}) {
    const { skipExisting = true } = options;
    const infoPath = path.join(this.downloadsPath, infoFileName);
    
    try {
      // Verificar se o arquivo existe antes de tentar lê-lo
      if (!await fs.pathExists(infoPath)) {
        throw new Error(`Arquivo não encontrado: ${infoFileName}`);
      }
      
      // Lê o arquivo de metadados
      const metadata = JSON.parse(await fs.readFile(infoPath, 'utf8'));
      
      // Extrai informações básicas
      const youtubeId = metadata.id;
      const baseName = infoFileName.replace('.info.json', '');
      
      if (!youtubeId) {
        throw new Error(`YouTube ID não encontrado no arquivo ${infoFileName}`);
      }
      
      // Verifica se já existe no banco
      const existingDownload = await Download.findOne({
        where: { youtubeId: youtubeId }
      });

      if (existingDownload) {
        if (skipExisting) {
          return 'skipped'; // Indica que foi pulado
        } else {
          console.log(`⚠️ Download já existe no banco: ${metadata.title}`);
          return existingDownload;
        }
      }

      // Busca arquivos relacionados
      const videoFile = await this.findVideoFile(baseName);
      const thumbnailFile = await this.findThumbnailFile(baseName);

      if (!videoFile) {
        console.log(`⚠️ Arquivo de vídeo não encontrado para: ${baseName}`);
        return null;
      }

      // Obtém informações do arquivo
      const videoStats = await fs.stat(path.join(this.downloadsPath, videoFile));
      
      // Obter ou criar usuário padrão para sincronização
      const defaultUser = await this.getOrCreateDefaultUser();
      
      // Cria registro no banco
      const downloadData = {
        youtubeId: youtubeId,
        downloadId: `sync_${youtubeId}_${Date.now()}`, // ID único para sincronização
        title: metadata.title || 'Vídeo sem título',
        description: metadata.description || null,
        duration: this.parseDuration(metadata.duration),
        channelName: metadata.uploader || metadata.channel || 'Canal Desconhecido',
        channelId: metadata.uploader_id || metadata.channel_id || null,
        originalUrl: metadata.original_url || metadata.webpage_url || `https://youtube.com/watch?v=${youtubeId}`,
        quality: this.extractQuality(metadata),
        format: this.extractFormat(videoFile),
        resolution: this.extractResolution(metadata),
        fileSize: videoStats.size,
        videoPath: path.join(this.downloadsPath, videoFile),
        thumbnailPath: thumbnailFile ? path.join(this.downloadsPath, thumbnailFile) : null,
        infoPath: infoPath,
        status: 'completed',
        progress: 100,
        category: 'general', // Categoria padrão para vídeos sincronizados
        source: 'sync', // Fonte é sincronização automática
        metadata: metadata,
        downloadedAt: this.parseUploadDate(metadata.upload_date) || videoStats.birthtime || videoStats.mtime,
        userId: defaultUser.id
      };

      const download = await Download.create(downloadData);
      console.log(`✅ Registrado download: ${metadata.title}`);
      
      return download;

    } catch (error) {
      console.error(`❌ Erro ao processar ${infoFileName}:`, error);
      return null;
    }
  }

  /**
   * Busca arquivo de vídeo relacionado
   */
  async findVideoFile(baseName) {
    const files = await fs.readdir(this.downloadsPath);
    const videoExtensions = ['.mp4', '.webm', '.mkv', '.avi', '.mov'];
    
    for (const ext of videoExtensions) {
      const videoFile = `${baseName}${ext}`;
      if (files.includes(videoFile)) {
        return videoFile;
      }
    }
    return null;
  }

  /**
   * Busca arquivo de thumbnail relacionado
   */
  async findThumbnailFile(baseName) {
    const files = await fs.readdir(this.downloadsPath);
    const imageExtensions = ['.webp', '.jpg', '.jpeg', '.png', '.gif'];
    
    // Primeiro, tentar encontrar thumbnail exato
    for (const ext of imageExtensions) {
      const thumbFile = `${baseName}${ext}`;
      if (files.includes(thumbFile)) {
        return thumbFile;
      }
    }
    
    // Se não encontrar, tentar variações comuns
    const baseNameParts = baseName.split('_');
    if (baseNameParts.length > 1) {
      const videoId = baseNameParts[0]; // Primeiro parte é geralmente o YouTube ID
      
      for (const ext of imageExtensions) {
        // Tentar apenas com o ID do YouTube
        const thumbFile = `${videoId}${ext}`;
        if (files.includes(thumbFile)) {
          return thumbFile;
        }
        
        // Tentar com padrões comuns de thumbnail
        const patterns = [
          `${videoId}_thumbnail${ext}`,
          `${videoId}.thumb${ext}`,
          `${baseName}.thumb${ext}`
        ];
        
        for (const pattern of patterns) {
          if (files.includes(pattern)) {
            return pattern;
          }
        }
      }
    }
    
    return null;
  }

  /**
   * Extrai qualidade dos metadados
   */
  extractQuality(metadata) {
    // Tentar diferentes campos para qualidade
    if (metadata.format_note) {
      return metadata.format_note;
    }
    if (metadata.quality) {
      return metadata.quality;
    }
    if (metadata.height) {
      return `${metadata.height}p`;
    }
    if (metadata.format_id) {
      return metadata.format_id;
    }
    // Tentar extrair do formato selecionado
    if (metadata.format && typeof metadata.format === 'string') {
      const qualityMatch = metadata.format.match(/(\d+p|\d+x\d+)/);
      if (qualityMatch) {
        return qualityMatch[1];
      }
    }
    return 'best';
  }

  /**
   * Extrai formato do nome do arquivo
   */
  extractFormat(filename) {
    const ext = path.extname(filename).toLowerCase();
    return ext.replace('.', '');
  }

  /**
   * Extrai resolução dos metadados
   */
  extractResolution(metadata) {
    // Tentar diferentes campos para resolução
    if (metadata.width && metadata.height) {
      return `${metadata.width}x${metadata.height}`;
    }
    if (metadata.resolution) {
      return metadata.resolution;
    }
    // Tentar extrair do formato
    if (metadata.format && typeof metadata.format === 'string') {
      const resolutionMatch = metadata.format.match(/(\d+x\d+)/);
      if (resolutionMatch) {
        return resolutionMatch[1];
      }
    }
    // Tentar extrair do format_note
    if (metadata.format_note && typeof metadata.format_note === 'string') {
      const resolutionMatch = metadata.format_note.match(/(\d+x\d+)/);
      if (resolutionMatch) {
        return resolutionMatch[1];
      }
    }
    // Fallback baseado na altura
    if (metadata.height) {
      const commonResolutions = {
        240: '426x240',
        360: '640x360', 
        480: '854x480',
        720: '1280x720',
        1080: '1920x1080',
        1440: '2560x1440',
        2160: '3840x2160'
      };
      return commonResolutions[metadata.height] || `${Math.round(metadata.height * 16/9)}x${metadata.height}`;
    }
    return null;
  }

  /**
   * Atualiza registros existentes com dados faltantes
   */
  async updateExistingRecords() {
    console.log('🔄 Verificando e atualizando registros existentes...');
    
    // Buscar downloads que podem ter dados faltantes
    const incompleteDownloads = await Download.findAll({
      where: {
        [Op.or]: [
          { fileSize: null },
          { resolution: null },
          { quality: null },
          { thumbnailPath: null }
        ]
      },
      limit: 50
    });
    
    console.log(`📊 Encontrados ${incompleteDownloads.length} registros com dados faltantes`);
    
    let updated = 0;
    
    for (const download of incompleteDownloads) {
      try {
        const baseName = path.basename(download.videoPath, path.extname(download.videoPath));
        const infoPath = download.infoPath || path.join(this.downloadsPath, `${baseName}.info.json`);
        
        // Verificar se arquivo de info existe
        if (await fs.pathExists(infoPath)) {
          const metadata = JSON.parse(await fs.readFile(infoPath, 'utf8'));
          const updates = {};
          
          // Atualizar fileSize se estiver faltando
          if (!download.fileSize && await fs.pathExists(download.videoPath)) {
            const stats = await fs.stat(download.videoPath);
            updates.fileSize = stats.size;
          }
          
          // Atualizar resolução se estiver faltando
          if (!download.resolution) {
            updates.resolution = this.extractResolution(metadata);
          }
          
          // Atualizar qualidade se estiver faltando
          if (!download.quality) {
            updates.quality = this.extractQuality(metadata);
          }
          
          // Atualizar thumbnailPath se estiver faltando
          if (!download.thumbnailPath) {
            const thumbnailFile = await this.findThumbnailFile(baseName);
            if (thumbnailFile) {
              updates.thumbnailPath = path.join(this.downloadsPath, thumbnailFile);
            }
          }
          
          // Aplicar atualizações se houver
          if (Object.keys(updates).length > 0) {
            await download.update(updates);
            updated++;
            console.log(`✅ Atualizado: ${download.title}`);
          }
        }
      } catch (error) {
        console.error(`❌ Erro ao atualizar ${download.title}:`, error.message);
      }
    }
    
    console.log(`🎉 ${updated} registros atualizados com sucesso`);
    return updated;
  }

  /**
   * Lista todos os downloads do banco
   */
  async listDownloads(userId = null, limit = 50, offset = 0) {
    const whereClause = userId ? { userId } : {};
    
    return await Download.findAndCountAll({
      where: whereClause,
      order: [['downloadedAt', 'DESC']],
      limit,
      offset,
      include: [
        {
          association: 'user',
          attributes: ['id', 'username', 'email']
        }
      ]
    });
  }

  /**
   * Obtém estatísticas dos downloads
   */
  async getDownloadStats(userId = null) {
    const whereClause = userId ? { userId } : {};
    
    const total = await Download.count({ where: whereClause });
    const completed = await Download.count({ 
      where: { ...whereClause, status: 'completed' } 
    });
    const totalSize = await Download.sum('fileSize', { where: whereClause }) || 0;
    
    return {
      total,
      completed,
      totalSize,
      totalSizeFormatted: this.formatBytes(totalSize)
    };
  }

  /**
   * Obtém ou cria usuário padrão para sincronização
   */
  async getOrCreateDefaultUser() {
    const { User } = require('../models');
    
    let defaultUser = await User.findOne({ where: { username: 'syncuser' } });
    
    if (!defaultUser) {
      defaultUser = await User.create({
        username: 'syncuser',
        email: 'sync@xandtube.local',
        password: 'sync123',
        fullName: 'Usuário de Sincronização',
        role: 'user'
      });
      console.log('👤 Usuário padrão de sincronização criado');
    }
    
    return defaultUser;
  }

  /**
   * Converte duração para segundos
   */
  parseDuration(duration) {
    if (!duration) return null;
    if (typeof duration === 'number') return duration;
    
    // Se for string no formato HH:MM:SS ou MM:SS
    if (typeof duration === 'string') {
      const parts = duration.split(':').map(Number);
      if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
      } else if (parts.length === 2) {
        return parts[0] * 60 + parts[1];
      }
    }
    
    return null;
  }

  /**
   * Converte data de upload para Date
   */
  parseUploadDate(uploadDate) {
    if (!uploadDate) return null;
    
    if (typeof uploadDate === 'string' && uploadDate.match(/^\d{8}$/)) {
      // Formato YYYYMMDD
      const year = uploadDate.substring(0, 4);
      const month = uploadDate.substring(4, 6);
      const day = uploadDate.substring(6, 8);
      return new Date(`${year}-${month}-${day}`);
    }
    
    return new Date(uploadDate);
  }

  /**
   * Formata bytes em formato legível
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Converte um download em vídeo do sistema
   */
  async convertDownloadToVideo(downloadId, userId) {
    try {
      const download = await Download.findByPk(downloadId, {
        include: [{ association: 'associatedVideo' }]
      });

      if (!download) {
        throw new Error('Download não encontrado');
      }

      if (download.associatedVideo) {
        throw new Error('Download já possui vídeo associado');
      }

      // Verifica se o canal existe ou cria um novo
      let channel = null;
      if (download.channelId) {
        channel = await Channel.findOne({
          where: { youtubeChannelId: download.channelId }
        });

        if (!channel && download.channelName) {
          channel = await Channel.create({
            name: download.channelName,
            description: `Canal importado do YouTube: ${download.channelName}`,
            youtubeChannelId: download.channelId,
            user_id: userId,
            subscriberCount: 0
          });
        }
      }

      // Cria o vídeo
      const video = await Video.create({
        youtubeId: download.youtubeId,
        title: download.title,
        description: download.description,
        duration: download.duration,
        thumbnail: download.thumbnailPath,
        videoUrl: download.videoPath,
        originalUrl: download.originalUrl,
        views: 0,
        likes: 0,
        dislikes: 0,
        channelId: channel ? channel.id : null,
        userId: userId,
        tags: [],
        metadata: download.metadata,
        downloadProgress: 100,
        downloadStatus: 'completed',
        fileSize: download.fileSize,
        format: download.format,
        resolution: download.resolution,
        downloadId: download.id // Associa ao download
      });

      console.log(`✅ Vídeo criado a partir do download: ${download.title}`);
      return video;

    } catch (error) {
      console.error('❌ Erro ao converter download em vídeo:', error);
      throw error;
    }
  }

  /**
   * Converte múltiplos downloads em vídeos
   */
  async convertMultipleDownloadsToVideos(downloadIds, userId) {
    const results = [];
    
    for (const downloadId of downloadIds) {
      try {
        const video = await this.convertDownloadToVideo(downloadId, userId);
        results.push({ downloadId, video, success: true });
      } catch (error) {
        results.push({ downloadId, error: error.message, success: false });
      }
    }

    return results;
  }
}

module.exports = new DownloadScanService();