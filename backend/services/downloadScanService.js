const fs = require('fs-extra');
const path = require('path');
const { Download, Video, Channel } = require('../models');

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
  async scanAndRegisterDownloads() {
    try {
      console.log('🔍 Escaneando pasta de downloads...');
      
      if (!await fs.pathExists(this.downloadsPath)) {
        console.log('📁 Pasta de downloads não existe, criando...');
        await fs.ensureDir(this.downloadsPath);
        return [];
      }

      const files = await fs.readdir(this.downloadsPath);
      const infoFiles = files.filter(file => file.endsWith('.info.json'));
      
      console.log(`📊 Encontrados ${infoFiles.length} arquivos de metadados`);

      const processedDownloads = [];

      for (const infoFile of infoFiles) {
        try {
          const download = await this.processInfoFile(infoFile);
          if (download) {
            processedDownloads.push(download);
          }
        } catch (error) {
          console.error(`❌ Erro ao processar ${infoFile}:`, error.message);
        }
      }

      console.log(`✅ Processados ${processedDownloads.length} downloads`);
      return processedDownloads;

    } catch (error) {
      console.error('❌ Erro ao escanear downloads:', error);
      throw error;
    }
  }

  /**
   * Processa um arquivo .info.json específico
   */
  async processInfoFile(infoFileName) {
    const infoPath = path.join(this.downloadsPath, infoFileName);
    
    try {
      // Lê o arquivo de metadados
      const metadata = JSON.parse(await fs.readFile(infoPath, 'utf8'));
      
      // Extrai informações básicas
      const youtubeId = metadata.id;
      const baseName = infoFileName.replace('.info.json', '');
      
      // Verifica se já existe no banco
      const existingDownload = await Download.findOne({
        where: { youtubeId: youtubeId }
      });

      if (existingDownload) {
        console.log(`⚠️ Download já existe no banco: ${metadata.title}`);
        return existingDownload;
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
      
      // Cria registro no banco (usando user ID padrão 1 para downloads existentes)
      const downloadData = {
        youtubeId: youtubeId,
        downloadId: baseName, // Usa o basename como downloadId
        title: metadata.title || 'Título não disponível',
        description: metadata.description || null,
        duration: metadata.duration || null,
        channelName: metadata.uploader || metadata.channel || null,
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
        metadata: metadata,
        downloadedAt: videoStats.birthtime || videoStats.mtime,
        userId: 1 // User padrão para downloads existentes - você pode ajustar conforme necessário
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
    const imageExtensions = ['.webp', '.jpg', '.jpeg', '.png'];
    
    for (const ext of imageExtensions) {
      const thumbFile = `${baseName}${ext}`;
      if (files.includes(thumbFile)) {
        return thumbFile;
      }
    }
    return null;
  }

  /**
   * Extrai qualidade dos metadados
   */
  extractQuality(metadata) {
    if (metadata.format_note) {
      return metadata.format_note;
    }
    if (metadata.height) {
      return `${metadata.height}p`;
    }
    return 'unknown';
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
    if (metadata.width && metadata.height) {
      return `${metadata.width}x${metadata.height}`;
    }
    return null;
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